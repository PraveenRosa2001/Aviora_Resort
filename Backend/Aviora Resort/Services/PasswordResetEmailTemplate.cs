using System.Net;

namespace AvioraResort.Services;

/// <summary>
/// The password reset email.
///
/// This message *is* the authentication factor. Everything about it is
/// shaped by that:
///
///   - The link is the only content that matters, so it gets the full width
///     of the message and nothing competes with it.
///   - The expiry is stated twice — beside the button and in the footer —
///     because the most common support question about a reset link is "why
///     did it stop working".
///   - The raw URL appears as text underneath. Corporate mail gateways
///     rewrite anchors for scanning, and a rewritten link that fails leaves
///     the guest with nothing to copy.
///   - "If you did not ask for this" is prominent, not a footnote. An
///     unexpected reset email is the earliest warning a person gets that
///     someone is trying their account.
///
/// Tables and inline styles, for the same reason as the concierge reply:
/// Outlook on Windows renders with Word's engine, and Gmail strips external
/// stylesheets.
/// </summary>
public static class PasswordResetEmailTemplate
{
    private const string Ink = "#2b1e14";
    private const string Muted = "#6f6257";
    private const string Primary = "#6b4423";
    private const string Sand = "#f6f2ee";
    private const string Hairline = "#e2d9d0";

    public const string Subject = "Reset your Aviora Resort password";

