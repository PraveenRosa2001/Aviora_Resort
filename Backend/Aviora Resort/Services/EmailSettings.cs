namespace AvioraResort.Services;

/// <summary>
/// SMTP configuration, bound from the "Email" section.
///
/// The password does NOT belong in appsettings.json. That file is in source
/// control, which is the same exposure the EmailJS public key had — just
/// moved from the browser bundle to the repository. Use
/// `dotnet user-secrets` in development and environment variables in
/// production; see PATCHES.md.
/// </summary>
public class EmailSettings
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;

    /// <summary>
    /// STARTTLS on 587 is the normal choice. Set false only for a local relay
    /// such as Papercut or MailHog, which speak plain SMTP on 25 or 1025.
    /// </summary>
    public bool UseStartTls { get; set; } = true;

    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// The address the guest sees. Must be on a domain whose SPF and DKIM
    /// records name this server, or the message lands in spam — which is the
    /// usual reason a "sent" reply never arrives.
    /// </summary>
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "Aviora Resort Concierge";

    /// <summary>Where a guest's reply goes. Falls back to FromAddress.</summary>
    public string? ReplyTo { get; set; }

    /// <summary>
    /// When false the sender logs the message instead of connecting. Lets the
    /// whole flow be exercised — record, template, delivery stamp — before any
    /// SMTP credentials exist.
    /// </summary>
    public bool Enabled { get; set; }

    public bool IsConfigured =>
        Enabled
        && !string.IsNullOrWhiteSpace(Host)
        && !string.IsNullOrWhiteSpace(FromAddress);
}