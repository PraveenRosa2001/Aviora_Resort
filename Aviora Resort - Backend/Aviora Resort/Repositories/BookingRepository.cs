using System.Data;
using Microsoft.Data.SqlClient;
using AvioraResort.Data;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public class BookingRepository : IBookingRepository
{
    private readonly SqlHelper _db;

    public BookingRepository(SqlHelper db) => _db = db;

    /// <summary>Builds the dbo.BookingAddonList table-valued parameter.</summary>
    private static DataTable ToAddonTable(IEnumerable<string>? addonCodes)
    {
        var table = new DataTable();
        table.Columns.Add("AddonCode", typeof(string));
        table.Columns.Add("Quantity", typeof(int));

        foreach (var code in (addonCodes ?? Enumerable.Empty<string>())
                             .Where(a => !string.IsNullOrWhiteSpace(a))
                             .Select(a => a.Trim())
                             .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            table.Rows.Add(code, 1);
        }

        return table;
    }

    private static BookingAddonLine MapAddon(SqlDataReader rd) => new()
    {
        AddonCode = rd.GetStringValue("AddonCode"),
        Name = rd.GetStringValue("Name"),
        UnitPrice = rd.GetDecimal("UnitPrice"),
        Quantity = rd.GetInt("Quantity"),
        ChargeBasis = rd.GetStringValue("ChargeBasis"),
        LineTotal = rd.GetDecimal("LineTotal")
    };

    private static BookingTaxLine MapTax(SqlDataReader rd) => new()
    {
        Code = rd.GetStringValue("Code"),
        DisplayName = rd.GetStringValue("DisplayName"),
        Percentage = rd.GetDecimal("Percentage"),
        ApplyOrder = rd.GetInt("ApplyOrder"),
        BaseAmount = rd.GetDecimal("BaseAmount"),
        TaxAmount = rd.GetDecimal("TaxAmount")
    };

    /// <summary>
    /// usp_Booking_CalculateQuote returns totals, then add-on lines, then tax
    /// lines. Read in one round trip.
    /// </summary>
    public Task<BookingQuote> CalculateQuoteAsync(QuoteRequestDto request) =>
        _db.QueryMultipleAsync("dbo.usp_Booking_CalculateQuote", p =>
        {
            p.AddWithValue("@VillaCode", request.VillaId);
            p.AddWithValue("@RatePlanCode", request.RatePlan);
            p.AddWithValue("@CheckIn", request.CheckIn.Date);
            p.AddWithValue("@CheckOut", request.CheckOut.Date);
            p.AddWithValue("@Adults", request.Adults);
            p.AddWithValue("@Children", request.Children);
            p.AddWithValue("@PromoCode", (object?)request.PromoCode ?? DBNull.Value);
            p.AddStructured("@Addons", "dbo.BookingAddonList", ToAddonTable(request.Addons));
        },
        async rd =>
        {
            var quote = new BookingQuote { Status = -99 };

            if (await rd.ReadAsync())
            {
                quote.Status = rd.GetInt("Status");
                quote.Message = rd.GetNullableString("Message");

                // A refusal returns only Status and Message, so stop here.
                if (quote.Status == 1)
                {
                    quote.VillaCode = rd.GetStringValue("VillaCode");
                    quote.RatePlanCode = rd.GetStringValue("RatePlanCode");
                    quote.CheckIn = rd.GetDate("CheckIn");
                    quote.CheckOut = rd.GetDate("CheckOut");
                    quote.Nights = rd.GetInt("Nights");
                    quote.Adults = rd.GetInt("Adults");
                    quote.Children = rd.GetInt("Children");
                    quote.BaseRatePerNight = rd.GetDecimal("BaseRatePerNight");
                    quote.RatePlanDiscountPct = rd.GetDecimal("RatePlanDiscountPct");
                    quote.AverageNightlyRate = rd.GetDecimal("AverageNightlyRate");
                    quote.RoomSubtotal = rd.GetDecimal("RoomSubtotal");
                    quote.AddonsTotal = rd.GetDecimal("AddonsTotal");
                    quote.PromoDiscountPct = rd.GetDecimal("PromoDiscountPct");
                    quote.DiscountAmount = rd.GetDecimal("DiscountAmount");
                    quote.NetSubtotal = rd.GetDecimal("NetSubtotal");
                    quote.TaxTotal = rd.GetDecimal("TaxTotal");
                    quote.FinalTotal = rd.GetDecimal("FinalTotal");
                    quote.Currency = rd.GetStringValue("Currency").Trim();
                    quote.IsRefundable = rd.GetBool("IsRefundable");
                    quote.CancellationHours = rd.GetNullableInt("CancellationHours");
                    quote.RequiresPrepayment = rd.GetBool("RequiresPrepayment");
                    quote.CancellationDeadline = rd.GetNullableDate("CancellationDeadline");
                    quote.PromoApplied = rd.GetBool("PromoApplied");
                    quote.PromoStatus = rd.GetInt("PromoStatus");
                    quote.PromoMessage = rd.GetNullableString("PromoMessage");
                }
            }

            if (quote.Status != 1) return quote;

            if (await rd.NextResultAsync())
                while (await rd.ReadAsync()) quote.Addons.Add(MapAddon(rd));

            if (await rd.NextResultAsync())
                while (await rd.ReadAsync()) quote.Taxes.Add(MapTax(rd));

            return quote;
        });

    public async Task<(int Status, string? ReferenceId, string? Message)>
        CreateAsync(int? userId, CreateBookingRequestDto r)
    {
        var row = await _db.QuerySingleAsync("dbo.usp_Booking_Create", p =>
        {
            p.AddWithValue("@UserId", (object?)userId ?? DBNull.Value);
            p.AddWithValue("@VillaCode", r.VillaId);
            p.AddWithValue("@RatePlanCode", r.RatePlan);
            p.AddWithValue("@CheckIn", r.CheckIn.Date);
            p.AddWithValue("@CheckOut", r.CheckOut.Date);
            p.AddWithValue("@Adults", r.Adults);
            p.AddWithValue("@Children", r.Children);
            p.AddWithValue("@PromoCode", (object?)r.PromoCode ?? DBNull.Value);
            p.AddWithValue("@FirstName", r.FirstName);
            p.AddWithValue("@LastName", r.LastName);
            p.AddWithValue("@Email", r.Email);
            p.AddWithValue("@Phone", (object?)r.Phone ?? DBNull.Value);
            p.AddWithValue("@Country", (object?)r.Country ?? DBNull.Value);
            p.AddWithValue("@BedPreference", (object?)r.BedPreference ?? DBNull.Value);
            p.AddWithValue("@SpecialRequests", (object?)r.SpecialRequests ?? DBNull.Value);
            p.AddWithValue("@FlightNumber", (object?)r.FlightNumber ?? DBNull.Value);
            p.AddWithValue("@ArrivalTime", (object?)r.ArrivalTime ?? DBNull.Value);
            p.AddWithValue("@PaymentMethod", r.PaymentMethod);
            p.AddWithValue("@CardHolderName", (object?)r.CardHolderName ?? DBNull.Value);
            p.AddWithValue("@CardLast4", (object?)r.CardLast4 ?? DBNull.Value);
            p.AddStructured("@Addons", "dbo.BookingAddonList", ToAddonTable(r.Addons));
        },
        rd => (
            Status: rd.GetInt("Status"),
            ReferenceId: rd.GetNullableString("ReferenceId"),
            Message: rd.GetNullableString("Message")
        ));

        return row;
    }

    private static Booking MapBookingSummary(SqlDataReader rd) => new()
    {
        ReferenceId = rd.GetStringValue("ReferenceId"),
        Status = rd.GetStringValue("Status"),
        CheckIn = rd.GetDate("CheckIn"),
        CheckOut = rd.GetDate("CheckOut"),
        Nights = rd.GetInt("Nights"),
        Adults = rd.GetInt("Adults"),
        Children = rd.GetInt("Children"),
        VillaCode = rd.GetStringValue("VillaCode"),
        VillaName = rd.GetStringValue("VillaName"),
        MainImageUrl = rd.GetNullableString("MainImageUrl"),
        RatePlanCode = rd.GetStringValue("RatePlanCode"),
        RatePlanName = rd.GetStringValue("RatePlanName"),
        FinalTotal = rd.GetDecimal("FinalTotal"),
        Currency = rd.GetStringValue("Currency").Trim(),
        IsRefundable = rd.GetBool("IsRefundable"),
        CancellationDeadline = rd.GetNullableDate("CancellationDeadline"),
        CanCancel = rd.GetBool("CanCancel"),
        BookedAt = rd.GetDate("BookedAt"),
        AddonCount = rd.HasColumn("AddonCount") ? rd.GetInt("AddonCount") : 0
    };

    public Task<List<Booking>> GetByUserAsync(int userId, bool includeCancelled) =>
        _db.QueryListAsync("dbo.usp_Booking_GetByUser", p =>
        {
            p.AddWithValue("@UserId", userId);
            p.AddWithValue("@IncludeCancelled", includeCancelled);
        }, MapBookingSummary);

    /// <summary>Four result sets: the booking, its add-ons, its tax lines, its history.</summary>
    public Task<Booking?> GetByReferenceAsync(string referenceId, int? userId, bool isAdmin) =>
        _db.QueryMultipleAsync("dbo.usp_Booking_GetByReference", p =>
        {
            p.AddWithValue("@ReferenceId", referenceId);
            p.AddWithValue("@UserId", (object?)userId ?? DBNull.Value);
            p.AddWithValue("@IsAdmin", isAdmin);
        },
        async rd =>
        {
            Booking? booking = null;

            if (await rd.ReadAsync())
            {
                booking = MapBookingSummary(rd);

                booking.BedConfiguration = rd.GetNullableString("BedConfiguration");
                booking.CategoryCode = rd.GetNullableString("CategoryCode");
                booking.ViewCode = rd.GetNullableString("ViewCode");
                booking.RatePlanBadge = rd.GetNullableString("RatePlanBadge");
                booking.Units = rd.GetInt("Units");
                booking.BaseRatePerNight = rd.GetDecimal("BaseRatePerNight");
                booking.RatePlanDiscountPct = rd.GetDecimal("RatePlanDiscountPct");
                booking.RoomSubtotal = rd.GetDecimal("RoomSubtotal");
                booking.AddonsTotal = rd.GetDecimal("AddonsTotal");
                booking.PromoDiscountPct = rd.GetDecimal("PromoDiscountPct");
                booking.DiscountAmount = rd.GetDecimal("DiscountAmount");
                booking.NetSubtotal = rd.GetDecimal("NetSubtotal");
                booking.TaxTotal = rd.GetDecimal("TaxTotal");
                booking.PromoCode = rd.GetNullableString("PromoCode");
                booking.CancelledAt = rd.GetNullableDate("CancelledAt");
                booking.CancellationReason = rd.GetNullableString("CancellationReason");

                booking.Guest = new BookingGuest
                {
                    FirstName = rd.GetStringValue("FirstName"),
                    LastName = rd.GetStringValue("LastName"),
                    Email = rd.GetStringValue("Email"),
                    Phone = rd.GetNullableString("Phone"),
                    Country = rd.GetNullableString("Country"),
                    BedPreference = rd.GetNullableString("BedPreference"),
                    SpecialRequests = rd.GetNullableString("SpecialRequests"),
                    FlightNumber = rd.GetNullableString("FlightNumber"),
                    ArrivalTime = rd.GetNullableString("ArrivalTime")
                };

                booking.Payment = new BookingPayment
                {
                    PaymentMethod = rd.GetStringValue("PaymentMethod"),
                    PaymentStatus = rd.GetStringValue("PaymentStatus"),
                    CardLast4 = rd.GetNullableString("CardLast4"),
                    CardHolderName = rd.GetNullableString("CardHolderName")
                };
            }

            if (booking is null) return null;

            if (await rd.NextResultAsync())
                while (await rd.ReadAsync()) booking.Addons.Add(MapAddon(rd));

            if (await rd.NextResultAsync())
                while (await rd.ReadAsync()) booking.Taxes.Add(MapTax(rd));

            if (await rd.NextResultAsync())
            {
                while (await rd.ReadAsync())
                {
                    booking.History.Add(new BookingStatusStep
                    {
                        OldStatus = rd.GetNullableString("OldStatus"),
                        NewStatus = rd.GetStringValue("NewStatus"),
                        Remarks = rd.GetNullableString("Remarks"),
                        ChangedBy = rd.GetNullableString("ChangedBy"),
                        ChangedAt = rd.GetDate("ChangedAt")
                    });
                }
            }

            return booking;
        });

    public Task<int> CancelAsync(string referenceId, int? userId, bool isAdmin, string? reason) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Booking_Cancel", p =>
        {
            p.AddWithValue("@ReferenceId", referenceId);
            p.AddWithValue("@UserId", (object?)userId ?? DBNull.Value);
            p.AddWithValue("@IsAdmin", isAdmin);
            p.AddWithValue("@Reason", (object?)reason ?? DBNull.Value);
        });

    public async Task<(List<Booking> Items, int TotalCount)> SearchAsync(BookingSearchDto f)
    {
        var total = 0;

        var items = await _db.QueryListAsync("dbo.usp_Admin_Booking_Search", p =>
        {
            p.AddWithValue("@Search", (object?)f.Search ?? DBNull.Value);
            p.AddWithValue("@Status", (object?)f.Status ?? DBNull.Value);
            p.AddWithValue("@From", (object?)f.From?.Date ?? DBNull.Value);
            p.AddWithValue("@To", (object?)f.To?.Date ?? DBNull.Value);
            p.AddWithValue("@Page", f.Page);
            p.AddWithValue("@PageSize", f.PageSize);
        },
        rd =>
        {
            // COUNT(*) OVER () rides along on every row, so the total comes
            // back without a second query.
            total = rd.GetInt("TotalCount");

            var b = new Booking
            {
                ReferenceId = rd.GetStringValue("ReferenceId"),
                Status = rd.GetStringValue("Status"),
                CheckIn = rd.GetDate("CheckIn"),
                CheckOut = rd.GetDate("CheckOut"),
                Nights = rd.GetInt("Nights"),
                Adults = rd.GetInt("Adults"),
                Children = rd.GetInt("Children"),
                FinalTotal = rd.GetDecimal("FinalTotal"),
                Currency = rd.GetStringValue("Currency").Trim(),
                BookedAt = rd.GetDate("BookedAt"),
                VillaCode = rd.GetStringValue("VillaCode"),
                VillaName = rd.GetStringValue("VillaName"),
                MainImageUrl = rd.GetNullableString("MainImageUrl"),
                RatePlanCode = rd.GetStringValue("RatePlanCode"),
                RatePlanName = rd.GetStringValue("RatePlanName"),
                Guest = new BookingGuest
                {
                    FirstName = rd.GetStringValue("FirstName"),
                    LastName = rd.GetStringValue("LastName"),
                    Email = rd.GetStringValue("Email"),
                    Phone = rd.GetNullableString("Phone"),
                    Country = rd.GetNullableString("Country"),
                    SpecialRequests = rd.GetNullableString("SpecialRequests"),
                    FlightNumber = rd.GetNullableString("FlightNumber"),
                    ArrivalTime = rd.GetNullableString("ArrivalTime")
                },
                Payment = new BookingPayment
                {
                    PaymentMethod = rd.GetStringValue("PaymentMethod"),
                    PaymentStatus = rd.GetStringValue("PaymentStatus")
                }
            };

            return b;
        });

        return (items, total);
    }

    public Task<int> SetStatusAsync(string referenceId, string newStatus, int adminUserId, string? remarks) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Booking_SetStatus", p =>
        {
            p.AddWithValue("@ReferenceId", referenceId);
            p.AddWithValue("@NewStatus", newStatus);
            p.AddWithValue("@AdminUserId", adminUserId);
            p.AddWithValue("@Remarks", (object?)remarks ?? DBNull.Value);
        });

    public Task<DashboardKpis> GetKpisAsync() =>
        _db.QueryMultipleAsync("dbo.usp_Admin_Dashboard_Kpis", null, async rd =>
        {
            var kpis = new DashboardKpis();

            if (await rd.ReadAsync())
            {
                kpis.TotalRevenue = rd.GetDecimal("TotalRevenue");
                kpis.Revenue30Days = rd.GetDecimal("Revenue30Days");
                kpis.ConfirmedCount = rd.GetInt("ConfirmedCount");
                kpis.InHouseCount = rd.GetInt("InHouseCount");
                kpis.ArrivalsToday = rd.GetInt("ArrivalsToday");
                kpis.DeparturesToday = rd.GetInt("DeparturesToday");
                kpis.Cancellations30Days = rd.GetInt("Cancellations30Days");
                kpis.OccupancyToday = rd.GetDecimal("OccupancyToday");
            }

            if (await rd.NextResultAsync())
            {
                while (await rd.ReadAsync())
                {
                    kpis.Movements.Add(new TodayMovement
                    {
                        ReferenceId = rd.GetStringValue("ReferenceId"),
                        Status = rd.GetStringValue("Status"),
                        CheckIn = rd.GetDate("CheckIn"),
                        CheckOut = rd.GetDate("CheckOut"),
                        VillaName = rd.GetStringValue("VillaName"),
                        FirstName = rd.GetNullableString("FirstName"),
                        LastName = rd.GetNullableString("LastName"),
                        FlightNumber = rd.GetNullableString("FlightNumber"),
                        ArrivalTime = rd.GetNullableString("ArrivalTime"),
                        SpecialRequests = rd.GetNullableString("SpecialRequests"),
                        Movement = rd.GetStringValue("Movement")
                    });
                }
            }

            return kpis;
        });
}