    public static string BuildHtml(
        string firstName,
        string resetUrl,
        int validMinutes,
        string requestedFrom,
        string resortEmail,
        string resortPhone)
    {
        var name = WebUtility.HtmlEncode(firstName);

        // The URL goes into an href and into visible text. Encoding is not
        // optional: a token is base64url, and although '-' and '_' are safe,
        // building HTML by concatenation without encoding is the habit that
        // eventually ships an injection.
        var url = WebUtility.HtmlEncode(resetUrl);

        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
<meta charset=""utf-8"" />
<meta name=""viewport"" content=""width=device-width, initial-scale=1"" />
<title>Reset your password</title>
</head>
<body style=""margin:0;padding:0;background-color:{Sand};"">

<!-- Preheader. Shown beside the subject in the inbox list, hidden in the
     message. Without one, clients pull the first visible text - which here
     would be the resort's name, telling the reader nothing. -->
<div style=""display:none;max-height:0;overflow:hidden;opacity:0;"">
  Your password reset link, valid for {validMinutes} minutes.
</div>

<table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0""
       style=""background-color:{Sand};padding:24px 12px;"">
  <tr>
    <td align=""center"">

      <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0""
             style=""max-width:560px;background-color:#ffffff;border:1px solid {Hairline};
                    border-radius:12px;overflow:hidden;"">

        <tr>
          <td style=""background-color:{Ink};padding:26px 32px;"">
            <div style=""font-family:Georgia,'Times New Roman',serif;font-size:22px;
                        font-style:italic;color:#f0e6da;"">
              Aviora Resort
            </div>
            <div style=""font-family:Helvetica,Arial,sans-serif;font-size:10px;
                        letter-spacing:0.18em;text-transform:uppercase;color:#c9a227;
                        padding-top:6px;"">
              Account Security
            </div>
          </td>
        </tr>

        <tr>
          <td style=""padding:32px 32px 8px;"">
            <p style=""margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;
                      font-size:16px;color:{Ink};"">
              Dear {name},
            </p>
            <p style=""margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;
                      line-height:1.65;color:{Ink};"">
              Someone asked to reset the password for the Aviora Resort account
              registered to this address. Choose a new one below.
            </p>
          </td>
        </tr>

        <!-- The button. Bulletproof pattern: the padding is on the anchor, not
             the cell, so Outlook does not collapse it into a bare link. -->
        <tr>
          <td align=""center"" style=""padding:26px 32px 12px;"">
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"">
              <tr>
                <td align=""center"" bgcolor=""{Primary}"" style=""border-radius:8px;"">
                  <a href=""{url}""
                     style=""display:inline-block;padding:15px 40px;font-family:Helvetica,Arial,sans-serif;
                            font-size:13px;font-weight:bold;letter-spacing:0.12em;
                            text-transform:uppercase;color:#ffffff;text-decoration:none;
                            border-radius:8px;"">
                    Choose a New Password
                  </a>
                </td>
              </tr>
            </table>

            <div style=""font-family:Helvetica,Arial,sans-serif;font-size:11px;color:{Muted};
                        padding-top:12px;"">
              This link works once, and expires in {validMinutes} minutes.
            </div>
          </td>
        </tr>

        <!-- The raw URL. Corporate gateways rewrite anchors for scanning, and
             a rewritten link that fails leaves the reader with nothing to
             copy. word-break keeps it inside the card. -->
        <tr>
          <td style=""padding:8px 32px 24px;"">
            <div style=""font-family:Helvetica,Arial,sans-serif;font-size:10px;
                        letter-spacing:0.14em;text-transform:uppercase;color:{Muted};
                        padding-bottom:6px;"">
              Or paste this into your browser
            </div>
            <div style=""font-family:'Courier New',monospace;font-size:11px;color:{Primary};
                        background-color:{Sand};border:1px solid {Hairline};border-radius:6px;
                        padding:10px 12px;word-break:break-all;line-height:1.5;"">
              {url}
            </div>
          </td>
        </tr>

        <!-- Prominent, not a footnote. An unexpected reset email is the
             earliest warning a person gets that someone is trying their
             account. -->
        <tr>
          <td style=""padding:0 32px 28px;"">
            <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0""
                   style=""background-color:#fdf6ec;border-left:3px solid #c9a227;
                          border-radius:0 8px 8px 0;"">
              <tr>
                <td style=""padding:14px 16px;font-family:Helvetica,Arial,sans-serif;
                           font-size:12px;line-height:1.6;color:{Ink};"">
                  <strong>If you did not ask for this</strong>, no action is needed —
                  your password has not changed and this link will expire on its own.
                  If these keep arriving, please tell us at
                  <a href=""mailto:{WebUtility.HtmlEncode(resortEmail)}""
                     style=""color:{Primary};"">{WebUtility.HtmlEncode(resortEmail)}</a>.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style=""background-color:{Ink};padding:20px 32px;"">
            <div style=""font-family:Helvetica,Arial,sans-serif;font-size:11px;
                        line-height:1.7;color:#b8ab9c;"">
              Requested {WebUtility.HtmlEncode(requestedFrom)} &middot; valid {validMinutes} minutes &middot; single use
              <br />
              <a href=""mailto:{WebUtility.HtmlEncode(resortEmail)}"" style=""color:#c9a227;text-decoration:none;"">
                {WebUtility.HtmlEncode(resortEmail)}</a>
              &nbsp;&middot;&nbsp; {WebUtility.HtmlEncode(resortPhone)}
            </div>
          </td>
        </tr>

      </table>

      <div style=""font-family:Helvetica,Arial,sans-serif;font-size:10px;color:{Muted};
                  padding-top:14px;max-width:560px;"">
        Aviora Resort will never ask you for your password by email or telephone.
      </div>

    </td>
  </tr>
</table>

</body>
</html>";
    }

    /// <summary>
    /// The text/plain alternative. Several filters score an HTML-only message
    /// as likely spam, and a reset mail landing in spam is a support call.
    /// </summary>
    public static string BuildPlainText(
        string firstName,
        string resetUrl,
        int validMinutes,
        string requestedFrom,
        string resortEmail,
        string resortPhone)
        => $"""
           AVIORA RESORT — ACCOUNT SECURITY

           Dear {firstName},

           Someone asked to reset the password for the Aviora Resort account
           registered to this address. Open the link below to choose a new one.

           {resetUrl}

           This link works once, and expires in {validMinutes} minutes.

           ------------------------------------------------------------
           IF YOU DID NOT ASK FOR THIS

           No action is needed. Your password has not changed and the link
           will expire on its own. If these keep arriving, please tell us at
           {resortEmail}.

           ------------------------------------------------------------
           Requested {requestedFrom} · valid {validMinutes} minutes · single use
           {resortEmail} · {resortPhone}

           Aviora Resort will never ask you for your password by email or
           telephone.
           """;
}