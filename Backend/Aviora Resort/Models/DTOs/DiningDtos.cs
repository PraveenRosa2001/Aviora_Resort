using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace AvioraResort.Models.DTOs;

/// <summary>
/// Field names match what diningVenues.json used, so the Dining page's
/// existing markup needs no renaming - it just stops importing the file.
/// </summary>
public class DiningVenueDto
{
    public string Id { get; set; } = string.Empty;   // Slug
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public string? Cuisine { get; set; }
    public string? DressCode { get; set; }
    public int Capacity { get; set; }
    public string? OpenHours { get; set; }
    public string? ChefName { get; set; }
    public string? ChefBio { get; set; }
    public string? Image { get; set; }
    public bool ReservationRequired { get; set; }
    public bool Featured { get; set; }
    public bool IsActive { get; set; } = true;

    public List<string> Images { get; set; } = new();
    public List<string> Ingredients { get; set; } = new();
    public List<MenuSectionDto> Menu { get; set; } = new();

    public int CancellationNoticeHours { get; set; } = 4;
}


public class SaveDiningMenuDto
{
    public List<SaveMenuSectionDto> Sections { get; set; } = new();
}

public class SaveMenuSectionDto
{
    [Required, MaxLength(120)] public string Title { get; set; } = string.Empty;
    [MaxLength(250)] public string? Subtitle { get; set; }

    public List<SaveMenuItemDto> Items { get; set; } = new();
}

public class SaveMenuItemDto
{
    [Required, MaxLength(200)] public string Name { get; set; } = string.Empty;
    [MaxLength(500)] public string? Description { get; set; }

    /// <summary>Null for a course on a fixed tasting menu with no separate price.</summary>
    [Range(0, 10000000)] public decimal? Price { get; set; }

    public bool IsVegetarian { get; set; }
    public bool IsVegan { get; set; }
    public bool IsSignature { get; set; }

    [MaxLength(200)] public string? Allergens { get; set; }
}
public class MenuSectionDto
{
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public List<MenuItemDto> Items { get; set; } = new();
}

public class MenuItemDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public string Currency { get; set; } = "LKR";
    public bool IsVegetarian { get; set; }
    public bool IsVegan { get; set; }
    public bool IsSignature { get; set; }
    public string? Allergens { get; set; }
}

public class DiningAvailabilityRequestDto
{
    [FromQuery(Name = "date")] public DateTime? Date { get; set; }
    [FromQuery(Name = "time")] public string? Time { get; set; }   // "19:30"
    [FromQuery(Name = "partySize")] public int PartySize { get; set; } = 2;
}

public class DiningAvailabilityResultDto
{
    public bool Available { get; set; }
    public int CoversLeft { get; set; }
    public int Capacity { get; set; }
    public string Reason { get; set; } = "Ok";
    public string Message { get; set; } = string.Empty;
}

public class CreateDiningReservationDto
{
    [Required] public string VenueId { get; set; } = string.Empty;   // Slug

    [Required] public DateTime Date { get; set; }

    /// <summary>Sitting time as HH:mm, e.g. "19:30".</summary>
    [Required]
    [RegularExpression(@"^([01]\d|2[0-3]):[0-5]\d$",
        ErrorMessage = "Time must be in 24-hour HH:mm form, for example 19:30")]
    public string Time { get; set; } = string.Empty;

    [Range(1, 40, ErrorMessage = "Party size must be between 1 and 40")]
    public int PartySize { get; set; } = 2;

    [Required(ErrorMessage = "A name is required"), MaxLength(120)]
    public string GuestName { get; set; } = string.Empty;

    [Required(ErrorMessage = "An email address is required")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address")]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)] public string? Phone { get; set; }
    [MaxLength(100)] public string? Occasion { get; set; }
    [MaxLength(500)] public string? DietaryNotes { get; set; }
    [MaxLength(2000)] public string? SpecialRequests { get; set; }

    /// <summary>Optional stay reference, e.g. AVR-100001. Ignored if unknown.</summary>
    [MaxLength(20)] public string? StayReference { get; set; }
}

public class DiningReservationDto
{
    public string ReferenceId { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public int PartySize { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Occasion { get; set; }
    public string? DietaryNotes { get; set; }
    public string? SpecialRequests { get; set; }
    public string Status { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;

    public string VenueId { get; set; } = string.Empty;   // Slug
    public string VenueName { get; set; } = string.Empty;
    public string VenueType { get; set; } = string.Empty;
    public string? VenueImage { get; set; }
    public string? OpenHours { get; set; }
    public string? DressCode { get; set; }
    public string? StayReference { get; set; }

    // Cancellation information
    public int NoticeHours { get; set; }
    public string? CancellationDeadline { get; set; }
    public bool CanCancel { get; set; }
}

public class CreateDiningResultDto
{
    public bool Success { get; set; }
    public string? ReferenceId { get; set; }
    public string Message { get; set; } = string.Empty;
    public DiningReservationDto? Reservation { get; set; }
}

/* ---------------- administrator ---------------- */

public class SaveDiningVenueDto
{
    [Required, MaxLength(100)]
    [RegularExpression("^[a-z0-9-]+$",
        ErrorMessage = "The slug may contain lowercase letters, numbers and hyphens only")]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(120)] public string Name { get; set; } = string.Empty;
    [Required, MaxLength(30)] public string Type { get; set; } = "restaurant";
    [MaxLength(300)] public string? Tagline { get; set; }
    public string? Description { get; set; }
    [MaxLength(150)] public string? Cuisine { get; set; }
    [MaxLength(120)] public string? DressCode { get; set; }

    [Range(1, 1000)] public int Capacity { get; set; } = 30;

    [MaxLength(300)] public string? OpenHours { get; set; }
    [MaxLength(120)] public string? ChefName { get; set; }
    public string? ChefBio { get; set; }
    [MaxLength(300)] public string? Image { get; set; }

    public bool ReservationRequired { get; set; }
    public bool Featured { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;

    /// <summary>Gallery, at most six. The hero is `Image` and is not one of these.</summary>
    public List<string> Images { get; set; } = new();
    public List<string> Ingredients { get; set; } = new();

    [Range(0, 720, ErrorMessage = "Notice must be between 0 and 720 hours")]
    public int CancellationNoticeHours { get; set; } = 4;
}

public class DiningBookingSearchDto
{
    [FromQuery(Name = "venue")] public string? Venue { get; set; }
    [FromQuery(Name = "from")] public DateTime? From { get; set; }
    [FromQuery(Name = "to")] public DateTime? To { get; set; }
    [FromQuery(Name = "status")] public string? Status { get; set; }
    [FromQuery(Name = "search")] public string? Search { get; set; }
}

public class UpdateDiningStatusDto
{
    /// <summary>Confirmed, Seated, Completed, Cancelled or No-Show.</summary>
    [Required, MaxLength(20)] public string Status { get; set; } = string.Empty;
}