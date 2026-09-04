namespace AvioraResort.Models.Entities;

/// <summary>
/// A reservation. Every money field is a snapshot of what the SERVER
/// calculated at booking time, not what the browser sent and not something
/// recomputed on read - a rate plan modifier or a villa's base rate can change
/// tomorrow, and the invoice must not change with it.
/// </summary>
public class Booking
{
    public string ReferenceId { get; set; } = string.Empty;
    public string Status { get; set; } = "Confirmed";
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public int Nights { get; set; }
    public int Adults { get; set; }
    public int Children { get; set; }
    public int Units { get; set; } = 1;

    public string VillaCode { get; set; } = string.Empty;
    public string VillaName { get; set; } = string.Empty;
    public string? MainImageUrl { get; set; }
    public string? BedConfiguration { get; set; }
    public string? CategoryCode { get; set; }
    public string? ViewCode { get; set; }

    public string RatePlanCode { get; set; } = string.Empty;
    public string RatePlanName { get; set; } = string.Empty;
    public string? RatePlanBadge { get; set; }

    public decimal BaseRatePerNight { get; set; }
    public decimal RatePlanDiscountPct { get; set; }
    public decimal RoomSubtotal { get; set; }
    public decimal AddonsTotal { get; set; }
    public decimal PromoDiscountPct { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal NetSubtotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal FinalTotal { get; set; }
    public string Currency { get; set; } = "LKR";
    public string? PromoCode { get; set; }

    public bool IsRefundable { get; set; }
    public DateTime? CancellationDeadline { get; set; }

    /// <summary>Computed in SQL: Confirmed, refundable, and still inside the window.</summary>
    public bool CanCancel { get; set; }

    public DateTime BookedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }

    public BookingGuest? Guest { get; set; }
    public BookingPayment? Payment { get; set; }

    public List<BookingAddonLine> Addons { get; set; } = new();
    public List<BookingTaxLine> Taxes { get; set; } = new();
    public List<BookingStatusStep> History { get; set; } = new();

    public int AddonCount { get; set; }
}

public class BookingGuest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Country { get; set; }
    public string? BedPreference { get; set; }
    public string? SpecialRequests { get; set; }
    public string? FlightNumber { get; set; }
    public string? ArrivalTime { get; set; }
}

public class BookingPayment
{
    public string PaymentMethod { get; set; } = "resort";
    public string PaymentStatus { get; set; } = "Pending";
    public string? CardLast4 { get; set; }
    public string? CardHolderName { get; set; }
}

public class BookingAddonLine
{
    public string AddonCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public string ChargeBasis { get; set; } = "PerStay";
    public decimal LineTotal { get; set; }
}

/// <summary>One line of the cascade as it stood when the booking was taken.</summary>
public class BookingTaxLine
{
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public decimal Percentage { get; set; }
    public int ApplyOrder { get; set; }
    public decimal BaseAmount { get; set; }
    public decimal TaxAmount { get; set; }
}

public class BookingStatusStep
{
    public string? OldStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public string? ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
}

/// <summary>Result of usp_Booking_CalculateQuote.</summary>
public class BookingQuote
{
    public int Status { get; set; }
    public string? Message { get; set; }

    public string VillaCode { get; set; } = string.Empty;
    public string RatePlanCode { get; set; } = string.Empty;
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public int Nights { get; set; }
    public int Adults { get; set; }
    public int Children { get; set; }

    public decimal BaseRatePerNight { get; set; }
    public decimal RatePlanDiscountPct { get; set; }
    public decimal AverageNightlyRate { get; set; }
    public decimal RoomSubtotal { get; set; }
    public decimal AddonsTotal { get; set; }
    public decimal PromoDiscountPct { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal NetSubtotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal FinalTotal { get; set; }
    public string Currency { get; set; } = "LKR";

    public bool IsRefundable { get; set; }
    public int? CancellationHours { get; set; }
    public bool RequiresPrepayment { get; set; }
    public DateTime? CancellationDeadline { get; set; }

    public bool PromoApplied { get; set; }
    public int PromoStatus { get; set; }
    public string? PromoMessage { get; set; }

    public List<BookingAddonLine> Addons { get; set; } = new();
    public List<BookingTaxLine> Taxes { get; set; } = new();
}

/// <summary>The admin dashboard cards.</summary>
public class DashboardKpis
{
    public decimal TotalRevenue { get; set; }
    public decimal Revenue30Days { get; set; }
    public int ConfirmedCount { get; set; }
    public int InHouseCount { get; set; }
    public int ArrivalsToday { get; set; }
    public int DeparturesToday { get; set; }
    public int Cancellations30Days { get; set; }
    public decimal OccupancyToday { get; set; }

    public List<TodayMovement> Movements { get; set; } = new();
}

public class TodayMovement
{
    public string ReferenceId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public string VillaName { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? FlightNumber { get; set; }
    public string? ArrivalTime { get; set; }
    public string? SpecialRequests { get; set; }
    public string Movement { get; set; } = string.Empty;
}