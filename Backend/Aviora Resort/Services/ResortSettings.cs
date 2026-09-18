namespace AvioraResort.Services;

/// <summary>
/// The contact details printed in outbound mail. Configuration rather than
/// constants, so changing the concierge number does not need a rebuild.
/// </summary>
public class ResortSettings
{
    public string ContactEmail { get; set; } = "concierge@aviora.com";
    public string ContactPhone { get; set; } = "+94 11 234 5678";
}