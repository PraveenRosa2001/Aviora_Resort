namespace AvioraResort.Services;

/// <summary>Outcome of one send attempt. Never throws at the caller.</summary>
public record EmailResult(bool Sent, string? Error = null)
{
    public static EmailResult Success() => new(true);
    public static EmailResult Failure(string why) => new(false, why);
}

public interface IEmailSender
{
    /// <summary>
    /// Sends one message. Returns the outcome rather than throwing, because
    /// every caller needs to record what happened either way — a failed send
    /// that vanishes into an exception is how a guest ends up believing they
    /// were answered.
    /// </summary>
    Task<EmailResult> SendAsync(
        string toAddress,
        string toName,
        string subject,
        string htmlBody,
        string plainTextBody,
        string? replyTo = null,
        CancellationToken cancellationToken = default);

    /// <summary>False when no SMTP host is configured — the caller can say so plainly.</summary>
    bool IsConfigured { get; }
}