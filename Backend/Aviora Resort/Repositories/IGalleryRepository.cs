using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public interface IGalleryRepository
{
    Task<List<GalleryImage>> GetImagesAsync(bool homeOnly, string? category, bool includeInactive);

    /// <summary>Status: 1 saved, -1 not found on update, -2 unknown category.</summary>
    Task<(int Status, int? Id)> SaveAsync(SaveGalleryImageDto request, int? uploadedBy);

    /// <summary>Returns the stored file name so the API can remove the file too.</summary>
    Task<(int Status, string? StoredFileName)> DeleteAsync(int galleryImageId);

    Task<int> ReorderAsync(IEnumerable<int> orderedIds);
}