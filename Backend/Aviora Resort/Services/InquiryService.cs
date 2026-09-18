using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;
using Microsoft.Extensions.Options;
using AvioraResort.Repositories;

namespace AvioraResort.Services;

/// <summary>
/// Concierge inquiries, captured to the database rather than sent as mail.
///
/// Nothing in this service sends email, and that is the design. A system that
/// cannot send mail cannot silently fail to send mail — which is exactly what
/// the EmailJS version did every time a send failed, leaving no record that a
/// guest had ever written.
///
/// What an email provider was doing is replaced piece by piece: the reference
/// number is the acknowledgement, the unread count is the notification, the
/// desk's own mail client is the sender, and dbo.InquiryReplies is the shared
/// mailbox.
/// </summary>
public class InquiryService : IInquiryService
{
    private readonly IInquiryRepository _inquiries;
    private readonly ILogger<InquiryService> _logger;
    private readonly IEmailSender _email;
    private readonly ResortSettings _resort;

    public InquiryService(IInquiryRepository inquiries,
                          ILogger<InquiryService> logger,
                          IEmailSender email,
                          IOptions<ResortSettings> resort)
    {
        _inquiries = inquiries;
        _logger = logger;
        _email = email;
        _resort = resort.Value;
    }

    private const string DateFmt = "yyyy-MM-dd";
    private const string StampFmt = "yyyy-MM-dd'T'HH:mm:ss'Z'";

    private static readonly string[] Statuses = { "New", "Open", "Answered", "Closed" };
    private static readonly string[] Priorities = { "Low", "Normal", "High" };

    /// <summary>
    /// What the search filter accepts. "All" is a real value the procedure
    /// understands - it is not the absence of a filter, and must survive as
    /// far as SQL.
    /// </summary>
    private static readonly string[] SearchStatuses =
        { "All", "New", "Open", "Answered", "Closed" };
    private static readonly string[] Channels = { "email", "whatsapp", "phone" };
    private static readonly string[] ReplyChannels = { "email", "whatsapp", "phone", "note" };

    /* ================= guest ================= */

    public async Task<ServiceResult<InquiryCreatedDto>> CreateAsync(CreateInquiryDto r, int? userId)
    {
        r.FirstName = r.FirstName.Trim();
        r.LastName = r.LastName.Trim();
        r.Email = r.Email.Trim().ToLowerInvariant();
        r.Phone = string.IsNullOrWhiteSpace(r.Phone) ? null : r.Phone.Trim();
        r.Subject = r.Subject.Trim();
        r.Message = r.Message.Trim();
        r.PreferredChannel = (r.PreferredChannel ?? "email").Trim().ToLowerInvariant();

        if (!Channels.Contains(r.PreferredChannel)) r.PreferredChannel = "email";

        // A WhatsApp reply needs somewhere to send it. Catching this here
        // rather than at the desk saves a message that cannot be answered.
        if (r.PreferredChannel is "whatsapp" or "phone" && string.IsNullOrWhiteSpace(r.Phone))
            return ServiceResult<InquiryCreatedDto>.Fail(
                "A telephone number is needed for us to reply that way.", 400);

        var (status, referenceId, createdAt) = await _inquiries.CreateAsync(r, userId);

        if (status != 1 || referenceId is null)
        {
            // The one failure in this module that loses a guest's message.
            // Logged with the address so the desk can follow up manually if
            // somebody reports writing and hearing nothing.
            _logger.LogError(
                "Inquiry capture FAILED for {Email} - subject {Subject}. Procedure returned {Status}.",
                r.Email, r.Subject, status);

            return ServiceResult<InquiryCreatedDto>.Fail(
                "Your message could not be recorded. Please try again, or telephone " +
                "the resort directly.", 500);
        }

        return ServiceResult<InquiryCreatedDto>.Ok(new InquiryCreatedDto
        {
            Success = true,
            ReferenceId = referenceId,
            Message = $"Your message is with our concierge team. Quote {referenceId} " +
                          "if you contact us about it.",
            CreatedAt = createdAt.ToString(StampFmt)
        });
    }

    public async Task<ServiceResult<InquiryDto>> LookupAsync(string referenceId, string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return ServiceResult<InquiryDto>.Fail(
                "Please give the email address the message was sent from.", 400);

        var inquiry = await _inquiries.GetByReferenceForGuestAsync(
            referenceId.Trim().ToUpperInvariant(), email.Trim().ToLowerInvariant());

        // One message for both "no such reference" and "wrong email", so the
        // endpoint cannot be used to discover which references exist.
        return inquiry is null
            ? ServiceResult<InquiryDto>.Fail(
                "No message was found for that reference and email address.", 404)
            : ServiceResult<InquiryDto>.Ok(ToDto(inquiry));
    }

    public async Task<ServiceResult<List<InquiryDto>>> GetMyInquiriesAsync(int userId)
    {
        var rows = await _inquiries.GetByUserAsync(userId);
        return ServiceResult<List<InquiryDto>>.Ok(rows.Select(ToDto).ToList());
    }

    /* ================= desk ================= */

