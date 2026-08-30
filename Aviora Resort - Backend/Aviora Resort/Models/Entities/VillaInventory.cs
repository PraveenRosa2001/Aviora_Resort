namespace AvioraResort.Models.Entities;

/// <summary>
/// One villa, one night. Availability is a property of a villa AND a date,
/// which is why dbo.Villas.AvailableSlots could never express it.
/// </summary>
public class VillaInventoryNight
{
    public int VillaId { get; set; }
    public DateTime StayDate { get; set; }
    public int TotalUnits { get; set; }
    public int UnitsBooked { get; set; }
    public int UnitsAvailable { get; set; }
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public int MinNights { get; set; }
    public decimal PricePerNight { get; set; }
    public bool HasPriceOverride { get; set; }
    public bool IsBookable { get; set; }
}

/// <summary>Result of usp_Villa_CheckAvailability.</summary>
public class AvailabilityCheck
{
    public int Status { get; set; }
    public int UnitsAvailable { get; set; }
    public int Nights { get; set; }
    public DateTime? FirstProblemDate { get; set; }
    public string? Detail { get; set; }
}

/// <summary>A villa row in the admin inventory grid.</summary>
public class InventoryGridVilla
{
    public int VillaId { get; set; }
    public string VillaCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int TotalUnits { get; set; }
    public decimal PricePerNight { get; set; }
    public string Currency { get; set; } = "LKR";

    public int NightsInWindow { get; set; }
    public int UnitNights { get; set; }
    public int UnitNightsSold { get; set; }
    public int BlockedNights { get; set; }
    public decimal OccupancyPercent { get; set; }

    public List<VillaInventoryNight> Nights { get; set; } = new();
}