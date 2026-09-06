using AvioraResort.Data;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public class GalleryRepository : IGalleryRepository
{
    private readonly SqlHelper _db;

    public GalleryRepository(SqlHelper db) => _db = db;

    public Task<List<GalleryImage>> GetImagesAsync(bool homeOnly, string? category, bool includeInactive) =>
        _db.QueryListAsync("dbo.usp_Gallery_GetImages", p =>
        {
            p.AddWithValue("@HomeOnly", homeOnly);
            p.AddWithValue("@Category", (object?)category ?? DBNull.Value);
            p.AddWithValue("@IncludeInactive", includeInactive);
        },
        rd => new GalleryImage
        {
            GalleryImageId = rd.GetInt("GalleryImageId"),
            ImageUrl = rd.GetStringValue("ImageUrl"),
            Title = rd.GetNullableString("Title"),
            Caption = rd.GetNullableString("Caption"),
            Category = rd.GetStringValue("Category"),
            DisplayOrder = rd.GetInt("DisplayOrder"),
            ShowOnHome = rd.GetBool("ShowOnHome"),
            StoredFileName = rd.GetNullableString("StoredFileName"),
            IsActive = rd.GetBool("IsActive"),
            CreatedAt = rd.GetDate("CreatedAt"),
            UpdatedAt = rd.GetNullableDate("UpdatedAt"),
            UploadedByName = rd.GetNullableString("UploadedByName")
        });

    public async Task<(int Status, int? Id)> SaveAsync(SaveGalleryImageDto r, int? uploadedBy)
    {
        var row = await _db.QuerySingleAsync("dbo.usp_Admin_Gallery_Save", p =>
        {
            p.AddWithValue("@GalleryImageId", (object?)r.Id ?? DBNull.Value);
            p.AddWithValue("@ImageUrl", r.Url);
            p.AddWithValue("@Title", (object?)r.Title ?? DBNull.Value);
            p.AddWithValue("@Caption", (object?)r.Caption ?? DBNull.Value);
            p.AddWithValue("@Category", r.Category);
            p.AddWithValue("@DisplayOrder", (object?)r.DisplayOrder ?? DBNull.Value);
            p.AddWithValue("@ShowOnHome", r.ShowOnHome);
            p.AddWithValue("@IsActive", r.IsActive);
            p.AddWithValue("@UploadedBy", (object?)uploadedBy ?? DBNull.Value);
            p.AddWithValue("@StoredFileName", (object?)r.StoredFileName ?? DBNull.Value);
        },
        rd => (Status: rd.GetInt("Status"), Id: rd.GetNullableInt("GalleryImageId")));

        return row;
    }

    public async Task<(int Status, string? StoredFileName)> DeleteAsync(int galleryImageId)
    {
        var row = await _db.QuerySingleAsync("dbo.usp_Admin_Gallery_Delete",
            p => p.AddWithValue("@GalleryImageId", galleryImageId),
            rd => (Status: rd.GetInt("Status"), StoredFileName: rd.GetNullableString("StoredFileName")));

        return row;
    }

    public Task<int> ReorderAsync(IEnumerable<int> orderedIds) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Gallery_Reorder",
            p => p.AddWithValue("@OrderedIds", string.Join(',', orderedIds)));
}