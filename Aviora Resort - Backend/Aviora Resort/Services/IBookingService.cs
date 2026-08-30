using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;

namespace AvioraResort.Services;

public interface IBookingService
{
    /* ---------- guest ---------- */
    Task<ServiceResult<QuoteResultDto>> GetQuoteAsync(QuoteRequestDto request);
    Task<ServiceResult<CreateBookingResultDto>> CreateAsync(int? userId, CreateBookingRequestDto request);
    Task<ServiceResult<List<BookingDto>>> GetMyBookingsAsync(int userId, bool includeCancelled);
    Task<ServiceResult<BookingDto>> GetByReferenceAsync(string referenceId, int? userId, bool isAdmin);
    Task<ServiceResult<string>> CancelAsync(string referenceId, int? userId, bool isAdmin, string? reason);

    /* ---------- administrator ---------- */
    Task<ServiceResult<BookingSearchResultDto>> SearchAsync(BookingSearchDto filter);
    Task<ServiceResult<string>> SetStatusAsync(string referenceId, UpdateBookingStatusDto request, int adminUserId);
    Task<ServiceResult<DashboardKpisDto>> GetKpisAsync();
}