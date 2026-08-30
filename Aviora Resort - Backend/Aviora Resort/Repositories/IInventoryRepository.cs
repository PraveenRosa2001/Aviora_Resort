using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public interface IInventoryRepository
{
    Task<AvailabilityCheck> CheckAvailabilityAsync(string villaCode, DateTime checkIn,
                                                   DateTime checkOut, int unitsWanted);

    Task<List<VillaInventoryNight>> GetCalendarAsync(string villaCode, DateTime from, DateTime to);

    Task<List<InventoryGridVilla>> GetGridAsync(DateTime from, DateTime to);

    /// <summary>Status: 1 saved, -1 villa not found, -2 bad range, -3 would strand a sold unit.</summary>
    Task<(int Status, int RowsAffected)> SetRangeAsync(string villaCode, SetInventoryRangeDto request);

    Task<(int NightsAdded, int NightsPurged)> ExtendHorizonAsync(int horizonDays);

    /* Used by the bookings module. Kept here so the inventory writes stay in
       one place rather than being duplicated by BookingRepository. */
    Task<int> ReserveAsync(int villaId, DateTime checkIn, DateTime checkOut, int units);
    Task<int> ReleaseAsync(int villaId, DateTime checkIn, DateTime checkOut, int units);
}