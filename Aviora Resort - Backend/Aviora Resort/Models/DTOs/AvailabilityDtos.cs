using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace AvioraResort.Models.DTOs;

/// <summary>Answer to "can I book this villa for these dates?"</summary>
public class AvailabilityResultDto
{
    public bool Available { get; set; }
    public string VillaId { get; set; } = string.Empty;
    public string CheckIn { get; set; } = string.Empty;
    public string CheckOut { get; set; } = string.Empty;
    public int Nights { get; set; }
    public int UnitsAvailable { get; set; }

    /// <summary>Machine-readable reason: Ok, NotFound, InvalidRange, OutsideHorizon, Blocked, SoldOut, MinNights.</summary>
    public string Reason { get; set; } = "Ok";
    public string Message { get; set; } = string.Empty;

    /// <summary>The first night that caused the refusal, so the picker can highlight it.</summary>
    public string? FirstProblemDate { get; set; }
}

/// <summary>One night in the date-picker calendar.</summary>
public class CalendarNightDto
{
    public string Date { get; set; } = string.Empty;   // yyyy-MM-dd
    public int UnitsAvailable { get; set; }
    public int TotalUnits { get; set; }
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public int MinNights { get; set; }
    public decimal PricePerNight { get; set; }
    public bool HasPriceOverride { get; set; }
    public bool IsBookable { get; set; }
}

/// <summary>Optional stay dates on GET /api/villas.</summary>
public class StayDatesDto
{
    [FromQuery(Name = "checkIn")] public DateTime? CheckIn { get; set; }
    [FromQuery(Name = "checkOut")] public DateTime? CheckOut { get; set; }

    /// <summary>Drop villas that cannot take the stay instead of listing them greyed out.</summary>
    [FromQuery(Name = "onlyAvailable")] public bool OnlyAvailable { get; set; }
}

/* ---------------- administrator ---------------- */

public class InventoryGridDto
{
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public List<InventoryVillaRowDto> Villas { get; set; } = new();
}

public class InventoryVillaRowDto
{
    public string Id { get; set; } = string.Empty;   // VillaCode
    public string Name { get; set; } = string.Empty;
    public int TotalUnits { get; set; }
    public decimal PricePerNight { get; set; }
    public int UnitNights { get; set; }
    public int UnitNightsSold { get; set; }
    public int BlockedNights { get; set; }
    public decimal OccupancyPercent { get; set; }
    public List<CalendarNightDto> Nights { get; set; } = new();
}

/// <summary>
/// A bulk edit across a date range. Every nullable field means "leave alone",
/// which lets an administrator block a week without touching prices.
/// </summary>
public class SetInventoryRangeDto
{
    [Required] public DateTime From { get; set; }
    [Required] public DateTime To { get; set; }

    [Range(0, 500)] public int? TotalUnits { get; set; }
    public bool? IsBlocked { get; set; }
    [MaxLength(200)] public string? BlockReason { get; set; }
    [Range(1, 100000000)] public decimal? PriceOverride { get; set; }

    /// <summary>NULL already means "no change", so removing an override needs its own flag.</summary>
    public bool ClearPriceOverride { get; set; }

    [Range(1, 30)] public int? MinNights { get; set; }

    /// <summary>Restrict to certain weekdays, SQL Server numbering: 1 = Sunday. e.g. "1,7".</summary>
    [MaxLength(20)] public string? DaysOfWeek { get; set; }
}