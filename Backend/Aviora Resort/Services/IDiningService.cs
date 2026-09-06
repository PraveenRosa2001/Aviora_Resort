using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;

namespace AvioraResort.Services;

public interface IDiningService
{
    /* ---------- public ---------- */
    Task<ServiceResult<List<DiningVenueDto>>> GetVenuesAsync(string? venueType);
    Task<ServiceResult<DiningVenueDto>> GetVenueAsync(string slug);
    Task<ServiceResult<DiningAvailabilityResultDto>> GetAvailabilityAsync(string slug, DiningAvailabilityRequestDto request);

    /* ---------- guest ---------- */
    Task<ServiceResult<CreateDiningResultDto>> CreateReservationAsync(int? userId, CreateDiningReservationDto request);
    Task<ServiceResult<List<DiningReservationDto>>> GetMyReservationsAsync(int userId);
    Task<ServiceResult<string>> CancelReservationAsync(string referenceId, int? userId, bool isAdmin);

    /* ---------- administrator ---------- */
    Task<ServiceResult<List<DiningVenueDto>>> GetVenuesForAdminAsync();
    Task<ServiceResult<string>> SaveVenueAsync(SaveDiningVenueDto request);
    Task<ServiceResult<string>> DeleteVenueAsync(string slug);
    Task<ServiceResult<List<DiningReservationDto>>> GetReservationsForAdminAsync(DiningBookingSearchDto filter);
    Task<ServiceResult<string>> SetReservationStatusAsync(string referenceId, UpdateDiningStatusDto request);

    Task<ServiceResult<string>> SaveMenuAsync(string slug, SaveDiningMenuDto request);
}