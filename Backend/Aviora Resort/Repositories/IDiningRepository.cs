using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public interface IDiningRepository
{
    Task<List<DiningVenue>> GetVenuesAsync(string? venueType, string? slug, bool includeInactive);

    Task<DiningAvailability> GetAvailabilityAsync(string slug, DateTime date, TimeSpan time, int partySize);

    /// <summary>Status: 1 booked, -1 venue gone, -2 past date, -3 party too large, -4 sitting full.</summary>
    Task<(int Status, string? ReferenceId)> CreateReservationAsync(
        int? userId, CreateDiningReservationDto request);

    Task<List<DiningReservation>> GetReservationsByUserAsync(int userId);
    Task<List<DiningReservation>> GetReservationsForAdminAsync(DiningBookingSearchDto filter);

    Task<int> CancelReservationAsync(string referenceId, int? userId, bool isAdmin);
    Task<int> SetReservationStatusAsync(string referenceId, string newStatus);

    /// <summary>Status: 1 saved, -2 unknown type, -3 capacity below what is already seated.</summary>
    Task<int> SaveVenueAsync(SaveDiningVenueDto request);
    Task<int> DeleteVenueAsync(string slug);

    /// <summary>Status: 1 saved, -1 venue not found, -2 an item points at a missing section.</summary>
    Task<int> SaveMenuAsync(string slug, SaveDiningMenuDto request);
}