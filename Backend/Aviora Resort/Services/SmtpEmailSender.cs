using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using MimeKit.Text;

namespace AvioraResort.Services;

/// <summary>
/// SMTP delivery through MailKit.
///
/// Not System.Net.Mail.SmtpClient — Microsoft marked that obsolete for new
/// development, and their own documentation points here.
///
/// Every send returns an EmailResult rather than throwing. The caller has
/// already written the reply to the database by the time this runs, so its
/// job is to report the outcome accurately, not to unwind anything.
/// </summary>
public class SmtpEmailSender : IEmailSender
{
    private readonly EmailSettings _settings;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<EmailSettings> settings, ILogger<SmtpEmailSender> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public bool IsConfigured => _settings.IsConfigured;

    public async Task<EmailResult> SendAsync(
        string toAddress,
        string toName,
        string subject,
        string htmlBody,
        string plainTextBody,
        string? replyTo = null,
        CancellationToken cancellationToken = default)
    {
        if (!_settings.IsConfigured)
        {
            // Not an error - the whole flow still works, the message just goes
            // to the log instead of a mail server. Lets the desk exercise
            // record → template → delivery stamp before any credentials exist.
            _logger.LogWarning(
                "SMTP is not configured. Message NOT sent to {To}. Subject: {Subject}\n{Body}",
                toAddress, subject, plainTextBody);

            return EmailResult.Failure(
                "Email is not configured on this server, so the reply was recorded " +
                "but not sent. Set the Email section in configuration.");
        }

        try
        {
            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
            message.To.Add(new MailboxAddress(toName, toAddress));
            message.Subject = subject;

            // Reply-To, not From. Spoofing the From address is what gets a
            // domain marked as spam by SPF and DKIM - the message must come
            // from the resort and reply to whoever should receive the answer.
            var replyAddress = replyTo ?? _settings.ReplyTo ?? _settings.FromAddress;
            message.ReplyTo.Add(MailboxAddress.Parse(replyAddress));

            // Both parts. A text/plain alternative is not decoration: several
            // filters score an HTML-only message as likely spam, and some
            // corporate clients still render nothing else.
            message.Body = new MultipartAlternative
            {
                new TextPart(TextFormat.Plain) { Text = plainTextBody },
                new TextPart(TextFormat.Html)  { Text = htmlBody }
            };

            using var client = new SmtpClient();

            var socketOptions = _settings.UseStartTls
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.Auto;

            await client.ConnectAsync(_settings.Host, _settings.Port, socketOptions, cancellationToken);

            // A local relay such as Papercut accepts anonymous mail; a real
            // provider will not. Only authenticate when a username exists.
            if (!string.IsNullOrWhiteSpace(_settings.Username))
                await client.AuthenticateAsync(_settings.Username, _settings.Password, cancellationToken);

            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Email sent to {To}. Subject: {Subject}", toAddress, subject);
            return EmailResult.Success();
        }
        catch (AuthenticationException ex)
        {
            // Worth its own branch - it is the most common failure by a wide
            // margin, and the fix is specific.
            _logger.LogError(ex, "SMTP authentication failed for {Host}", _settings.Host);

            return EmailResult.Failure(
                "The mail server rejected the credentials. For Gmail this means an " +
                "app password is required rather than the account password.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email to {To} failed", toAddress);

            // Trimmed - DeliveryError is NVARCHAR(500), and the full trace is
            // in the log anyway.
            var detail = ex.Message.Length > 400 ? ex.Message[..400] : ex.Message;
            return EmailResult.Failure(detail);
        }
    }
}