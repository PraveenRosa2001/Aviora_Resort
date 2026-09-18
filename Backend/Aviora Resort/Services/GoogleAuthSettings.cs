namespace AvioraResort.Services;

/// <summary>
/// Bound from the "GoogleAuth" section.
///
/// ClientId is PUBLIC by design — it is compiled into the frontend bundle and
/// sent to Google in the open. It is not a secret and does not belong in user
/// secrets.
///
/// The client SECRET is a different thing entirely, and this flow does not use
/// it. Google Identity Services returns an ID token directly to the browser;
/// the server verifies that token's signature against Google's published
/// keys. There is no authorization-code exchange, so there is nothing here an
/// attacker could steal.
/// </summary>
public class GoogleAuthSettings
{
    public string ClientId { get; set; } = string.Empty;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ClientId);
}