using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace AvioraResort.Models.DTOs;

/* ==================== quote ==================== */

public class QuoteRequestDto
{
    [Required] public string VillaId { get; set; } = string.Empty;   // VillaCode
    [Required] public string RatePlan { get; set; } = "standard";

    [Required] public DateTime CheckIn { get; set; }
    [Required] public DateTime CheckOut { get; set; }

    [Range(1, 30)] public int Adults { get; set; } = 1;
    [Range(0, 30)] public int Children { get; set; }

    [MaxLength(30)] public string? PromoCode { get; set; }

    /// <summary>Add-on codes. Quantity defaults to 1.</summary>
    public List<string> Addons { get; set; } = new();
}

/// <summary>
/// The priced stay. Field names mirror what BookingCheckoutModal.jsx already
/// computes in the browser, so the summary panel needs no renaming - it just
/// stops doing the arithmetic itself.
/// </summary>
public class QuoteResultDto
{
    public bool Priced { get; set; }
    public string Reason { get; set; } = "Ok";
    public string Message { get; set; } = string.Empty;

    public string VillaId { get; set; } = string.Empty;
    public string RatePlan { get; set; } = string.Empty;
    public string CheckIn { get; set; } = string.Empty;
    public string CheckOut { get; set; } = string.Empty;
    public int Nights { get; set; }
    public int Adults { get; set; }
    public int Children { get; set; }

    public decimal BaseRatePerNight { get; set; }
    public decimal RatePlanDiscountPct { get; set; }

    /// <summary>Room subtotal divided by nights. Differs from the base rate when a night carries a seasonal override.</summary>
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
    public string? CancellationDeadline { get; set; }

    public bool PromoApplied { get; set; }
    public string? PromoMessage { get; set; }

    public List<AddonLineDto> Addons { get; set; } = new();
    public List<TaxLineDto> Taxes { get; set; } = new();
}

public class AddonLineDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public string ChargeBasis { get; set; } = "PerStay";
    public decimal LineTotal { get; set; }
}

public class TaxLineDto
{
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public decimal Percentage { get; set; }
    public decimal BaseAmount { get; set; }
    public decimal TaxAmount { get; set; }
}

/* ==================== create ==================== */

/// <summary>
/// Note what is NOT here: any money field. The client cannot send a price.
/// usp_Booking_Create re-prices the stay from these inputs alone.
///
/// Also absent: the card number, expiry and CVC. Only the holder name and the
/// last four digits are stored - keeping the PAN would put this system in
/// PCI-DSS scope.
/// </summary>
public class CreateBookingRequestDto
{
    [Required] public string VillaId { get; set; } = string.Empty;
    [Required] public string RatePlan { get; set; } = "standard";

    [Required] public DateTime CheckIn { get; set; }
    [Required] public DateTime CheckOut { get; set; }

    [Range(1, 30)] public int Adults { get; set; } = 1;
    [Range(0, 30)] public int Children { get; set; }

    [MaxLength(30)] public string? PromoCode { get; set; }
    public List<string> Addons { get; set; } = new();

    [Required(ErrorMessage = "First name is required"), MaxLength(60)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required"), MaxLength(60)]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email address is required")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address")]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)] public string? Phone { get; set; }
    [MaxLength(100)] public string? Country { get; set; }
    [MaxLength(60)] public string? BedPreference { get; set; }
    [MaxLength(2000)] public string? SpecialRequests { get; set; }
    [MaxLength(30)] public string? FlightNumber { get; set; }
    [MaxLength(60)] public string? ArrivalTime { get; set; }

    /// <summary>card or resort.</summary>
    [MaxLength(20)] public string PaymentMethod { get; set; } = "resort";

    [MaxLength(120)] public string? CardHolderName { get; set; }

    /// <summary>Last four digits only. Anything longer is truncated server-side.</summary>
    [MaxLength(4)] public string? CardLast4 { get; set; }
}

public class CreateBookingResultDto
{
    public bool Success { get; set; }
    public string? ReferenceId { get; set; }
    public string Message { get; set; } = string.Empty;
    public BookingDto? Booking { get; set; }
}

/* ==================== read ==================== */

public class BookingDto
{
    public string ReferenceId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string CheckIn { get; set; } = string.Empty;
    public string CheckOut { get; set; } = string.Empty;
    public int Nights { get; set; }
    public int Adults { get; set; }
    public int Children { get; set; }

    public string VillaId { get; set; } = string.Empty;
    public string VillaName { get; set; } = string.Empty;
    public string? VillaImage { get; set; }
    public string? BedConfiguration { get; set; }

    public string RatePlan { get; set; } = string.Empty;
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
    public string? CancellationDeadline { get; set; }
    public bool CanCancel { get; set; }

    public string BookedAt { get; set; } = string.Empty;
    public string? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }

    public BookingGuestDto? Guest { get; set; }
    public BookingPaymentDto? Payment { get; set; }

    public List<AddonLineDto> Addons { get; set; } = new();
    public List<TaxLineDto> Taxes { get; set; } = new();
    public List<BookingHistoryDto> History { get; set; } = new();

    public int AddonCount { get; set; }
}

public class BookingGuestDto
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

public class BookingPaymentDto
{
    public string Method { get; set; } = "resort";
    public string Status { get; set; } = "Pending";
    public string? CardLast4 { get; set; }
    public string? CardHolder { get; set; }
}

public class BookingHistoryDto
{
    public string? From { get; set; }
    public string To { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public string? ChangedBy { get; set; }
    public string ChangedAt { get; set; } = string.Empty;
}

public class CancelBookingRequestDto
{
    [MaxLength(300)] public string? Reason { get; set; }
}

/* ==================== admin ==================== */

public class BookingSearchDto
{
    [FromQuery(Name = "search")] public string? Search { get; set; }
    [FromQuery(Name = "status")] public string? Status { get; set; }
    [FromQuery(Name = "from")] public DateTime? From { get; set; }
    [FromQuery(Name = "to")] public DateTime? To { get; set; }
    [FromQuery(Name = "page")] public int Page { get; set; } = 1;
    [FromQuery(Name = "pageSize")] public int PageSize { get; set; } = 25;
}

public class BookingSearchResultDto
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public List<BookingDto> Items { get; set; } = new();
}

public class UpdateBookingStatusDto
{
    /// <summary>Confirmed, Checked-In, Checked-Out, Cancelled or No-Show.</summary>
    [Required, MaxLength(20)]
    public string Status { get; set; } = string.Empty;

    [MaxLength(300)] public string? Remarks { get; set; }
}

public class DashboardKpisDto
{
    public decimal TotalRevenue { get; set; }
    public decimal Revenue30Days { get; set; }
    public int ConfirmedCount { get; set; }
    public int InHouseCount { get; set; }
    public int ArrivalsToday { get; set; }
    public int DeparturesToday { get; set; }
    public int Cancellations30Days { get; set; }
    public decimal OccupancyToday { get; set; }
    public string Currency { get; set; } = "LKR";

    public List<MovementDto> Movements { get; set; } = new();
}

public class MovementDto
{
    public string ReferenceId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Movement { get; set; } = string.Empty;
    public string VillaName { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public string? FlightNumber { get; set; }
    public string? ArrivalTime { get; set; }
    public string? SpecialRequests { get; set; }
}