    public async Task<ServiceResult<List<InquiryDto>>> SearchAsync(InquirySearchDto filter)
    {
        // Canonicalise rather than lower-case. The old Normalise returned
        // "answered" for "Answered", which then failed a title-case allow-list
        // and produced a 400 on every status filter the screen offered - and
        // it mapped "All" to null, so Full history silently fell back to New
        // and Open.
        var status = Canonical(filter.Status, SearchStatuses);
        var priority = Canonical(filter.Priority, Priorities);

        if (status.Invalid)
            return ServiceResult<List<InquiryDto>>.Fail(
                $"Status must be one of: {string.Join(", ", SearchStatuses)}.", 400);

        if (priority.Invalid)
            return ServiceResult<List<InquiryDto>>.Fail(
                $"Priority must be one of: {string.Join(", ", Priorities)}.", 400);

        filter.Status = status.Value;
        filter.Priority = priority.Value;

        var rows = await _inquiries.SearchAsync(filter);
        return ServiceResult<List<InquiryDto>>.Ok(rows.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<InquiryDto>> GetDetailAsync(string referenceId)
    {
        var inquiry = await _inquiries.GetDetailAsync(referenceId.Trim().ToUpperInvariant());

        return inquiry is null
            ? ServiceResult<InquiryDto>.Fail("That inquiry could not be found.", 404)
            : ServiceResult<InquiryDto>.Ok(ToDto(inquiry));
    }

    public async Task<ServiceResult<InquiryCountsDto>> GetCountsAsync()
    {
        var c = await _inquiries.GetCountsAsync();

        return ServiceResult<InquiryCountsDto>.Ok(new InquiryCountsDto
        {
            Unread = c.UnreadCount,
            New = c.NewCount,
            Open = c.OpenCount,
            HighPriority = c.HighPriorityCount,
            Overdue = c.OverdueCount,
            Today = c.TodayCount,
            Answered = c.AnsweredCount,
            Total = c.TotalCount,
            FailedDelivery = c.FailedDeliveryCount
        });
    }

    public async Task<ServiceResult<string>> MarkReadAsync(string referenceId, MarkReadDto request)
    {
        var rows = await _inquiries.MarkReadAsync(referenceId.Trim().ToUpperInvariant(), request.IsRead);

        return rows > 0
            ? ServiceResult<string>.Ok(request.IsRead ? "Marked as read." : "Marked as unread.")
            : ServiceResult<string>.Fail("That inquiry could not be found.", 404);
    }

    public async Task<ServiceResult<string>> UpdateAsync(string referenceId, UpdateInquiryDto request)
    {
        // Named for what they are, not "status" - the procedure's return code
        // further down already owns that name, and both being called status is
        // how the two got confused in the first place.
        var wantedStatus = Canonical(request.Status, Statuses);
        var wantedPriority = Canonical(request.Priority, Priorities);

        if (wantedStatus.Invalid || wantedPriority.Invalid)
            return ServiceResult<string>.Fail(
                $"Status must be one of: {string.Join(", ", Statuses)}; " +
                $"priority one of: {string.Join(", ", Priorities)}.", 400);

        request.Status = wantedStatus.Value;
        request.Priority = wantedPriority.Value;

        if (request.Status is null && request.Priority is null
            && request.AssignedToUserId is null && !request.ClearAssignment)
            return ServiceResult<string>.Fail("Nothing was changed.", 400);

        var result = await _inquiries.SetStatusAsync(referenceId.Trim().ToUpperInvariant(), request);

        return result switch
        {
            1 => ServiceResult<string>.Ok("Inquiry updated."),
            -1 => ServiceResult<string>.Fail("That inquiry could not be found.", 404),
            -2 => ServiceResult<string>.Fail(
                      $"Status must be one of: {string.Join(", ", Statuses)}; " +
                      $"priority one of: {string.Join(", ", Priorities)}.", 400),
            _ => ServiceResult<string>.Fail("The inquiry could not be updated.", 500)
        };
    }

    public async Task<ServiceResult<ReplyResultDto>> AddReplyAsync(
        string referenceId, int? authorUserId, string authorName, AddInquiryReplyDto request)
    {
        request.Body = request.Body.Trim();
        request.Channel = (request.Channel ?? "email").Trim().ToLowerInvariant();

        if (request.Body.Length == 0)
            return ServiceResult<ReplyResultDto>.Fail("The reply cannot be empty.", 400);

        if (!ReplyChannels.Contains(request.Channel))
            return ServiceResult<ReplyResultDto>.Fail(
                $"Channel must be one of: {string.Join(", ", ReplyChannels)}.", 400);

        // 'note' and the internal flag mean the same thing. Letting them
        // disagree would put an internal remark into the guest's thread.
        if (request.Channel == "note") request.IsInternalNote = true;
        if (request.IsInternalNote) request.Channel = "note";

        // RECORD FIRST. Everything below this line can fail without losing
        // what the desk wrote.
        var row = await _inquiries.AddReplyAsync(
            referenceId.Trim().ToUpperInvariant(), authorUserId, request);

        if (row.Status != 1)
            return ServiceResult<ReplyResultDto>.Fail("That inquiry could not be found.", 404);

        // A note goes nowhere; a telephone call was delivered by the telephone;
        // a WhatsApp message was sent in WhatsApp. Only email needs sending.
        if (request.IsInternalNote || request.Channel is "phone" or "whatsapp")
        {
            return ServiceResult<ReplyResultDto>.Ok(new ReplyResultDto
            {
                Recorded = true,
                Sent = false,
                ReplyId = row.ReplyId,
                Delivery = "NotApplicable",
                Message = request.IsInternalNote
                    ? "Note added. The guest does not see this."
                    : $"Recorded against {referenceId}. Nothing was emailed."
            });
        }

        var reference = referenceId.Trim().ToUpperInvariant();
        var subject = InquiryEmailTemplate.BuildSubject(row.Subject ?? "your inquiry", reference);

        var result = await _email.SendAsync(
            toAddress: row.Email!,
            toName: $"{row.FirstName} {row.LastName}".Trim(),
            subject: subject,
            htmlBody: InquiryEmailTemplate.BuildHtml(
                           row.FirstName ?? "Guest", reference, row.Subject ?? "",
                           row.OriginalMessage ?? "", row.OriginalSentAt, request.Body,
                           authorName, _resort.ContactEmail, _resort.ContactPhone),
            plainTextBody: InquiryEmailTemplate.BuildPlainText(
                           row.FirstName ?? "Guest", reference, row.Subject ?? "",
                           row.OriginalMessage ?? "", row.OriginalSentAt, request.Body,
                           authorName, _resort.ContactEmail, _resort.ContactPhone),
            replyTo: _resort.ContactEmail);

        // Stamp the outcome onto the reply either way. A failure that is not
        // written down is a guest who believes they were answered.
        await _inquiries.SetDeliveryAsync(
            row.ReplyId, result.Sent ? "Sent" : "Failed", result.Error);

        if (!result.Sent)
            _logger.LogError(
                "Reply {ReplyId} on {Reference} recorded but NOT sent to {Email}: {Error}",
                row.ReplyId, reference, row.Email, result.Error);

        return ServiceResult<ReplyResultDto>.Ok(new ReplyResultDto
        {
            Recorded = true,
            Sent = result.Sent,
            ReplyId = row.ReplyId,
            Delivery = result.Sent ? "Sent" : "Failed",
            DeliveryError = result.Error,
            Message = result.Sent
                ? $"Reply sent to {row.Email}."
                : "Reply recorded, but the email could not be sent. It is marked " +
                  "Failed on the thread so it is not mistaken for answered."
        });
    }

    /* ================= mapping ================= */

    /// <summary>
    /// Matches a value against an allow-list without caring about casing, and
    /// returns the list's own spelling.
    ///
    /// Comparing case-sensitively against title-case tokens meant "answered"
    /// and "Answered" were different things depending on which layer you asked,
    /// which is a fault waiting for whichever one guesses differently. The
    /// procedure compares NVARCHAR values, so what reaches SQL has to be the
    /// canonical spelling.
    ///
    /// An empty value is absence of a filter, not an error.
    /// </summary>
    private static (string? Value, bool Invalid) Canonical(string? value, string[] allowed)
    {
        if (string.IsNullOrWhiteSpace(value)) return (null, false);

        var trimmed = value.Trim();
        var match = allowed.FirstOrDefault(
            a => a.Equals(trimmed, StringComparison.OrdinalIgnoreCase));

        return match is null ? (null, true) : (match, false);
    }

    private static InquiryDto ToDto(ContactInquiry i) => new()
    {
        ReferenceId = i.ReferenceId,
        FirstName = i.FirstName,
        LastName = i.LastName,
        Email = i.Email,
        Phone = i.Phone,
        Subject = i.Subject,
        Message = i.Message,
        PreferredChannel = i.PreferredChannel,
        Status = i.Status,
        Priority = i.Priority,
        IsRead = i.IsRead,
        AssignedTo = i.AssignedToName,
        IsRegisteredGuest = i.IsRegisteredGuest,
        SourcePage = i.SourcePage,
        CreatedAt = i.CreatedAt.ToString(StampFmt),
        FirstReadAt = i.FirstReadAt?.ToString(StampFmt),
        LastActivityAt = i.LastActivityAt.ToString(StampFmt),
        ClosedAt = i.ClosedAt?.ToString(StampFmt),
        ReplyCount = i.ReplyCount,
        NoteCount = i.NoteCount,
        FailedCount = i.FailedCount,
        HoursWaiting = i.HoursWaiting,
        Replies = i.Replies.Select(r => new InquiryReplyDto
        {
            Id = r.ReplyId,
            Body = r.Body,
            Channel = r.Channel,
            IsInternalNote = r.IsInternalNote,
            Author = r.AuthorName,
            CreatedAt = r.CreatedAt.ToString(StampFmt),
            Delivery = r.DeliveryStatus,
            DeliveredAt = r.DeliveredAt?.ToString(StampFmt),
            DeliveryError = r.DeliveryError
        }).ToList()
    };
}