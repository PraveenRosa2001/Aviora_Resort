namespace AvioraResort.Services;

/// <summary>
/// Password reset policy, bound from the "Security" section.
/// </summary>
public class SecuritySettings
{
    /// <summary>
    /// How long a reset link lives. Thirty minutes is the working figure:
    /// long enough for a guest to find the mail on another device, short
    /// enough that a link left in an inbox on a shared machine stops being a
    /// key to the account before the day is out.
    /// </summary>
    public int ResetTokenMinutes { get; set; } = 30;

    /// <summary>
    /// Where the emailed link points. The token is appended as ?token=...
    ///
    /// Configuration, not a constant, because the value differs between the
    /// dev server and a deployment — and a reset link that points at
    /// localhost is useless in every inbox but the developer's.
    /// </summary>
    public string ResetUrlBase { get; set; } = "http://localhost:5173/reset-password";
}