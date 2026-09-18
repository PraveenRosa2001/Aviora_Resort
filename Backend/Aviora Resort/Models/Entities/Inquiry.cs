namespace AvioraResort.Models.Entities;

public class ContactInquiry
{
    public int InquiryId { get; set; }
    public string ReferenceId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    /// <summary>How the guest asked to be answered: email, whatsapp or phone.</summary>
    public string PreferredChannel { get; set; } = "email";

    public string Status { get; set; } = "New";
    public string Priority { get; set; } = "Normal";

    /// <summary>Drives the console badge. Distinct from Status — an inquiry can be read and still open.</summary>
    public bool IsRead { get; set; }

    public string? AssignedToName { get; set; }
    public bool IsRegisteredGuest { get; set; }
    public string? SourcePage { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? FirstReadAt { get; set; }
    public DateTime LastActivityAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    public int ReplyCount { get; set; }
    public int NoteCount { get; set; }

    /// <summary>
    /// Replies the mail server refused. Surfaced on the list row — the
    /// inquiry looks answered otherwise, and the guest received nothing.
    /// </summary>
    public int FailedCount { get; set; }

    /// <summary>An unanswered message is the only thing on the desk that gets worse with time.</summary>
    public int HoursWaiting { get; set; }

    public List<InquiryReply> Replies { get; set; } = new();
}

public class InquiryReply
{
    public int ReplyId { get; set; }
    public string Body { get; set; } = string.Empty;
    public string Channel { get; set; } = "email";

    /// <summary>Never returned to a guest — this is the desk talking to itself.</summary>
    public bool IsInternalNote { get; set; }

    public string AuthorName { get; set; } = "Aviora Concierge";
    public DateTime CreatedAt { get; set; }

    /// <summary>Recorded, Sending, Sent, Failed or NotApplicable.</summary>
    public string DeliveryStatus { get; set; } = "Recorded";
    public DateTime? DeliveredAt { get; set; }

    /// <summary>The mail server's own message, kept for whoever has to work out why.</summary>
    public string? DeliveryError { get; set; }
}

/// <summary>Result of usp_Admin_Inquiry_GetCounts.</summary>
public class InquiryCounts
{
    public int UnreadCount { get; set; }
    public int NewCount { get; set; }
    public int OpenCount { get; set; }
    public int HighPriorityCount { get; set; }
    public int OverdueCount { get; set; }
    public int TodayCount { get; set; }

    /// <summary>So a fully answered desk shows work done rather than five zeros.</summary>
    public int AnsweredCount { get; set; }
    public int TotalCount { get; set; }

    /// <summary>Replies the mail server refused. Zero is the only acceptable value.</summary>
    public int FailedDeliveryCount { get; set; }
}