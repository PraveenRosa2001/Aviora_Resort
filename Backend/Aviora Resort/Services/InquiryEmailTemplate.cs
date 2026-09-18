using System.Net;
using System.Text;

namespace AvioraResort.Services;

/// <summary>
/// The concierge reply email.
///
/// Two design constraints shape this more than taste does:
///
///   1. **Tables, inline styles, no flexbox.** Outlook on Windows renders
///      with Microsoft Word's engine. Grid, flex and most of `position` do
///      nothing there, and an external stylesheet is stripped by Gmail. What
///      looks like 2003 markup is what actually survives.
///
///   2. **Everything the guest wrote is HTML-encoded.** Their message is
///      quoted back, and a message containing `&lt;script&gt;` — or more likely an
///      ampersand in a villa name — would otherwise break the mail or, in a
///      webmail client, do worse.
/// </summary>
public static class InquiryEmailTemplate
{
    private const string Ink = "#2b1e14";
    private const string Muted = "#6f6257";
    private const string Primary = "#6b4423";
    private const string Sand = "#f6f2ee";
    private const string Hairline = "#e2d9d0";

    /// <summary>
    /// Subject line. The reference in brackets is deliberate: most mail
    /// clients thread on it, so a guest's answer to this lands beside the
    /// original rather than starting a new conversation.
    /// </summary>
    public static string BuildSubject(string originalSubject, string referenceId)
        => $"Re: {originalSubject} [{referenceId}]";

