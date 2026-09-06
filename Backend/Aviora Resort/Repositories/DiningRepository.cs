using System.Data;
using Microsoft.Data.SqlClient;
using AvioraResort.Data;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public class DiningRepository : IDiningRepository
{
    private readonly SqlHelper _db;

    public DiningRepository(SqlHelper db) => _db = db;

    private static DataTable ToTextTable(IEnumerable<string>? values)
    {
        var table = new DataTable();
        table.Columns.Add("Text", typeof(string));
        table.Columns.Add("DisplayOrder", typeof(int));

        var order = 1;
        foreach (var value in (values ?? Enumerable.Empty<string>())
                              .Where(v => !string.IsNullOrWhiteSpace(v))
                              .Select(v => v.Trim()))
        {
            table.Rows.Add(value, order++);
        }
        return table;
    }

    /// <summary>
    /// usp_Dining_GetVenues returns venues, gallery, sourcing notes, menu
    /// sections and menu items. Five result sets, one round trip, stitched on
    /// VenueId and then on SectionId.
    /// </summary>
    public Task<List<DiningVenue>> GetVenuesAsync(string? venueType, string? slug, bool includeInactive) =>
        _db.QueryMultipleAsync("dbo.usp_Dining_GetVenues", p =>
        {
            p.AddWithValue("@VenueType", (object?)venueType ?? DBNull.Value);
            p.AddWithValue("@Slug", (object?)slug ?? DBNull.Value);
            p.AddWithValue("@IncludeInactive", includeInactive);
        },
        async rd =>
        {
            var venues = new List<DiningVenue>();

            while (await rd.ReadAsync())
            {
                venues.Add(new DiningVenue
                {
                    VenueId = rd.GetInt("VenueId"),
                    Slug = rd.GetStringValue("Slug"),
                    Name = rd.GetStringValue("Name"),
                    VenueType = rd.GetStringValue("VenueType"),
                    Tagline = rd.GetNullableString("Tagline"),
                    Description = rd.GetNullableString("Description"),
                    Cuisine = rd.GetNullableString("Cuisine"),
                    DressCode = rd.GetNullableString("DressCode"),
                    Capacity = rd.GetInt("Capacity"),
                    OpeningHours = rd.GetNullableString("OpeningHours"),
                    ChefName = rd.GetNullableString("ChefName"),
                    ChefBio = rd.GetNullableString("ChefBio"),
                    MainImageUrl = rd.GetNullableString("MainImageUrl"),
                    ReservationRequired = rd.GetBool("ReservationRequired"),
                    IsFeatured = rd.GetBool("IsFeatured"),
                    DisplayOrder = rd.GetInt("DisplayOrder"),
                    CancellationNoticeHours = rd.GetInt("CancellationNoticeHours"),
                    IsActive = rd.GetBool("IsActive"),
                    CreatedAt = rd.GetDate("CreatedAt"),
                    UpdatedAt = rd.GetNullableDate("UpdatedAt")
                });
            }

            if (venues.Count == 0) return venues;

            var byId = venues.ToDictionary(v => v.VenueId);

            if (await rd.NextResultAsync())
            {
                while (await rd.ReadAsync())
                {
                    if (byId.TryGetValue(rd.GetInt("VenueId"), out var venue))
                        venue.Images.Add(rd.GetStringValue("ImageUrl"));
                }
            }

            if (await rd.NextResultAsync())
            {
                while (await rd.ReadAsync())
                {
                    if (byId.TryGetValue(rd.GetInt("VenueId"), out var venue))
                        venue.Ingredients.Add(rd.GetStringValue("Text"));
                }
            }

            var sectionsById = new Dictionary<int, DiningMenuSection>();

            if (await rd.NextResultAsync())
            {
                while (await rd.ReadAsync())
                {
                    var section = new DiningMenuSection
                    {
                        SectionId = rd.GetInt("SectionId"),
                        VenueId = rd.GetInt("VenueId"),
                        Title = rd.GetStringValue("Title"),
                        Subtitle = rd.GetNullableString("Subtitle"),
                        DisplayOrder = rd.GetInt("DisplayOrder")
                    };

                    sectionsById[section.SectionId] = section;

                    if (byId.TryGetValue(section.VenueId, out var venue))
                        venue.Menu.Add(section);
                }
            }

            // Items are keyed by SectionId rather than VenueId, so this pass
            // needs the dictionary built above.
            if (await rd.NextResultAsync())
            {
                while (await rd.ReadAsync())
                {
                    var sectionId = rd.GetInt("SectionId");
                    if (!sectionsById.TryGetValue(sectionId, out var section)) continue;

                    section.Items.Add(new DiningMenuItem
                    {
                        SectionId = sectionId,
                        Name = rd.GetStringValue("Name"),
                        Description = rd.GetNullableString("Description"),
                        Price = rd.GetNullableDecimal("Price"),
                        Currency = rd.GetStringValue("Currency").Trim(),
                        IsVegetarian = rd.GetBool("IsVegetarian"),
                        IsVegan = rd.GetBool("IsVegan"),
                        IsSignature = rd.GetBool("IsSignature"),
                        Allergens = rd.GetNullableString("Allergens"),
                        DisplayOrder = rd.GetInt("DisplayOrder")
                    });
                }
            }

            return venues;
        });

    public async Task<DiningAvailability> GetAvailabilityAsync(
        string slug, DateTime date, TimeSpan time, int partySize)
    {
        var row = await _db.QuerySingleAsync("dbo.usp_Dining_GetAvailability", p =>
        {
            p.AddWithValue("@Slug", slug);
            p.AddWithValue("@Date", date.Date);
            p.AddWithValue("@Time", time);
            p.AddWithValue("@PartySize", partySize);
        },
        rd => new DiningAvailability
        {
            Status = rd.GetInt("Status"),
            CoversLeft = rd.GetInt("CoversLeft"),
            Capacity = rd.GetInt("Capacity")
        });

        return row ?? new DiningAvailability { Status = -1 };
    }

    public async Task<(int Status, string? ReferenceId)> CreateReservationAsync(
        int? userId, CreateDiningReservationDto r)
    {
        var row = await _db.QuerySingleAsync("dbo.usp_Dining_CreateReservation", p =>
        {
            p.AddWithValue("@Slug", r.VenueId);
            p.AddWithValue("@UserId", (object?)userId ?? DBNull.Value);
            p.AddWithValue("@BookingRef", (object?)r.StayReference ?? DBNull.Value);
            p.AddWithValue("@Date", r.Date.Date);
            p.AddWithValue("@Time", TimeSpan.Parse(r.Time));
            p.AddWithValue("@PartySize", r.PartySize);
            p.AddWithValue("@GuestName", r.GuestName);
            p.AddWithValue("@Email", r.Email);
            p.AddWithValue("@Phone", (object?)r.Phone ?? DBNull.Value);
            p.AddWithValue("@Occasion", (object?)r.Occasion ?? DBNull.Value);
            p.AddWithValue("@DietaryNotes", (object?)r.DietaryNotes ?? DBNull.Value);
            p.AddWithValue("@SpecialRequests", (object?)r.SpecialRequests ?? DBNull.Value);
        },
        rd => (Status: rd.GetInt("Status"), ReferenceId: rd.GetNullableString("ReferenceId")));

        return row;
    }

    private static DiningReservation MapReservation(SqlDataReader rd) => new()
    {
        ReferenceId = rd.GetStringValue("ReferenceId"),
        ReservationDate = rd.GetDate("ReservationDate"),
        ReservationTime = (TimeSpan)rd["ReservationTime"],
        PartySize = rd.GetInt("PartySize"),
        GuestName = rd.GetStringValue("GuestName"),
        Email = rd.GetStringValue("Email"),
        Phone = rd.GetNullableString("Phone"),
        Occasion = rd.GetNullableString("Occasion"),
        DietaryNotes = rd.GetNullableString("DietaryNotes"),
        SpecialRequests = rd.GetNullableString("SpecialRequests"),
        Status = rd.GetStringValue("Status"),
        CreatedAt = rd.GetDate("CreatedAt"),
        VenueSlug = rd.GetStringValue("VenueSlug"),
        VenueName = rd.GetStringValue("VenueName"),
        VenueType = rd.GetStringValue("VenueType"),
        MainImageUrl = rd.GetNullableString("MainImageUrl"),
        OpeningHours = rd.GetNullableString("OpeningHours"),
        DressCode = rd.GetNullableString("DressCode"),
        StayReference = rd.GetNullableString("StayReference"),
        NoticeHours = rd.GetInt("NoticeHours"),
        CancellationDeadline = rd.GetNullableDate("CancellationDeadline"),
        CanCancel = rd.GetBool("CanCancel")
    };

    public Task<List<DiningReservation>> GetReservationsByUserAsync(int userId) =>
        _db.QueryListAsync("dbo.usp_Dining_GetByUser",
            p => p.AddWithValue("@UserId", userId), MapReservation);

    public Task<List<DiningReservation>> GetReservationsForAdminAsync(DiningBookingSearchDto f) =>
        _db.QueryListAsync("dbo.usp_Admin_Dining_GetBookings", p =>
        {
            p.AddWithValue("@VenueSlug", (object?)f.Venue ?? DBNull.Value);
            p.AddWithValue("@From", (object?)f.From?.Date ?? DBNull.Value);
            p.AddWithValue("@To", (object?)f.To?.Date ?? DBNull.Value);
            p.AddWithValue("@Status", (object?)f.Status ?? DBNull.Value);
            p.AddWithValue("@Search", (object?)f.Search ?? DBNull.Value);
        }, MapReservation);

    public Task<int> CancelReservationAsync(string referenceId, int? userId, bool isAdmin) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Dining_CancelReservation", p =>
        {
            p.AddWithValue("@ReferenceId", referenceId);
            p.AddWithValue("@UserId", (object?)userId ?? DBNull.Value);
            p.AddWithValue("@IsAdmin", isAdmin);
        });

    public Task<int> SetReservationStatusAsync(string referenceId, string newStatus) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Dining_SetStatus", p =>
        {
            p.AddWithValue("@ReferenceId", referenceId);
            p.AddWithValue("@NewStatus", newStatus);
        });

    public Task<int> SaveVenueAsync(SaveDiningVenueDto r) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Dining_SaveVenue", p =>
        {
            p.AddWithValue("@Slug", r.Id);
            p.AddWithValue("@Name", r.Name);
            p.AddWithValue("@VenueType", r.Type);
            p.AddWithValue("@Tagline", (object?)r.Tagline ?? DBNull.Value);
            p.AddWithValue("@Description", (object?)r.Description ?? DBNull.Value);
            p.AddWithValue("@Cuisine", (object?)r.Cuisine ?? DBNull.Value);
            p.AddWithValue("@DressCode", (object?)r.DressCode ?? DBNull.Value);
            p.AddWithValue("@Capacity", r.Capacity);
            p.AddWithValue("@OpeningHours", (object?)r.OpenHours ?? DBNull.Value);
            p.AddWithValue("@ChefName", (object?)r.ChefName ?? DBNull.Value);
            p.AddWithValue("@ChefBio", (object?)r.ChefBio ?? DBNull.Value);
            p.AddWithValue("@MainImageUrl", (object?)r.Image ?? DBNull.Value);
            p.AddWithValue("@ReservationRequired", r.ReservationRequired);
            p.AddWithValue("@IsFeatured", r.Featured);
            p.AddWithValue("@DisplayOrder", r.DisplayOrder);
            p.AddWithValue("@IsActive", r.IsActive);
            p.AddStructured("@Images", "dbo.DiningTextList", ToTextTable(r.Images));
            p.AddStructured("@Ingredients", "dbo.DiningTextList", ToTextTable(r.Ingredients));
            p.AddWithValue("@CancellationNoticeHours", r.CancellationNoticeHours);
        });

    public Task<int> DeleteVenueAsync(string slug) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Dining_DeleteVenue",
            p => p.AddWithValue("@Slug", slug));


    public Task<int> SaveMenuAsync(string slug, SaveDiningMenuDto request)
    {
        var sections = new DataTable();
        sections.Columns.Add("SectionKey", typeof(int));
        sections.Columns.Add("Title", typeof(string));
        sections.Columns.Add("Subtitle", typeof(string));
        sections.Columns.Add("DisplayOrder", typeof(int));

        var items = new DataTable();
        items.Columns.Add("SectionKey", typeof(int));
        items.Columns.Add("Name", typeof(string));
        items.Columns.Add("Description", typeof(string));
        items.Columns.Add("Price", typeof(decimal));
        items.Columns.Add("IsVegetarian", typeof(bool));
        items.Columns.Add("IsVegan", typeof(bool));
        items.Columns.Add("IsSignature", typeof(bool));
        items.Columns.Add("Allergens", typeof(string));
        items.Columns.Add("DisplayOrder", typeof(int));

        // SectionKey is assigned here rather than by the client, because the
        // real SectionId does not exist until the procedure inserts the rows.
        var sectionKey = 1;

        foreach (var section in request.Sections.Where(s => !string.IsNullOrWhiteSpace(s.Title)))
        {
            sections.Rows.Add(sectionKey, section.Title.Trim(),
                              (object?)section.Subtitle?.Trim() ?? DBNull.Value, sectionKey);

            var itemOrder = 1;
            foreach (var item in section.Items.Where(i => !string.IsNullOrWhiteSpace(i.Name)))
            {
                items.Rows.Add(
                    sectionKey,
                    item.Name.Trim(),
                    (object?)item.Description?.Trim() ?? DBNull.Value,
                    (object?)item.Price ?? DBNull.Value,
                    item.IsVegetarian || item.IsVegan,   // vegan implies vegetarian
                    item.IsVegan,
                    item.IsSignature,
                    (object?)item.Allergens?.Trim() ?? DBNull.Value,
                    itemOrder++);
            }

            sectionKey++;
        }

        return _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Dining_SaveMenu", p =>
        {
            p.AddWithValue("@Slug", slug);
            p.AddStructured("@Sections", "dbo.DiningMenuSectionList", sections);
            p.AddStructured("@Items", "dbo.DiningMenuItemList", items);
        });
    }
}