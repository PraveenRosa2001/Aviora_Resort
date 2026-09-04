using AvioraResort.Data;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public class ReviewRepository : IReviewRepository
{
    private readonly SqlHelper _db;

    public ReviewRepository(SqlHelper db) => _db = db;

    public Task<List<VillaReview>> GetByVillaAsync(string villaCode, int? currentUserId) =>
        _db.QueryListAsync("dbo.usp_Review_GetByVilla", p =>
        {
            p.AddWithValue("@VillaCode", villaCode);
            p.AddWithValue("@CurrentUserId", (object?)currentUserId ?? DBNull.Value);
        },
        rd => new VillaReview
        {
            ReviewCode = rd.GetStringValue("ReviewCode"),
            VillaCode = rd.GetStringValue("VillaCode"),
            VillaName = rd.GetStringValue("VillaName"),
            GuestName = rd.GetStringValue("GuestName"),
            GuestOrigin = rd.GetNullableString("GuestOrigin"),
            Rating = rd.GetByte("Rating"),
            Headline = rd.GetNullableString("Headline"),
            Comment = rd.GetStringValue("Comment"),
            StayDate = rd.GetNullableString("StayDate"),
            HelpfulCount = rd.GetInt("HelpfulCount"),
            IsVerified = rd.GetBool("IsVerified"),
            CreatedAt = rd.GetDate("CreatedAt"),
            HasVoted = rd.GetBool("HasVoted"),
            IsMine = rd.GetBool("IsMine")
        });

    public Task<int> CreateAsync(string reviewCode, string villaCode, int userId,
                                 string guestName, string? guestOrigin, int rating,
                                 string? headline, string comment, string stayDate) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Review_Create", p =>
        {
            p.AddWithValue("@ReviewCode", reviewCode);
            p.AddWithValue("@VillaCode", villaCode);
            p.AddWithValue("@UserId", userId);
            p.AddWithValue("@GuestName", guestName);
            p.AddWithValue("@GuestOrigin", (object?)guestOrigin ?? DBNull.Value);
            p.AddWithValue("@Rating", (byte)rating);
            p.AddWithValue("@Headline", (object?)headline ?? DBNull.Value);
            p.AddWithValue("@Comment", comment);
            p.AddWithValue("@StayDate", stayDate);
        });

    public async Task<(int Status, int HelpfulCount)> MarkHelpfulAsync(string reviewCode, int userId)
    {
        var row = await _db.QuerySingleAsync("dbo.usp_Review_MarkHelpful", p =>
        {
            p.AddWithValue("@ReviewCode", reviewCode);
            p.AddWithValue("@UserId", userId);
        },
        rd => (Status: rd.GetInt("Status"), HelpfulCount: rd.GetInt("HelpfulCount")));

        return row;
    }

    public Task<int> DeleteAsync(string reviewCode) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Review_Delete",
            p => p.AddWithValue("@ReviewCode", reviewCode));
}