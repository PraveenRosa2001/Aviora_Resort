using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public interface IBookingRepository
{
    Task<BookingQuote> CalculateQuoteAsync(QuoteRequestDto request);

    /// <summary>Status: 1 created, -1..-6 as documented on usp_Booking_Create.</summary>
    Task<(int Status, string? ReferenceId, string? Message)>
        CreateAsync(int? userId, CreateBookingRequestDto request);

    Task<Booking?> GetByReferenceAsync(string referenceId, int? userId, bool isAdmin);
    Task<List<Booking>> GetByUserAsync(int userId, bool includeCancelled);

    /// <summary>Status: 1 cancelled, -1 not found, -2 already cancelled, -3 not refundable, -4 stay started.</summary>
    Task<int> CancelAsync(string referenceId, int? userId, bool isAdmin, string? reason);

    Task<(List<Booking> Items, int TotalCount)> SearchAsync(BookingSearchDto filter);

    /// <summary>Status: 1 changed, -1 not found, -2 illegal transition.</summary>
    Task<int> SetStatusAsync(string referenceId, string newStatus, int adminUserId, string? remarks);

    Task<DashboardKpis> GetKpisAsync();
}