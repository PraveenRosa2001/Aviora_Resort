namespace AvioraResort.Models.Entities;

/// <summary>A row of dbo.RatePlans with its feature bullets.</summary>
public class RatePlan
{
    public int RatePlanId { get; set; }
    public string RatePlanCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Badge { get; set; }
    public string? Tagline { get; set; }

    /// <summary>Positive = discount, negative = surcharge. All-Inclusive is -25.</summary>
    public decimal DiscountPercent { get; set; }

    public bool IsRefundable { get; set; }
    public int? CancellationHours { get; set; }
    public bool RequiresPrepayment { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<string> Features { get; set; } = new();
}

/// <summary>
/// One villa/plan combination with the nightly price already worked out.
/// Comes from dbo.vw_VillaRatePlanPrices - this is what gives every villa
/// three prices instead of one.
/// </summary>
public class VillaRatePlan
{
    public int VillaId { get; set; }
    public string RatePlanCode { get; set; } = string.Empty;
    public string RatePlanName { get; set; } = string.Empty;
    public string? Badge { get; set; }
    public string? Tagline { get; set; }
    public decimal EffectiveDiscountPercent { get; set; }
    public decimal PricePerNight { get; set; }
    public bool IsRefundable { get; set; }
    public int? CancellationHours { get; set; }
    public bool RequiresPrepayment { get; set; }
    public int DisplayOrder { get; set; }
    public bool HasOverride { get; set; }
    public bool IsOffered { get; set; } = true;

    public List<string> Features { get; set; } = new();
}

public class Addon
{
    public int AddonId { get; set; }
    public string AddonCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "LKR";
    public string? Icon { get; set; }
    public string ChargeBasis { get; set; } = "PerStay";
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public class PromoCode
{
    public int PromoId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DiscountPercent { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public int? MaxUses { get; set; }
    public int UsedCount { get; set; }
    public int MinNights { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>One line of the Sri Lankan tax cascade, from dbo.TaxComponents.</summary>
public class TaxComponent
{
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public decimal Percentage { get; set; }
    public int ApplyOrder { get; set; }
    public string? Notes { get; set; }
}