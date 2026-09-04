using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;
using AvioraResort.Repositories;

namespace AvioraResort.Services;

/// <summary>
/// Availability rules and the shaping of inventory data for the client.
///
/// One convention runs through the whole module: a stay of CheckIn..CheckOut
/// occupies the NIGHTS CheckIn .. CheckOut-1. The departure date is not
/// occupied. Getting that wrong blocks one extra night on every booking.
/// </summary>
public class InventoryService : IInventoryService
{
    private readonly IInventoryRepository _inventory;

    public InventoryService(IInventoryRepository inventory) => _inventory = inventory;

    private const string DateFormat = "yyyy-MM-dd";

    /// <summary>Maps the procedure's status code to a name the client can branch on.</summary>
    private static string ReasonFor(int status) => status switch
    {
        1 => "Ok",
        -1 => "NotFound",
        -2 => "InvalidRange",
        -3 => "OutsideHorizon",
        -4 => "Blocked",
        -5 => "SoldOut",
        -6 => "MinNights",
        _ => "Unknown"
    };

    private static string MessageFor(int status, string? detail) => status switch
    {
        1 => "Available for these dates.",
        -1 => "This villa is no longer available.",
        _ => detail ?? "These dates are not available."
    };

    public async Task<ServiceResult<AvailabilityResultDto>> CheckAsync(
        string villaCode, DateTime? checkIn, DateTime? checkOut, int units)
    {
        if (string.IsNullOrWhiteSpace(villaCode))
            return ServiceResult<AvailabilityResultDto>.Fail("A villa identifier is required.", 400);

        if (checkIn is null || checkOut is null)
            return ServiceResult<AvailabilityResultDto>.Fail(
                "Both a check-in and a check-out date are required.", 400);

        if (units < 1) units = 1;

        var check = await _inventory.CheckAvailabilityAsync(
            villaCode.Trim(), checkIn.Value, checkOut.Value, units);

        // A refusal is a normal answer, not an HTTP error - the date picker
        // renders the reason inline. Only a missing villa is a 404.
        if (check.Status == -1)
            return ServiceResult<AvailabilityResultDto>.Fail("This villa is no longer available.", 404);

        return ServiceResult<AvailabilityResultDto>.Ok(new AvailabilityResultDto
        {
            Available = check.Status == 1,
            VillaId = villaCode.Trim(),
            CheckIn = checkIn.Value.ToString(DateFormat),
            CheckOut = checkOut.Value.ToString(DateFormat),
            Nights = check.Nights,
            UnitsAvailable = check.UnitsAvailable,
            Reason = ReasonFor(check.Status),
            Message = MessageFor(check.Status, check.Detail),
            FirstProblemDate = check.FirstProblemDate?.ToString(DateFormat)
        });
    }

    public async Task<ServiceResult<List<CalendarNightDto>>> GetCalendarAsync(
        string villaCode, DateTime? from, DateTime? to)
    {
        if (string.IsNullOrWhiteSpace(villaCode))
            return ServiceResult<List<CalendarNightDto>>.Fail("A villa identifier is required.", 400);

        var start = (from ?? DateTime.UtcNow.Date).Date;
        var end = (to ?? start.AddDays(90)).Date;

        if (end < start)
            return ServiceResult<List<CalendarNightDto>>.Fail(
                "The end of the window cannot fall before the start.", 400);

        var nights = await _inventory.GetCalendarAsync(villaCode.Trim(), start, end);
        return ServiceResult<List<CalendarNightDto>>.Ok(nights.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<InventoryGridDto>> GetGridAsync(DateTime? from, DateTime? to)
    {
        var start = (from ?? DateTime.UtcNow.Date).Date;
        var end = (to ?? start.AddDays(29)).Date;

        if (end < start)
            return ServiceResult<InventoryGridDto>.Fail(
                "The end of the window cannot fall before the start.", 400);

        var villas = await _inventory.GetGridAsync(start, end);

        return ServiceResult<InventoryGridDto>.Ok(new InventoryGridDto
        {
            From = start.ToString(DateFormat),
            To = end.ToString(DateFormat),
            Villas = villas.Select(v => new InventoryVillaRowDto
            {
                Id = v.VillaCode,
                Name = v.Name,
                TotalUnits = v.TotalUnits,
                PricePerNight = v.PricePerNight,
                UnitNights = v.UnitNights,
                UnitNightsSold = v.UnitNightsSold,
                BlockedNights = v.BlockedNights,
                OccupancyPercent = v.OccupancyPercent,
                Nights = v.Nights.Select(ToDto).ToList()
            }).ToList()
        });
    }

    public async Task<ServiceResult<string>> SetRangeAsync(string villaCode, SetInventoryRangeDto request)
    {
        if (request.To < request.From)
            return ServiceResult<string>.Fail("The end date cannot fall before the start date.", 400);

        if (request.From < DateTime.UtcNow.Date.AddDays(-90))
            return ServiceResult<string>.Fail(
                "Inventory older than 90 days is purged and cannot be edited.", 400);

        // Blocking without a reason leaves the reception desk with no
        // explanation when a guest asks why the villa is closed.
        if (request.IsBlocked == true && string.IsNullOrWhiteSpace(request.BlockReason))
            return ServiceResult<string>.Fail("A reason is required when closing dates.", 400);

        if (request.PriceOverride is not null && request.ClearPriceOverride)
            return ServiceResult<string>.Fail(
                "Choose either a seasonal rate or clearing the existing one, not both.", 400);

        var (status, rows) = await _inventory.SetRangeAsync(villaCode.Trim().ToLowerInvariant(), request);

        return status switch
        {
            1 => ServiceResult<string>.Ok($"{rows} night(s) updated."),
            -1 => ServiceResult<string>.Fail("That villa no longer exists.", 404),
            -2 => ServiceResult<string>.Fail("The end date cannot fall before the start date.", 400),
            -3 => ServiceResult<string>.Fail(
                      "Some of these nights already have more reservations than the new unit count. " +
                      "Cancel those reservations first, or choose a higher figure.", 409),
            _ => ServiceResult<string>.Fail("The inventory could not be updated.", 500)
        };
    }

    public async Task<ServiceResult<string>> ExtendHorizonAsync(int horizonDays)
    {
        if (horizonDays is < 30 or > 1095)
            return ServiceResult<string>.Fail(
                "The booking horizon must be between 30 and 1095 days.", 400);

        var (added, purged) = await _inventory.ExtendHorizonAsync(horizonDays);

        return ServiceResult<string>.Ok(
            $"Calendar extended to {horizonDays} days. {added} night(s) opened, {purged} past night(s) purged.");
    }

    private static CalendarNightDto ToDto(VillaInventoryNight n) => new()
    {
        Date = n.StayDate.ToString(DateFormat),
        UnitsAvailable = n.UnitsAvailable,
        TotalUnits = n.TotalUnits,
        IsBlocked = n.IsBlocked,
        BlockReason = n.BlockReason,
        MinNights = n.MinNights,
        PricePerNight = n.PricePerNight,
        HasPriceOverride = n.HasPriceOverride,
        IsBookable = n.IsBookable
    };
}