    public static string BuildHtml(
        string guestFirstName,
        string referenceId,
        string originalSubject,
        string originalMessage,
        DateTime originalSentAt,
        string replyBody,
        string authorName,
        string resortEmail,
        string resortPhone)
    {
        // Encode first, then turn newlines into <br> - the other order would
        // encode the tags we just inserted.
        string Encode(string value) =>
            WebUtility.HtmlEncode(value ?? string.Empty).Replace("\n", "<br />");

        var sent = originalSentAt.ToString("d MMMM yyyy 'at' HH:mm") + " UTC";

        var html = new StringBuilder();

        html.Append($@"<!DOCTYPE html>
<html lang=""en"">
<head>
<meta charset=""utf-8"" />
<meta name=""viewport"" content=""width=device-width, initial-scale=1"" />
<title>{WebUtility.HtmlEncode(originalSubject)}</title>
</head>
<body style=""margin:0;padding:0;background-color:{Sand};"">

<!-- Preheader: the grey line a client shows beside the subject in the
     inbox list. Hidden in the message itself. Without one, clients pull
     the first visible text, which here would be the resort's address. -->
<div style=""display:none;max-height:0;overflow:hidden;opacity:0;"">
  A reply from the Aviora Resort concierge regarding {WebUtility.HtmlEncode(originalSubject)}.
</div>

<table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0""
       style=""background-color:{Sand};padding:24px 12px;"">
  <tr>
    <td align=""center"">

      <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0""
             style=""max-width:600px;background-color:#ffffff;border:1px solid {Hairline};
                    border-radius:12px;overflow:hidden;"">

        <!-- Letterhead -->
        <tr>
          <td style=""background-color:{Ink};padding:28px 32px;"">
            <div style=""font-family:Georgia,'Times New Roman',serif;font-size:24px;
                        font-style:italic;color:#f0e6da;letter-spacing:0.01em;"">
              Aviora Resort
            </div>
            <div style=""font-family:Helvetica,Arial,sans-serif;font-size:10px;
                        letter-spacing:0.18em;text-transform:uppercase;color:#c9a227;
                        padding-top:6px;"">
              Rainforest &amp; Lagoon Sanctuary &middot; Sri Lanka
            </div>
          </td>
        </tr>

        <!-- Reference bar -->
        <tr>
          <td style=""background-color:{Sand};padding:12px 32px;border-bottom:1px solid {Hairline};"">
            <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
              <tr>
                <td style=""font-family:Helvetica,Arial,sans-serif;font-size:10px;
                           letter-spacing:0.14em;text-transform:uppercase;color:{Muted};"">
                  Your reference
                </td>
                <td align=""right"" style=""font-family:'Courier New',monospace;font-size:13px;
                           font-weight:bold;color:{Primary};"">
                  {WebUtility.HtmlEncode(referenceId)}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- The reply -->
        <tr>
          <td style=""padding:32px;"">
            <p style=""margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;
                      font-size:16px;color:{Ink};"">
              Dear {WebUtility.HtmlEncode(guestFirstName)},
            </p>

            <div style=""font-family:Georgia,'Times New Roman',serif;font-size:15px;
                        line-height:1.65;color:{Ink};"">
              {Encode(replyBody)}
            </div>

            <p style=""margin:26px 0 0;font-family:Georgia,'Times New Roman',serif;
                      font-size:15px;line-height:1.5;color:{Ink};"">
              With warm regards,<br />
              <strong>{WebUtility.HtmlEncode(authorName)}</strong><br />
              <span style=""color:{Muted};font-size:13px;"">The Concierge, Aviora Resort</span>
            </p>
          </td>
        </tr>

        <!-- What they wrote. Quoted so the answer makes sense weeks later,
             and so a guest with several open questions knows which one
             this is. -->
        <tr>
          <td style=""padding:0 32px 28px;"">
            <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0""
                   style=""background-color:{Sand};border-left:3px solid {Primary};
                          border-radius:0 8px 8px 0;"">
              <tr>
                <td style=""padding:16px 18px;"">
                  <div style=""font-family:Helvetica,Arial,sans-serif;font-size:10px;
                              letter-spacing:0.14em;text-transform:uppercase;color:{Muted};
                              padding-bottom:8px;"">
                    Your message &middot; {WebUtility.HtmlEncode(sent)}
                  </div>
                  <div style=""font-family:Helvetica,Arial,sans-serif;font-size:12px;
                              font-weight:bold;color:{Ink};padding-bottom:6px;"">
                    {WebUtility.HtmlEncode(originalSubject)}
                  </div>
                  <div style=""font-family:Georgia,'Times New Roman',serif;font-size:13px;
                              line-height:1.6;color:{Muted};"">
                    {Encode(originalMessage)}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style=""background-color:{Ink};padding:22px 32px;"">
            <div style=""font-family:Helvetica,Arial,sans-serif;font-size:11px;
                        line-height:1.7;color:#b8ab9c;"">
              <a href=""mailto:{WebUtility.HtmlEncode(resortEmail)}""
                 style=""color:#c9a227;text-decoration:none;"">{WebUtility.HtmlEncode(resortEmail)}</a>
              &nbsp;&middot;&nbsp; {WebUtility.HtmlEncode(resortPhone)}
              <br />
              Simply reply to this message and it will reach the same desk.
            </div>
          </td>
        </tr>

      </table>

      <div style=""font-family:Helvetica,Arial,sans-serif;font-size:10px;color:{Muted};
                  padding-top:14px;max-width:600px;"">
        You are receiving this because you contacted Aviora Resort using
        reference {WebUtility.HtmlEncode(referenceId)}.
      </div>

    </td>
  </tr>
</table>

</body>
</html>");

        return html.ToString();
    }

    /// <summary>
    /// The text/plain alternative. Not a fallback nobody reads — several
    /// filters score an HTML-only message as likely spam, and some corporate
    /// clients render nothing else.
    /// </summary>
    public static string BuildPlainText(
        string guestFirstName,
        string referenceId,
        string originalSubject,
        string originalMessage,
        DateTime originalSentAt,
        string replyBody,
        string authorName,
        string resortEmail,
        string resortPhone)
    {
        var sent = originalSentAt.ToString("d MMMM yyyy 'at' HH:mm") + " UTC";
        var quoted = string.Join("\n", (originalMessage ?? "").Split('\n').Select(l => "> " + l));

        return $"""
                AVIORA RESORT
                Rainforest & Lagoon Sanctuary, Sri Lanka

                Your reference: {referenceId}
                ------------------------------------------------------------

                Dear {guestFirstName},

                {replyBody}

                With warm regards,
                {authorName}
                The Concierge, Aviora Resort

                ------------------------------------------------------------
                YOUR MESSAGE — {sent}
                {originalSubject}

                {quoted}

                ------------------------------------------------------------
                {resortEmail} · {resortPhone}
                Simply reply to this message and it will reach the same desk.

                You are receiving this because you contacted Aviora Resort
                using reference {referenceId}.
                """;
    }
}