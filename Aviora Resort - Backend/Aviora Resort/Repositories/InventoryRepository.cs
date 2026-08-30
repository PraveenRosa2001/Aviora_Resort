using AvioraResort.Data;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public class InventoryRepository : IInventoryRepository
{
    private readonly SqlHelper _db;

    public InventoryRepository(SqlHelper db) => _db = db;

    public async Task<AvailabilityCheck> CheckAvailabilityAsync(string villaCode, DateTime checkIn,
                                                                DateTime checkOut, int unitsWanted)
    {
        var result = await _db.QuerySingleAsync("dbo.usp_Villa_CheckAvailability", p =>
        {
            p.AddWithValue("@VillaCode", villaCode);
            p.AddWithValue("@CheckIn", checkIn.Date);
            p.AddWithValue("@CheckOut", checkOut.Date);
            p.AddWithValue("@UnitsWanted", unitsWanted);
        },
        rd => new AvailabilityCheck
        {
            Status = rd.GetInt("Status"),
            UnitsAvailable = rd.GetInt("UnitsAvailable"),
            Nights = rd.GetInt("Nights"),
            FirstProblemDate = rd.GetNullableDate("FirstProblemDate"),
            Detail = rd.GetNullableString("Detail")
        });

        return result ?? new AvailabilityCheck { Status = -1 };
    }

    private static VillaInventoryNight MapNight(Microsoft.Data.SqlClient.SqlDataReader rd) => new()
    {
        VillaId = rd.HasColumn("VillaId") ? rd.GetInt("VillaId") : 0,
        StayDate = rd.GetDate("StayDate"),
        TotalUnits = rd.GetInt("TotalUnits"),
        UnitsBooked = rd.GetInt("UnitsBooked"),
        UnitsAvailable = rd.GetInt("UnitsAvailable"),
        IsBlocked = rd.GetBool("IsBlocked"),
        BlockReason = rd.GetNullableString("BlockReason"),
        MinNights = rd.GetInt("MinNights"),
        PricePerNight = rd.HasColumn("PricePerNight") ? rd.GetDecimal("PricePerNight") : 0m,
        HasPriceOverride = rd.HasColumn("HasPriceOverride")
                             ? rd.GetBool("HasPriceOverride")
                             : rd.HasColumn("PriceOverride") && rd.GetNullableDecimal("PriceOverride") is not null,
        IsBookable = rd.HasColumn("IsBookable") ? rd.GetBool("IsBookable") : true
    };

    public Task<List<VillaInventoryNight>> GetCalendarAsync(string villaCode, DateTime from, DateTime to) =>
        _db.QueryListAsync("dbo.usp_Villa_GetCalendar", p =>
        {
            p.AddWithValue("@VillaCode", villaCode);
            p.AddWithValue("@From", from.Date);
            p.AddWithValue("@To", to.Date);
        }, MapNight);

    /// <summary>
    /// usp_Admin_Inventory_GetGrid returns villas, then their nights, then a
    /// summary line each. Read as one round trip - the alternative is one
    /// query per villa, which for six villas over ninety days is seven.
    /// </summary>
    public Task<List<InventoryGridVilla>> GetGridAsync(DateTime from, DateTime to) =>
        _db.QueryMultipleAsync("dbo.usp_Admin_Inventory_GetGrid", p =>
        {
            p.AddWithValue("@From", from.Date);
            p.AddWithValue("@To", to.Date);
        },
        async rd =>
        {
            var villas = new List<InventoryGridVilla>();
            while (await rd.ReadAsync())
            {
                villas.Add(new InventoryGridVilla
                {
                    VillaId = rd.GetInt("VillaId"),
                    VillaCode = rd.GetStringValue("VillaCode"),
                    Name = rd.GetStringValue("Name"),
                    TotalUnits = rd.GetInt("TotalUnits"),
                    PricePerNight = rd.GetDecimal("PricePerNight"),
                    Currency = rd.GetStringValue("Currency").Trim()
                });
            }

            var byId = villas.ToDictionary(v => v.VillaId);

            if (await rd.NextResultAsync())
            {
                while (await rd.ReadAsync())
                {
                    var night = MapNight(rd);
                    if (byId.TryGetValue(night.VillaId, out var villa))
                    {
                        // The grid procedure has no PricePerNight column, so
                        // fall back to the villa's base rate unless the night
                        // carries an override.
                        if (night.PricePerNight == 0m)
                            night.PricePerNight = villa.PricePerNight;

                        night.IsBookable = !night.IsBlocked && night.UnitsAvailable > 0;
                        villa.Nights.Add(night);
                    }
                }
            }

            if (await rd.NextResultAsync())
            {
                while (await rd.ReadAsync())
                {
                    var villaId = rd.GetInt("VillaId");
                    if (!byId.TryGetValue(villaId, out var villa)) continue;

                    villa.NightsInWindow = rd.GetInt("NightsInWindow");
                    villa.UnitNights = rd.GetInt("UnitNights");
                    villa.UnitNightsSold = rd.GetInt("UnitNightsSold");
                    villa.BlockedNights = rd.GetInt("BlockedNights");
                    villa.OccupancyPercent = rd.GetDecimal("OccupancyPercent");
                }
            }

            return villas;
        });

    public async Task<(int Status, int RowsAffected)> SetRangeAsync(string villaCode, SetInventoryRangeDto r)
    {
        var row = await _db.QuerySingleAsync("dbo.usp_Admin_Inventory_SetRange", p =>
        {
            p.AddWithValue("@VillaCode", villaCode);
            p.AddWithValue("@From", r.From.Date);
            p.AddWithValue("@To", r.To.Date);
            p.AddWithValue("@TotalUnits", (object?)r.TotalUnits ?? DBNull.Value);
            p.AddWithValue("@IsBlocked", (object?)r.IsBlocked ?? DBNull.Value);
            p.AddWithValue("@BlockReason", (object?)r.BlockReason ?? DBNull.Value);
            p.AddWithValue("@PriceOverride", (object?)r.PriceOverride ?? DBNull.Value);
            p.AddWithValue("@ClearPriceOverride", r.ClearPriceOverride);
            p.AddWithValue("@MinNights", (object?)r.MinNights ?? DBNull.Value);
            p.AddWithValue("@DaysOfWeek", (object?)r.DaysOfWeek ?? DBNull.Value);
        },
        rd => (Status: rd.GetInt("Status"), RowsAffected: rd.GetInt("RowsAffected")));

        return row;
    }

    public async Task<(int NightsAdded, int NightsPurged)> ExtendHorizonAsync(int horizonDays)
    {
        var row = await _db.QuerySingleAsync("dbo.usp_Admin_Inventory_Extend",
            p => p.AddWithValue("@HorizonDays", horizonDays),
            rd => (NightsAdded: rd.GetInt("NightsAdded"), NightsPurged: rd.GetInt("NightsPurged")));

        return row;
    }

    public Task<int> ReserveAsync(int villaId, DateTime checkIn, DateTime checkOut, int units) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Inventory_Reserve", p =>
        {
            p.AddWithValue("@VillaId", villaId);
            p.AddWithValue("@CheckIn", checkIn.Date);
            p.AddWithValue("@CheckOut", checkOut.Date);
            p.AddWithValue("@Units", units);
        });

    public Task<int> ReleaseAsync(int villaId, DateTime checkIn, DateTime checkOut, int units) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Inventory_Release", p =>
        {
            p.AddWithValue("@VillaId", villaId);
            p.AddWithValue("@CheckIn", checkIn.Date);
            p.AddWithValue("@CheckOut", checkOut.Date);
            p.AddWithValue("@Units", units);
        });
}