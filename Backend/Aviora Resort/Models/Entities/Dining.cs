namespace AvioraResort.Models.Entities;

public class DiningVenue
{
    public int VenueId { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string VenueType { get; set; } = string.Empty;
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public string? Cuisine { get; set; }
    public string? DressCode { get; set; }

    /// <summary>Covers per sitting. The reservation procedure will not exceed it.</summary>
    public int Capacity { get; set; }

    public string? OpeningHours { get; set; }
    public string? ChefName { get; set; }
    public string? ChefBio { get; set; }
    public string? MainImageUrl { get; set; }
    public bool ReservationRequired { get; set; }
    public bool IsFeatured { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<string> Images { get; set; } = new();
    public List<string> Ingredients { get; set; } = new();
    public List<DiningMenuSection> Menu { get; set; } = new();

    public int CancellationNoticeHours { get; set; } = 4;
}

public class DiningMenuSection
{
    public int SectionId { get; set; }
    public int VenueId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public int DisplayOrder { get; set; }

    public List<DiningMenuItem> Items { get; set; } = new();
}

public class DiningMenuItem
{
    public int SectionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Null on a course that belongs to a fixed tasting menu.</summary>
    public decimal? Price { get; set; }

    public string Currency { get; set; } = "LKR";
    public bool IsVegetarian { get; set; }
    public bool IsVegan { get; set; }
    public bool IsSignature { get; set; }
    public string? Allergens { get; set; }
    public int DisplayOrder { get; set; }
}

public class DiningReservation
{
    public string ReferenceId { get; set; } = string.Empty;
    public DateTime ReservationDate { get; set; }
    public TimeSpan ReservationTime { get; set; }
    public int PartySize { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Occasion { get; set; }
    public string? DietaryNotes { get; set; }
    public string? SpecialRequests { get; set; }
    public string Status { get; set; } = "Confirmed";
    public DateTime CreatedAt { get; set; }

    public string VenueSlug { get; set; } = string.Empty;
    public string VenueName { get; set; } = string.Empty;
    public string VenueType { get; set; } = string.Empty;
    public string? MainImageUrl { get; set; }
    public string? OpeningHours { get; set; }
    public string? DressCode { get; set; }

    /// <summary>The stay this table is attached to, when there is one.</summary>
    public string? StayReference { get; set; }

    public bool CanCancel { get; set; }

    /// <summary>The policy as it stood when the table was booked, not a live lookup.</summary>
    public int NoticeHours { get; set; }
    public DateTime? CancellationDeadline { get; set; }
}

/// <summary>Result of usp_Dining_GetAvailability.</summary>
public class DiningAvailability
{
    public int Status { get; set; }
    public int CoversLeft { get; set; }
    public int Capacity { get; set; }
}