using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;
using AvioraResort.Repositories;

namespace AvioraResort.Services;

/// <summary>
/// Reservation rules.
///
/// The one that matters: this class never accepts a price. QuoteRequestDto and
/// CreateBookingRequestDto have no money fields at all, and usp_Booking_Create
/// re-prices the stay from the inputs rather than trusting the quote it handed
/// out a minute earlier.
/// </summary>
public class BookingService : IBookingService
{
    private readonly IBookingRepository _bookings;

    public BookingService(IBookingRepository bookings) => _bookings = bookings;

    private const string DateFmt = "yyyy-MM-dd";
    private const string StampFmt = "yyyy-MM-dd'T'HH:mm:ss'Z'";

    private static readonly string[] AllowedStatuses =
        { "Confirmed", "Checked-In", "Checked-Out", "Cancelled", "No-Show" };

    private static readonly string[] AllowedPaymentMethods = { "card", "resort" };

    private static string ReasonFor(int status) => status switch
    {
        1 => "Ok",
        -1 => "VillaNotFound",
        -2 => "RatePlanNotOffered",
        -3 => "InvalidDates",
        -4 => "OccupancyExceeded",
        -5 => "Unavailable",
        -6 => "PromoLimitReached",
        _ => "Unknown"
    };

    /* ================= quote ================= */

