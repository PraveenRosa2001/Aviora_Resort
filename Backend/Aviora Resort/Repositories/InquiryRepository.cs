using Microsoft.Data.SqlClient;
using AvioraResort.Data;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public class InquiryRepository : IInquiryRepository
{
    private readonly SqlHelper _db;

    public InquiryRepository(SqlHelper db) => _db = db;

    public async Task<(int Status, string? ReferenceId, DateTime CreatedAt)> CreateAsync(
        CreateInquiryDto r, int? userId)
    {
        var row = await _db.QuerySingleAsync("dbo.usp_Inquiry_Create", p =>
        {
            p.AddWithValue("@FirstName", r.FirstName);
            p.AddWithValue("@LastName", r.LastName);
            p.AddWithValue("@Email", r.Email);
            p.AddWithValue("@Phone", (object?)r.Phone ?? DBNull.Value);
            p.AddWithValue("@Subject", r.Subject);
            p.AddWithValue("@Message", r.Message);
            p.AddWithValue("@PreferredChannel", r.PreferredChannel);
            p.AddWithValue("@UserId", (object?)userId ?? DBNull.Value);
            p.AddWithValue("@SourcePage", (object?)r.SourcePage ?? DBNull.Value);
        },
        rd => (Status: rd.GetInt("Status"),
               ReferenceId: rd.GetNullableString("ReferenceId"),
               CreatedAt: rd.GetDate("CreatedAt")));

        return row;
    }

    /// <summary>Full row — used by the desk list and the detail screen.</summary>
    private static ContactInquiry MapFull(SqlDataReader rd) => new()
    {
        InquiryId = rd.GetInt("InquiryId"),
        ReferenceId = rd.GetStringValue("ReferenceId"),
        FirstName = rd.GetStringValue("FirstName"),
        LastName = rd.GetStringValue("LastName"),
        Email = rd.GetStringValue("Email"),
        Phone = rd.GetNullableString("Phone"),
        Subject = rd.GetStringValue("Subject"),
        Message = rd.GetStringValue("Message"),
        PreferredChannel = rd.GetStringValue("PreferredChannel"),
        Status = rd.GetStringValue("Status"),
        Priority = rd.GetStringValue("Priority"),
        IsRead = rd.GetBool("IsRead"),
        AssignedToName = rd.GetNullableString("AssignedToName"),
        IsRegisteredGuest = rd.GetBool("IsRegisteredGuest"),
        SourcePage = rd.GetNullableString("SourcePage"),
        CreatedAt = rd.GetDate("CreatedAt"),
        FirstReadAt = rd.GetNullableDate("FirstReadAt"),
        LastActivityAt = rd.GetDate("LastActivityAt"),
        ClosedAt = rd.GetNullableDate("ClosedAt"),
        ReplyCount = rd.GetInt("ReplyCount"),
        NoteCount = rd.GetInt("NoteCount"),
        FailedCount = rd.GetInt("FailedCount"),
        HoursWaiting = rd.GetInt("HoursWaiting")
    };

    private static InquiryReply MapReply(SqlDataReader rd, bool includeInternalFlag) => new()
    {
        ReplyId = includeInternalFlag ? rd.GetInt("ReplyId") : 0,
        Body = rd.GetStringValue("Body"),
        Channel = rd.GetStringValue("Channel"),
        IsInternalNote = includeInternalFlag && rd.GetBool("IsInternalNote"),
        AuthorName = rd.GetStringValue("AuthorName"),
        CreatedAt = rd.GetDate("CreatedAt"),

        // The guest projection does not select these columns, so they are
        // only read on the desk's own query. A guest is shown Sent because
        // by the time they can see a reply, it reached them.
        DeliveryStatus = includeInternalFlag ? rd.GetStringValue("DeliveryStatus") : "Sent",
        DeliveredAt = includeInternalFlag ? rd.GetNullableDate("DeliveredAt") : null,
        DeliveryError = includeInternalFlag ? rd.GetNullableString("DeliveryError") : null
    };

    public Task<ContactInquiry?> GetByReferenceForGuestAsync(string referenceId, string email) =>
        _db.QueryMultipleAsync("dbo.usp_Inquiry_GetByReference", p =>
        {
            p.AddWithValue("@ReferenceId", referenceId);
            p.AddWithValue("@Email", email);
        },
        async rd =>
        {
            if (!await rd.ReadAsync()) return (ContactInquiry?)null;

            // The guest projection is narrower than the desk's - no InquiryId,
            // no assignment, no counts - so it is mapped here rather than
            // reusing MapFull.
            var inquiry = new ContactInquiry
            {
                ReferenceId = rd.GetStringValue("ReferenceId"),
                FirstName = rd.GetStringValue("FirstName"),
                LastName = rd.GetStringValue("LastName"),
                Email = rd.GetStringValue("Email"),
                Phone = rd.GetNullableString("Phone"),
                Subject = rd.GetStringValue("Subject"),
                Message = rd.GetStringValue("Message"),
                PreferredChannel = rd.GetStringValue("PreferredChannel"),
                Status = rd.GetStringValue("Status"),
                Priority = rd.GetStringValue("Priority"),
                CreatedAt = rd.GetDate("CreatedAt"),
                LastActivityAt = rd.GetDate("LastActivityAt"),
                ClosedAt = rd.GetNullableDate("ClosedAt")
            };

            // Second result set holds only replies the guest may see - the
            // procedure filters internal notes out in SQL, not here.
            if (await rd.NextResultAsync())
            {
                while (await rd.ReadAsync())
                    inquiry.Replies.Add(MapReply(rd, includeInternalFlag: false));
            }

            inquiry.ReplyCount = inquiry.Replies.Count;
            return inquiry;
        });

    public Task<List<ContactInquiry>> GetByUserAsync(int userId) =>
        _db.QueryListAsync("dbo.usp_Inquiry_GetByUser",
            p => p.AddWithValue("@UserId", userId),
            rd => new ContactInquiry
            {
                ReferenceId = rd.GetStringValue("ReferenceId"),
                Subject = rd.GetStringValue("Subject"),
                Message = rd.GetStringValue("Message"),
                PreferredChannel = rd.GetStringValue("PreferredChannel"),
                Status = rd.GetStringValue("Status"),
                Priority = rd.GetStringValue("Priority"),
                CreatedAt = rd.GetDate("CreatedAt"),
                LastActivityAt = rd.GetDate("LastActivityAt"),
                ClosedAt = rd.GetNullableDate("ClosedAt"),
                ReplyCount = rd.GetInt("ReplyCount")
            });

    public Task<List<ContactInquiry>> SearchAsync(InquirySearchDto f) =>
        _db.QueryListAsync("dbo.usp_Admin_Inquiry_Search", p =>
        {
            p.AddWithValue("@Status", (object?)f.Status ?? DBNull.Value);
            p.AddWithValue("@UnreadOnly", f.UnreadOnly);
            p.AddWithValue("@Priority", (object?)f.Priority ?? DBNull.Value);
            p.AddWithValue("@Search", (object?)f.Search ?? DBNull.Value);
            p.AddWithValue("@From", (object?)f.From?.Date ?? DBNull.Value);
            p.AddWithValue("@To", (object?)f.To?.Date ?? DBNull.Value);
        }, MapFull);

    public Task<ContactInquiry?> GetDetailAsync(string referenceId) =>
        _db.QueryMultipleAsync("dbo.usp_Admin_Inquiry_GetDetail",
            p => p.AddWithValue("@ReferenceId", referenceId),
            async rd =>
            {
                if (!await rd.ReadAsync()) return (ContactInquiry?)null;

                var inquiry = MapFull(rd);

                // Internal notes ARE included here — this is the desk's view.
                if (await rd.NextResultAsync())
                {
                    while (await rd.ReadAsync())
                        inquiry.Replies.Add(MapReply(rd, includeInternalFlag: true));
                }

                inquiry.ReplyCount = inquiry.Replies.Count(r => !r.IsInternalNote);
                inquiry.NoteCount = inquiry.Replies.Count(r => r.IsInternalNote);
                return inquiry;
            });

    public async Task<InquiryCounts> GetCountsAsync()
    {
        var row = await _db.QuerySingleAsync("dbo.usp_Admin_Inquiry_GetCounts", _ => { },
            rd => new InquiryCounts
            {
                UnreadCount = rd.GetInt("UnreadCount"),
                NewCount = rd.GetInt("NewCount"),
                OpenCount = rd.GetInt("OpenCount"),
                HighPriorityCount = rd.GetInt("HighPriorityCount"),
                OverdueCount = rd.GetInt("OverdueCount"),
                TodayCount = rd.GetInt("TodayCount"),
                AnsweredCount = rd.GetInt("AnsweredCount"),
                TotalCount = rd.GetInt("TotalCount"),
                FailedDeliveryCount = rd.GetInt("FailedDeliveryCount")
            });

        return row ?? new InquiryCounts();
    }

    public Task<int> MarkReadAsync(string referenceId, bool isRead) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Inquiry_MarkRead", p =>
        {
            p.AddWithValue("@ReferenceId", referenceId);
            p.AddWithValue("@IsRead", isRead);
        });

    public Task<int> SetStatusAsync(string referenceId, UpdateInquiryDto r) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Inquiry_SetStatus", p =>
        {
            p.AddWithValue("@ReferenceId", referenceId);
            p.AddWithValue("@NewStatus", (object?)r.Status ?? DBNull.Value);
            p.AddWithValue("@Priority", (object?)r.Priority ?? DBNull.Value);
            p.AddWithValue("@AssignedToUserId", (object?)r.AssignedToUserId ?? DBNull.Value);
            p.AddWithValue("@ClearAssignment", r.ClearAssignment);
        });

    public async Task<(int Status, int ReplyId, string? Email, string? FirstName,
                       string? LastName, string? Subject, string? OriginalMessage,
                       DateTime OriginalSentAt)>
        AddReplyAsync(string referenceId, int? authorUserId, AddInquiryReplyDto r)
    {
        var row = await _db.QuerySingleAsync("dbo.usp_Admin_Inquiry_AddReply", p =>
        {
            p.AddWithValue("@ReferenceId", referenceId);
            p.AddWithValue("@AuthorUserId", (object?)authorUserId ?? DBNull.Value);
            p.AddWithValue("@Body", r.Body);
            p.AddWithValue("@Channel", r.Channel);
            p.AddWithValue("@IsInternalNote", r.IsInternalNote);
        },
        rd => (
            Status: rd.GetInt("Status"),
            ReplyId: rd.GetNullableInt("ReplyId") ?? 0,
            Email: rd.GetNullableString("Email"),
            FirstName: rd.GetNullableString("FirstName"),
            LastName: rd.GetNullableString("LastName"),
            Subject: rd.GetNullableString("Subject"),
            OriginalMessage: rd.GetNullableString("OriginalMessage"),
            OriginalSentAt: rd.GetNullableDate("OriginalSentAt") ?? DateTime.UtcNow));

        return row;
    }

    public Task<int> SetDeliveryAsync(int replyId, string status, string? error) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Inquiry_SetDelivery", p =>
        {
            p.AddWithValue("@ReplyId", replyId);
            p.AddWithValue("@Status", status);
            p.AddWithValue("@Error", (object?)error ?? DBNull.Value);
        });
}