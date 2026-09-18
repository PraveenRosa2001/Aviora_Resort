using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace AvioraResort.Models.DTOs;

public class CreateInquiryDto
{
    [Required(ErrorMessage = "A first name is required"), MaxLength(60)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "A last name is required"), MaxLength(60)]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "An email address is required")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address")]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)] public string? Phone { get; set; }

    [Required(ErrorMessage = "Please choose a subject"), MaxLength(120)]
    public string Subject { get; set; } = string.Empty;

    [Required(ErrorMessage = "Please write your message")]
    [MinLength(10, ErrorMessage = "Please tell us a little more — at least 10 characters")]
    [MaxLength(4000, ErrorMessage = "Please keep the message under 4000 characters")]
    public string Message { get; set; } = string.Empty;

    /// <summary>email, whatsapp or phone.</summary>
    [MaxLength(20)] public string PreferredChannel { get; set; } = "email";

    [MaxLength(100)] public string? SourcePage { get; set; }
}

public class InquiryCreatedDto
{
    public bool Success { get; set; }
    public string ReferenceId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

public class InquiryLookupDto
{
    [FromQuery(Name = "email")] public string? Email { get; set; }
}

public class InquiryDto
{
    public string ReferenceId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string PreferredChannel { get; set; } = "email";
    public string Status { get; set; } = "New";
    public string Priority { get; set; } = "Normal";
    public bool IsRead { get; set; }
    public string? AssignedTo { get; set; }
    public bool IsRegisteredGuest { get; set; }
    public string? SourcePage { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string? FirstReadAt { get; set; }
    public string LastActivityAt { get; set; } = string.Empty;
    public string? ClosedAt { get; set; }
    public int ReplyCount { get; set; }
    public int NoteCount { get; set; }
    public int FailedCount { get; set; }
    public int HoursWaiting { get; set; }

    public List<InquiryReplyDto> Replies { get; set; } = new();
}

public class InquiryReplyDto
{
    public int Id { get; set; }
    public string Body { get; set; } = string.Empty;
    public string Channel { get; set; } = "email";
    public bool IsInternalNote { get; set; }
    public string Author { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;

    /// <summary>Recorded, Sent, Failed or NotApplicable.</summary>
    public string Delivery { get; set; } = "Recorded";
    public string? DeliveredAt { get; set; }
    public string? DeliveryError { get; set; }
}

/// <summary>
/// Returned by POST /api/admin/inquiries/{ref}/replies.
///
/// The reply is always recorded. <see cref="Sent"/> says whether the email
/// also left the building — two different outcomes that used to be reported
/// as one, which is how a guest ends up believing they were answered.
/// </summary>
public class ReplyResultDto
{
    public bool Recorded { get; set; }
    public bool Sent { get; set; }
    public int ReplyId { get; set; }
    public string Delivery { get; set; } = "Recorded";
    public string Message { get; set; } = string.Empty;
    public string? DeliveryError { get; set; }
}

public class InquiryCountsDto
{
    public int Unread { get; set; }
    public int New { get; set; }
    public int Open { get; set; }
    public int HighPriority { get; set; }
    public int Overdue { get; set; }
    public int Today { get; set; }
    public int Answered { get; set; }
    public int Total { get; set; }
    public int FailedDelivery { get; set; }
}

/* ---------------- administrator ---------------- */

public class InquirySearchDto
{
    [FromQuery(Name = "status")] public string? Status { get; set; }
    [FromQuery(Name = "unreadOnly")] public bool UnreadOnly { get; set; }
    [FromQuery(Name = "priority")] public string? Priority { get; set; }
    [FromQuery(Name = "search")] public string? Search { get; set; }
    [FromQuery(Name = "from")] public DateTime? From { get; set; }
    [FromQuery(Name = "to")] public DateTime? To { get; set; }
}

public class UpdateInquiryDto
{
    /// <summary>New, Open, Answered or Closed. Null leaves it alone.</summary>
    [MaxLength(20)] public string? Status { get; set; }

    /// <summary>Low, Normal or High. Null leaves it alone.</summary>
    [MaxLength(10)] public string? Priority { get; set; }

    public int? AssignedToUserId { get; set; }
    public bool ClearAssignment { get; set; }
}

public class AddInquiryReplyDto
{
    [Required(ErrorMessage = "The reply cannot be empty")]
    [MaxLength(8000)]
    public string Body { get; set; } = string.Empty;

    /// <summary>email, whatsapp, phone or note.</summary>
    [MaxLength(20)] public string Channel { get; set; } = "email";

    /// <summary>An internal note is never shown to the guest and does not mark the inquiry answered.</summary>
    public bool IsInternalNote { get; set; }
}

public class MarkReadDto
{
    public bool IsRead { get; set; } = true;
}