    public async Task<ServiceResult<QuoteResultDto>> GetQuoteAsync(QuoteRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.VillaId))
            return ServiceResult<QuoteResultDto>.Fail("A villa is required.", 400);

        request.VillaId = request.VillaId.Trim().ToLowerInvariant();
        request.RatePlan = (request.RatePlan ?? "standard").Trim().ToLowerInvariant();

        var quote = await _bookings.CalculateQuoteAsync(request);

        // A stay that cannot be priced is a normal answer, not an HTTP error -
        // the checkout renders the reason inline. Only a missing villa is 404.
        if (quote.Status == -1)
            return ServiceResult<QuoteResultDto>.Fail("This villa is no longer available.", 404);

        if (quote.Status != 1)
        {
            return ServiceResult<QuoteResultDto>.Ok(new QuoteResultDto
            {
                Priced = false,
                Reason = ReasonFor(quote.Status),
                Message = quote.Message ?? "These dates cannot be booked.",
                VillaId = request.VillaId,
                RatePlan = request.RatePlan
            });
        }

        return ServiceResult<QuoteResultDto>.Ok(ToDto(quote));
    }

    /* ================= create ================= */

    public async Task<ServiceResult<CreateBookingResultDto>> CreateAsync(
        int? userId, CreateBookingRequestDto request)
    {
        request.VillaId = request.VillaId.Trim().ToLowerInvariant();
        request.RatePlan = (request.RatePlan ?? "standard").Trim().ToLowerInvariant();
        request.PaymentMethod = (request.PaymentMethod ?? "resort").Trim().ToLowerInvariant();

        if (!AllowedPaymentMethods.Contains(request.PaymentMethod))
            return ServiceResult<CreateBookingResultDto>.Fail(
                "Payment method must be either 'card' or 'resort'.", 400);

        // Card details are not stored beyond the holder name and last four
        // digits. If a client sends a full PAN by mistake, keep the tail only
        // rather than writing it to the database.
        if (!string.IsNullOrWhiteSpace(request.CardLast4))
        {
            var digits = new string(request.CardLast4.Where(char.IsDigit).ToArray());
            request.CardLast4 = digits.Length > 4 ? digits[^4..] : digits;
        }

        if (request.PaymentMethod == "card" && string.IsNullOrWhiteSpace(request.CardHolderName))
            return ServiceResult<CreateBookingResultDto>.Fail(
                "The cardholder name is required when paying by card.", 400);

        var (status, referenceId, message) = await _bookings.CreateAsync(userId, request);

        if (status != 1 || referenceId is null)
        {
            var httpStatus = status switch
            {
                -1 => 404,   // villa gone
                -5 => 409,   // taken while checking out
                -6 => 409,   // promo just exhausted
                _ => 400
            };

            return ServiceResult<CreateBookingResultDto>.Fail(
                message ?? "Your reservation could not be completed.", httpStatus);
        }

        // Read it back so the confirmation screen shows exactly what was
        // stored, including the server-generated reference and totals.
        var booking = await _bookings.GetByReferenceAsync(referenceId, userId, isAdmin: userId is null);

        return ServiceResult<CreateBookingResultDto>.Ok(new CreateBookingResultDto
        {
            Success = true,
            ReferenceId = referenceId,
            Message = $"Reservation {referenceId} confirmed.",
            Booking = booking is null ? null : ToDto(booking)
        });
    }

    /* ================= read ================= */

    public async Task<ServiceResult<List<BookingDto>>> GetMyBookingsAsync(int userId, bool includeCancelled)
    {
        var bookings = await _bookings.GetByUserAsync(userId, includeCancelled);
        return ServiceResult<List<BookingDto>>.Ok(bookings.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<BookingDto>> GetByReferenceAsync(
        string referenceId, int? userId, bool isAdmin)
    {
        if (string.IsNullOrWhiteSpace(referenceId))
            return ServiceResult<BookingDto>.Fail("A reservation reference is required.", 400);

        var booking = await _bookings.GetByReferenceAsync(referenceId.Trim(), userId, isAdmin);

        // The procedure scopes the lookup by UserId unless IsAdmin, so a guest
        // guessing another reference gets the same 404 as a made-up one. No
        // information about whether it exists leaks either way.
        return booking is null
            ? ServiceResult<BookingDto>.Fail("That reservation could not be found.", 404)
            : ServiceResult<BookingDto>.Ok(ToDto(booking));
    }

    public async Task<ServiceResult<string>> CancelAsync(
        string referenceId, int? userId, bool isAdmin, string? reason)
    {
        var status = await _bookings.CancelAsync(referenceId.Trim(), userId, isAdmin, reason?.Trim());

        return status switch
        {
            1 => ServiceResult<string>.Ok(
                      "Reservation cancelled. The villa has been released back to the calendar."),
            -1 => ServiceResult<string>.Fail("That reservation could not be found.", 404),
            -2 => ServiceResult<string>.Fail("That reservation is already cancelled.", 409),
            -3 => ServiceResult<string>.Fail(
                      "This rate is non-refundable, or the free cancellation window has passed. " +
                      "Please contact the resort directly.", 409),
            -4 => ServiceResult<string>.Fail(
                      "This stay has already begun and cannot be cancelled online.", 409),
            _ => ServiceResult<string>.Fail("The reservation could not be cancelled.", 500)
        };
    }

    /* ================= administrator ================= */

    public async Task<ServiceResult<BookingSearchResultDto>> SearchAsync(BookingSearchDto filter)
    {
        if (filter.Page < 1) filter.Page = 1;
        if (filter.PageSize is < 1 or > 100) filter.PageSize = 25;

        if (filter.Status is not null && !AllowedStatuses.Contains(filter.Status))
            return ServiceResult<BookingSearchResultDto>.Fail(
                $"Status must be one of: {string.Join(", ", AllowedStatuses)}.", 400);

        var (items, total) = await _bookings.SearchAsync(filter);

        return ServiceResult<BookingSearchResultDto>.Ok(new BookingSearchResultDto
        {
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = total,
            TotalPages = total == 0 ? 0 : (int)Math.Ceiling(total / (double)filter.PageSize),
            Items = items.Select(ToDto).ToList()
        });
    }

    public async Task<ServiceResult<string>> SetStatusAsync(
        string referenceId, UpdateBookingStatusDto request, int adminUserId)
    {
        if (!AllowedStatuses.Contains(request.Status))
            return ServiceResult<string>.Fail(
                $"Status must be one of: {string.Join(", ", AllowedStatuses)}.", 400);

        var status = await _bookings.SetStatusAsync(
            referenceId.Trim(), request.Status, adminUserId, request.Remarks?.Trim());

        return status switch
        {
            1 => ServiceResult<string>.Ok($"Reservation moved to {request.Status}."),
            -1 => ServiceResult<string>.Fail("That reservation could not be found.", 404),
            -2 => ServiceResult<string>.Fail(
                      "A checked-out or cancelled reservation cannot be reopened. " +
                      "Create a new reservation instead.", 409),
            _ => ServiceResult<string>.Fail("The status could not be changed.", 500)
        };
    }

    public async Task<ServiceResult<DashboardKpisDto>> GetKpisAsync()
    {
        var k = await _bookings.GetKpisAsync();

        return ServiceResult<DashboardKpisDto>.Ok(new DashboardKpisDto
        {
            TotalRevenue = k.TotalRevenue,
            Revenue30Days = k.Revenue30Days,
            ConfirmedCount = k.ConfirmedCount,
            InHouseCount = k.InHouseCount,
            ArrivalsToday = k.ArrivalsToday,
            DeparturesToday = k.DeparturesToday,
            Cancellations30Days = k.Cancellations30Days,
            OccupancyToday = k.OccupancyToday,
            Currency = "LKR",
            Movements = k.Movements.Select(m => new MovementDto
            {
                ReferenceId = m.ReferenceId,
                Status = m.Status,
                Movement = m.Movement,
                VillaName = m.VillaName,
                GuestName = $"{m.FirstName} {m.LastName}".Trim(),
                FlightNumber = m.FlightNumber,
                ArrivalTime = m.ArrivalTime,
                SpecialRequests = m.SpecialRequests
            }).ToList()
        });
    }

    /* ================= mapping ================= */

    private static AddonLineDto ToDto(BookingAddonLine a) => new()
    {
        Id = a.AddonCode,
        Name = a.Name,
        UnitPrice = a.UnitPrice,
        Quantity = a.Quantity,
        ChargeBasis = a.ChargeBasis,
        LineTotal = a.LineTotal
    };

    private static TaxLineDto ToDto(BookingTaxLine t) => new()
    {
        Code = t.Code,
        DisplayName = t.DisplayName,
        Percentage = t.Percentage,
        BaseAmount = t.BaseAmount,
        TaxAmount = t.TaxAmount
    };

    private static QuoteResultDto ToDto(BookingQuote q) => new()
    {
        Priced = true,
        Reason = "Ok",
        Message = "Priced.",
        VillaId = q.VillaCode,
        RatePlan = q.RatePlanCode,
        CheckIn = q.CheckIn.ToString(DateFmt),
        CheckOut = q.CheckOut.ToString(DateFmt),
        Nights = q.Nights,
        Adults = q.Adults,
        Children = q.Children,

        BaseRatePerNight = q.BaseRatePerNight,
        RatePlanDiscountPct = q.RatePlanDiscountPct,
        AverageNightlyRate = q.AverageNightlyRate,
        RoomSubtotal = q.RoomSubtotal,
        AddonsTotal = q.AddonsTotal,
        PromoDiscountPct = q.PromoDiscountPct,
        DiscountAmount = q.DiscountAmount,
        NetSubtotal = q.NetSubtotal,
        TaxTotal = q.TaxTotal,
        FinalTotal = q.FinalTotal,
        Currency = q.Currency,

        IsRefundable = q.IsRefundable,
        CancellationHours = q.CancellationHours,
        RequiresPrepayment = q.RequiresPrepayment,
        CancellationDeadline = q.CancellationDeadline?.ToString(StampFmt),

        PromoApplied = q.PromoApplied,
        PromoMessage = q.PromoMessage,

        Addons = q.Addons.Select(ToDto).ToList(),
        Taxes = q.Taxes.Select(ToDto).ToList()
    };

    private static BookingDto ToDto(Booking b) => new()
    {
        ReferenceId = b.ReferenceId,
        Status = b.Status,
        CheckIn = b.CheckIn.ToString(DateFmt),
        CheckOut = b.CheckOut.ToString(DateFmt),
        Nights = b.Nights,
        Adults = b.Adults,
        Children = b.Children,

        VillaId = b.VillaCode,
        VillaName = b.VillaName,
        VillaImage = b.MainImageUrl,
        BedConfiguration = b.BedConfiguration,

        RatePlan = b.RatePlanCode,
        RatePlanName = b.RatePlanName,
        RatePlanBadge = b.RatePlanBadge,

        BaseRatePerNight = b.BaseRatePerNight,
        RatePlanDiscountPct = b.RatePlanDiscountPct,
        RoomSubtotal = b.RoomSubtotal,
        AddonsTotal = b.AddonsTotal,
        PromoDiscountPct = b.PromoDiscountPct,
        DiscountAmount = b.DiscountAmount,
        NetSubtotal = b.NetSubtotal,
        TaxTotal = b.TaxTotal,
        FinalTotal = b.FinalTotal,
        Currency = b.Currency,
        PromoCode = b.PromoCode,

        IsRefundable = b.IsRefundable,
        CancellationDeadline = b.CancellationDeadline?.ToString(StampFmt),
        CanCancel = b.CanCancel,

        BookedAt = b.BookedAt.ToString(StampFmt),
        CancelledAt = b.CancelledAt?.ToString(StampFmt),
        CancellationReason = b.CancellationReason,

        Guest = b.Guest is null ? null : new BookingGuestDto
        {
            FirstName = b.Guest.FirstName,
            LastName = b.Guest.LastName,
            Email = b.Guest.Email,
            Phone = b.Guest.Phone,
            Country = b.Guest.Country,
            BedPreference = b.Guest.BedPreference,
            SpecialRequests = b.Guest.SpecialRequests,
            FlightNumber = b.Guest.FlightNumber,
            ArrivalTime = b.Guest.ArrivalTime
        },

        Payment = b.Payment is null ? null : new BookingPaymentDto
        {
            Method = b.Payment.PaymentMethod,
            Status = b.Payment.PaymentStatus,
            CardLast4 = b.Payment.CardLast4,
            CardHolder = b.Payment.CardHolderName
        },

        Addons = b.Addons.Select(ToDto).ToList(),
        Taxes = b.Taxes.Select(ToDto).ToList(),
        History = b.History.Select(h => new BookingHistoryDto
        {
            From = h.OldStatus,
            To = h.NewStatus,
            Remarks = h.Remarks,
            ChangedBy = h.ChangedBy,
            ChangedAt = h.ChangedAt.ToString(StampFmt)
        }).ToList(),

        AddonCount = b.AddonCount > 0 ? b.AddonCount : b.Addons.Count
    };
}