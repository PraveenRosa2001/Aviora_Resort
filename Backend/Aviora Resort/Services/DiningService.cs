using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;
using AvioraResort.Repositories;

namespace AvioraResort.Services;

/// <summary>
/// Dining venues and table reservations.
///
/// No authorisation logic here - AdminDiningController carries
/// [Authorize(Roles = "admin")] and DiningController is anonymous for reads.
/// </summary>
public class DiningService : IDiningService
{
    private readonly IDiningRepository _dining;

    public DiningService(IDiningRepository dining) => _dining = dining;

    private const string DateFmt = "yyyy-MM-dd";
    private const string StampFmt = "yyyy-MM-dd'T'HH:mm:ss'Z'";

    private static readonly string[] AllowedTypes =
        { "restaurant", "brasserie", "bar", "cafe", "private" };

    private static readonly string[] AllowedStatuses =
        { "Confirmed", "Seated", "Completed", "Cancelled", "No-Show" };

    /* ================= public ================= */

    public async Task<ServiceResult<List<DiningVenueDto>>> GetVenuesAsync(string? venueType)
    {
        var type = Normalise(venueType);

        if (type is not null && !AllowedTypes.Contains(type))
            return ServiceResult<List<DiningVenueDto>>.Fail(
                $"Venue type must be one of: {string.Join(", ", AllowedTypes)}.", 400);

        var venues = await _dining.GetVenuesAsync(type, null, includeInactive: false);
        return ServiceResult<List<DiningVenueDto>>.Ok(venues.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<DiningVenueDto>> GetVenueAsync(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return ServiceResult<DiningVenueDto>.Fail("A venue identifier is required.", 400);

        var venues = await _dining.GetVenuesAsync(null, slug.Trim().ToLowerInvariant(), false);
        var venue = venues.FirstOrDefault();

        return venue is null
            ? ServiceResult<DiningVenueDto>.Fail("That venue is no longer available.", 404)
            : ServiceResult<DiningVenueDto>.Ok(ToDto(venue));
    }

    public async Task<ServiceResult<DiningAvailabilityResultDto>> GetAvailabilityAsync(
        string slug, DiningAvailabilityRequestDto request)
    {
        if (request.Date is null || string.IsNullOrWhiteSpace(request.Time))
            return ServiceResult<DiningAvailabilityResultDto>.Fail(
                "A date and a sitting time are both required.", 400);

        if (!TimeSpan.TryParse(request.Time, out var time))
            return ServiceResult<DiningAvailabilityResultDto>.Fail(
                "Time must be in 24-hour HH:mm form, for example 19:30.", 400);

        var result = await _dining.GetAvailabilityAsync(
            slug.Trim().ToLowerInvariant(), request.Date.Value, time, request.PartySize);

        if (result.Status == -1)
            return ServiceResult<DiningAvailabilityResultDto>.Fail(
                "That venue is no longer available.", 404);

        // A full sitting is a normal answer, not an error - the form shows the
        // reason inline and suggests another time.
        return ServiceResult<DiningAvailabilityResultDto>.Ok(new DiningAvailabilityResultDto
        {
            Available = result.Status == 1,
            CoversLeft = result.CoversLeft,
            Capacity = result.Capacity,
            Reason = result.Status switch
            {
                1 => "Ok",
                -2 => "PastDate",
                -3 => "PartyTooLarge",
                -4 => "SittingFull",
                _ => "Unknown"
            },
            Message = result.Status switch
            {
                1 => $"{result.CoversLeft} cover(s) available at this sitting.",
                -2 => "That date has already passed.",
                -3 => $"This venue seats {result.Capacity} guests in total. " +
                      "For a larger party, please speak to the concierge about a private booking.",
                -4 => "This sitting is fully committed. Please try another time.",
                _ => "Availability could not be checked."
            }
        });
    }

    /* ================= guest ================= */

    public async Task<ServiceResult<CreateDiningResultDto>> CreateReservationAsync(
        int? userId, CreateDiningReservationDto request)
    {
        request.VenueId = request.VenueId.Trim().ToLowerInvariant();

        if (request.Date.Date < DateTime.UtcNow.Date)
            return ServiceResult<CreateDiningResultDto>.Fail(
                "A table cannot be booked for a date that has passed.", 400);

        var (status, referenceId) = await _dining.CreateReservationAsync(userId, request);

        if (status != 1 || referenceId is null)
        {
            var (message, httpStatus) = status switch
            {
                -1 => ("That venue is no longer available.", 404),
                -2 => ("A table cannot be booked for a date that has passed.", 400),
                -3 => ("This venue cannot seat a party that size. Please speak to the concierge " +
                       "about a private booking.", 400),
                -4 => ("This sitting was fully committed while you were booking. " +
                       "Please try another time.", 409),
                _ => ("Your table could not be reserved.", 500)
            };

            return ServiceResult<CreateDiningResultDto>.Fail(message, httpStatus);
        }

        // Read it back so the confirmation shows what was stored, including
        // the server-generated reference.
        DiningReservationDto? saved = null;

        if (userId is not null)
        {
            var mine = await _dining.GetReservationsByUserAsync(userId.Value);
            saved = mine.Where(r => r.ReferenceId == referenceId).Select(ToDto).FirstOrDefault();
        }

        return ServiceResult<CreateDiningResultDto>.Ok(new CreateDiningResultDto
        {
            Success = true,
            ReferenceId = referenceId,
            Message = $"Table reserved. Your reference is {referenceId}.",
            Reservation = saved
        });
    }

    public async Task<ServiceResult<List<DiningReservationDto>>> GetMyReservationsAsync(int userId)
    {
        var rows = await _dining.GetReservationsByUserAsync(userId);
        return ServiceResult<List<DiningReservationDto>>.Ok(rows.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<string>> CancelReservationAsync(
        string referenceId, int? userId, bool isAdmin)
    {
        var status = await _dining.CancelReservationAsync(referenceId.Trim(), userId, isAdmin);

        return status switch
        {
            1 => ServiceResult<string>.Ok("Table reservation cancelled."),
            -1 => ServiceResult<string>.Fail("That reservation could not be found.", 404),
            -2 => ServiceResult<string>.Fail("That reservation is already cancelled.", 409),
            -3 => ServiceResult<string>.Fail(
                      "That sitting has already passed and cannot be cancelled online.", 409),
            _ => ServiceResult<string>.Fail("The reservation could not be cancelled.", 500)
        };
    }

    /* ================= administrator ================= */

    public async Task<ServiceResult<List<DiningVenueDto>>> GetVenuesForAdminAsync()
    {
        var venues = await _dining.GetVenuesAsync(null, null, includeInactive: true);
        return ServiceResult<List<DiningVenueDto>>.Ok(venues.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<string>> SaveVenueAsync(SaveDiningVenueDto request)
    {
        request.Id = request.Id.Trim().ToLowerInvariant();
        request.Type = request.Type.Trim().ToLowerInvariant();
        request.Name = request.Name.Trim();

        if (!AllowedTypes.Contains(request.Type))
            return ServiceResult<string>.Fail(
                $"Venue type must be one of: {string.Join(", ", AllowedTypes)}.", 400);

        request.Images = request.Images
            .Where(i => !string.IsNullOrWhiteSpace(i)).Select(i => i.Trim()).ToList();
        request.Ingredients = request.Ingredients
            .Where(i => !string.IsNullOrWhiteSpace(i)).Select(i => i.Trim()).ToList();

        // The hero lives on the venue row and is never a gallery row, so a
        // carousel cannot open with the same photograph twice. Same split as
        // villas.
        if (!string.IsNullOrWhiteSpace(request.Image))
            request.Images.RemoveAll(i =>
                string.Equals(i, request.Image, StringComparison.OrdinalIgnoreCase));

        if (request.Images.Count > 6)
            return ServiceResult<string>.Fail(
                "A venue may have at most 6 gallery images, not counting the hero.", 400);

        if (request.ReservationRequired && request.Capacity < 1)
            return ServiceResult<string>.Fail(
                "A venue that takes reservations needs a capacity above zero.", 400);

        if (request.CancellationNoticeHours is < 0 or > 720)
            return ServiceResult<string>.Fail(
                "Cancellation notice must be between 0 and 720 hours.", 400);

        var status = await _dining.SaveVenueAsync(request);

        return status switch
        {
            1 => ServiceResult<string>.Ok($"'{request.Name}' saved."),
            -2 => ServiceResult<string>.Fail("Unknown venue type.", 400),
            -3 => ServiceResult<string>.Fail(
                      "Some future sittings already seat more guests than the new capacity. " +
                      "Cancel those tables first, or choose a higher figure.", 409),
            _ => ServiceResult<string>.Fail("The venue could not be saved.", 500)
        };
    }

    public async Task<ServiceResult<string>> DeleteVenueAsync(string slug)
    {
        var rows = await _dining.DeleteVenueAsync(slug.Trim().ToLowerInvariant());

        // Soft only. Table reservations reference VenueId, and deleting the
        // row would erase where a guest actually ate.
        return rows > 0
            ? ServiceResult<string>.Ok(
                "Venue retired. It no longer appears on the dining page, and past " +
                "reservations keep their record.")
            : ServiceResult<string>.Fail("That venue no longer exists.", 404);
    }

    public async Task<ServiceResult<List<DiningReservationDto>>> GetReservationsForAdminAsync(
        DiningBookingSearchDto filter)
    {
        if (filter.Status is not null && !AllowedStatuses.Contains(filter.Status))
            return ServiceResult<List<DiningReservationDto>>.Fail(
                $"Status must be one of: {string.Join(", ", AllowedStatuses)}.", 400);

        var rows = await _dining.GetReservationsForAdminAsync(filter);
        return ServiceResult<List<DiningReservationDto>>.Ok(rows.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<string>> SetReservationStatusAsync(
        string referenceId, UpdateDiningStatusDto request)
    {
        if (!AllowedStatuses.Contains(request.Status))
            return ServiceResult<string>.Fail(
                $"Status must be one of: {string.Join(", ", AllowedStatuses)}.", 400);

        var status = await _dining.SetReservationStatusAsync(referenceId.Trim(), request.Status);

        return status switch
        {
            1 => ServiceResult<string>.Ok($"Table moved to {request.Status}."),
            -1 => ServiceResult<string>.Fail("That reservation could not be found.", 404),
            -2 => ServiceResult<string>.Fail(
                      "A completed or cancelled sitting cannot be reopened.", 409),
            _ => ServiceResult<string>.Fail("The status could not be changed.", 500)
        };
    }

    /* ================= mapping ================= */

    private static string? Normalise(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim().ToLowerInvariant();
        return trimmed == "all" ? null : trimmed;
    }

    private static DiningVenueDto ToDto(DiningVenue v) => new()
    {
        Id = v.Slug,
        Slug = v.Slug,
        Name = v.Name,
        Type = v.VenueType,
        Tagline = v.Tagline,
        Description = v.Description,
        Cuisine = v.Cuisine,
        DressCode = v.DressCode,
        Capacity = v.Capacity,
        OpenHours = v.OpeningHours,
        ChefName = v.ChefName,
        ChefBio = v.ChefBio,
        Image = v.MainImageUrl,
        ReservationRequired = v.ReservationRequired,
        Featured = v.IsFeatured,
        IsActive = v.IsActive,
        Images = v.Images,
        Ingredients = v.Ingredients,
        Menu = v.Menu.OrderBy(s => s.DisplayOrder).Select(s => new MenuSectionDto
        {
            Title = s.Title,
            Subtitle = s.Subtitle,
            Items = s.Items.OrderBy(i => i.DisplayOrder).Select(i => new MenuItemDto
            {
                Name = i.Name,
                Description = i.Description,
                Price = i.Price,
                Currency = i.Currency,
                IsVegetarian = i.IsVegetarian,
                IsVegan = i.IsVegan,
                IsSignature = i.IsSignature,
                Allergens = i.Allergens
            }).ToList()
        }).ToList(),
                CancellationNoticeHours = v.CancellationNoticeHours,
    };

    private static DiningReservationDto ToDto(DiningReservation r) => new()
    {
        ReferenceId = r.ReferenceId,
        Date = r.ReservationDate.ToString(DateFmt),
        Time = r.ReservationTime.ToString(@"hh\:mm"),
        PartySize = r.PartySize,
        GuestName = r.GuestName,
        Email = r.Email,
        Phone = r.Phone,
        Occasion = r.Occasion,
        DietaryNotes = r.DietaryNotes,
        SpecialRequests = r.SpecialRequests,
        Status = r.Status,
        CreatedAt = r.CreatedAt.ToString(StampFmt),
        VenueId = r.VenueSlug,
        VenueName = r.VenueName,
        VenueType = r.VenueType,
        VenueImage = r.MainImageUrl,
        OpenHours = r.OpeningHours,
        DressCode = r.DressCode,
        StayReference = r.StayReference,
        NoticeHours = r.NoticeHours,
        CancellationDeadline = r.CancellationDeadline?.ToString(StampFmt),
        CanCancel = r.CanCancel
    };

    public async Task<ServiceResult<string>> SaveMenuAsync(string slug, SaveDiningMenuDto request)
    {
        var sections = request.Sections
            .Where(s => !string.IsNullOrWhiteSpace(s.Title))
            .ToList();

        if (sections.Count == 0)
            return ServiceResult<string>.Fail(
                "A menu needs at least one section. To remove the menu entirely, " +
                "delete every course from the venue first.", 400);

        if (sections.All(s => s.Items.All(i => string.IsNullOrWhiteSpace(i.Name))))
            return ServiceResult<string>.Fail(
                "Every section is empty. Add at least one dish.", 400);

        var status = await _dining.SaveMenuAsync(slug.Trim().ToLowerInvariant(), request);

        //return status switch
        //{
        //    1 => ServiceResult<string>.Ok("Menu saved."),
        //    -1 => ServiceResult<string>.Fail("That venue no longer exists.", 404),
        //    -2 => ServiceResult<string>.Fail(
        //              "A dish was assigned to a section that no longer exists.", 400),
        //    _ => ServiceResult<string>.Fail("The menu could not be saved.", 500)
        //};
        return status switch
        {
            1 => ServiceResult<string>.Ok("Table reservation cancelled."),
            -1 => ServiceResult<string>.Fail("That reservation could not be found.", 404),
            -2 => ServiceResult<string>.Fail("That reservation is already cancelled.", 409),
            -3 => ServiceResult<string>.Fail(
                      "The free cancellation window for this table has passed. " +
                      "Please telephone the restaurant directly.", 409),
            -4 => ServiceResult<string>.Fail(
                      "That sitting has already begun and cannot be cancelled online.", 409),
            -5 => ServiceResult<string>.Fail(
                      "This table has already been seated. Please speak to the restaurant.", 409),
            _ => ServiceResult<string>.Fail("The reservation could not be cancelled.", 500)
        };
    }
}