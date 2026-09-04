using System.ComponentModel.DataAnnotations;

namespace AvioraResort.Models.DTOs;

/// <summary>
/// A rate plan as the guest sees it. When returned inside a villa, PricePerNight
/// is that villa's base rate with this plan's modifier already applied.
/// </summary>
public class RatePlanDto
{
    public string Id { get; set; } = string.Empty;   // RatePlanCode
    public string Name { get; set; } = string.Empty;
    public string? Badge { get; set; }
    public string? Tagline { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal? PricePerNight { get; set; }   // null on the standalone list
    public bool IsRefundable { get; set; }
    public int? CancellationHours { get; set; }
    public bool RequiresPrepayment { get; set; }
    public bool HasOverride { get; set; }
    public bool IsOffered { get; set; } = true;
    public List<string> Features { get; set; } = new();
}

public class AddonDto
{
    public string Id { get; set; } = string.Empty;   // AddonCode
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "LKR";
    public string? Icon { get; set; }
    public string ChargeBasis { get; set; } = "PerStay";
}

public class PromoValidationRequestDto
{
    [Required, MaxLength(30)]
    public string Code { get; set; } = string.Empty;

    /// <summary>Nights in the stay. Some codes carry a minimum.</summary>
    [Range(1, 365)]
    public int Nights { get; set; } = 1;
}

public class PromoValidationResultDto
{
    public bool Valid { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal DiscountPercent { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// The Sri Lankan tax cascade, so the checkout can itemise it rather than
/// printing a single opaque percentage.
/// </summary>
public class TaxBreakdownDto
{
    public List<TaxComponentDto> Components { get; set; } = new();

    /// <summary>Net x Multiplier = gross. 1.3437545 with the seeded rates.</summary>
    public decimal Multiplier { get; set; }

    /// <summary>The same figure as a percentage: 34.38.</summary>
    public decimal TotalPercent { get; set; }
}

public class TaxComponentDto
{
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public decimal Percentage { get; set; }
    public int ApplyOrder { get; set; }
    public string? Notes { get; set; }
}

/* ---------------- administrator ---------------- */

public class SaveRatePlanRequestDto
{
    [Required, MaxLength(30)]
    [RegularExpression("^[a-z0-9-]+$",
        ErrorMessage = "The rate plan code may contain lowercase letters, numbers and hyphens only")]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(120)] public string Name { get; set; } = string.Empty;
    [MaxLength(50)] public string? Badge { get; set; }
    [MaxLength(300)] public string? Tagline { get; set; }

    [Range(-100, 100, ErrorMessage = "The modifier must be between -100 and 100")]
    public decimal DiscountPercent { get; set; }

    public bool IsRefundable { get; set; } = true;
    [Range(0, 8760)] public int? CancellationHours { get; set; }
    public bool RequiresPrepayment { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;

    /// <summary>Complete bullet list. Sent whole; it replaces the stored set.</summary>
    public List<string> Features { get; set; } = new();
}

public class SaveAddonRequestDto
{
    [Required, MaxLength(30)]
    [RegularExpression("^[a-z0-9-]+$")]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(120)] public string Name { get; set; } = string.Empty;
    [MaxLength(400)] public string? Description { get; set; }

    [Range(0, 100000000)] public decimal Price { get; set; }

    [MaxLength(20)] public string? Icon { get; set; }
    [MaxLength(20)] public string ChargeBasis { get; set; } = "PerStay";
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class SavePromoCodeRequestDto
{
    [Required, MaxLength(30)] public string Code { get; set; } = string.Empty;
    [MaxLength(200)] public string? Description { get; set; }

    [Range(0.01, 100)] public decimal DiscountPercent { get; set; }

    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    [Range(1, 1000000)] public int? MaxUses { get; set; }
    [Range(1, 365)] public int MinNights { get; set; } = 1;
    public bool IsActive { get; set; } = true;
}

/// <summary>Which plans a villa offers, and any per-villa override.</summary>
public class SaveVillaRatePlansRequestDto
{
    public List<VillaRatePlanSettingDto> Plans { get; set; } = new();
}

public class VillaRatePlanSettingDto
{
    [Required, MaxLength(30)] public string RatePlanId { get; set; } = string.Empty;
    public bool IsOffered { get; set; } = true;
    [Range(-100, 100)] public decimal? DiscountPercentOverride { get; set; }
}