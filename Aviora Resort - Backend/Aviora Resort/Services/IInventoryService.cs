using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;

namespace AvioraResort.Services;

public interface IInventoryService
{
    /* ---------- public ---------- */
    Task<ServiceResult<AvailabilityResultDto>> CheckAsync(string villaCode, DateTime? checkIn,
                                                          DateTime? checkOut, int units);
    Task<ServiceResult<List<CalendarNightDto>>> GetCalendarAsync(string villaCode,
                                                                 DateTime? from, DateTime? to);

    /* ---------- administrator ---------- */
    Task<ServiceResult<InventoryGridDto>> GetGridAsync(DateTime? from, DateTime? to);
    Task<ServiceResult<string>> SetRangeAsync(string villaCode, SetInventoryRangeDto request);
    Task<ServiceResult<string>> ExtendHorizonAsync(int horizonDays);
}