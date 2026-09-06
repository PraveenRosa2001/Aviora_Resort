using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;
using AvioraResort.Repositories;

namespace AvioraResort.Services;

/// <summary>
/// The home page bento grid, and the files behind it.
///
/// This is the one service in the project that writes to disk, so the upload
/// rules matter more than usual: an unchecked upload endpoint is how a site
/// ends up hosting someone else's malware.
/// </summary>
public class GalleryService : IGalleryService
{
    private readonly IGalleryRepository _gallery;
    private readonly IWebHostEnvironment _env;

    public GalleryService(IGalleryRepository gallery, IWebHostEnvironment env)
    {
        _gallery = gallery;
        _env = env;
    }

    private const string UploadFolder = "uploads/gallery";
    private const long MaxBytes = 6 * 1024 * 1024;   // 6 MB

    private static readonly string[] AllowedCategories =
        { "resort", "villas", "dining", "wellness", "experiences", "nature" };

    /// <summary>
    /// Extension allow-list, not a block-list. A block-list has to anticipate
    /// every dangerous extension; an allow-list only has to name the safe ones.
    /// </summary>
    private static readonly string[] AllowedExtensions =
        { ".jpg", ".jpeg", ".png", ".webp", ".avif" };

    private static readonly string[] AllowedContentTypes =
        { "image/jpeg", "image/png", "image/webp", "image/avif" };

    /* ================= read ================= */

    public async Task<ServiceResult<List<GalleryImageDto>>> GetImagesAsync(GalleryFilterDto filter)
    {
        var category = Normalise(filter.Category);

        if (category is not null && !AllowedCategories.Contains(category))
            return ServiceResult<List<GalleryImageDto>>.Fail(
                $"Category must be one of: {string.Join(", ", AllowedCategories)}.", 400);

        var images = await _gallery.GetImagesAsync(filter.HomeOnly, category, includeInactive: false);
        return ServiceResult<List<GalleryImageDto>>.Ok(images.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<List<GalleryImageDto>>> GetImagesForAdminAsync()
    {
        var images = await _gallery.GetImagesAsync(homeOnly: false, category: null, includeInactive: true);
        return ServiceResult<List<GalleryImageDto>>.Ok(images.Select(ToDto).ToList());
    }

    /* ================= upload ================= */

    public async Task<ServiceResult<GalleryUploadResultDto>> UploadAsync(IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return ServiceResult<GalleryUploadResultDto>.Fail("No file was received.", 400);

        if (file.Length > MaxBytes)
            return ServiceResult<GalleryUploadResultDto>.Fail(
                $"Images must be under {MaxBytes / (1024 * 1024)} MB. " +
                "Resize the photograph and try again.", 400);

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!AllowedExtensions.Contains(extension))
            return ServiceResult<GalleryUploadResultDto>.Fail(
                $"Only {string.Join(", ", AllowedExtensions)} images are accepted.", 400);

        if (!AllowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
            return ServiceResult<GalleryUploadResultDto>.Fail(
                "That file does not appear to be an image.", 400);

        // The stored name is generated, never taken from the client. A
        // filename like "../../appsettings.json" would otherwise escape the
        // upload folder entirely.
        var storedName = $"{Guid.NewGuid():N}{extension}";

        var root = string.IsNullOrWhiteSpace(_env.WebRootPath)
                            ? Path.Combine(_env.ContentRootPath, "wwwroot")
                            : _env.WebRootPath;
        var folder = Path.Combine(root, UploadFolder.Replace('/', Path.DirectorySeparatorChar));
        var fullPath = Path.Combine(folder, storedName);

        Directory.CreateDirectory(folder);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return ServiceResult<GalleryUploadResultDto>.Ok(new GalleryUploadResultDto
        {
            Url = $"/{UploadFolder}/{storedName}",
            StoredFileName = storedName,
            SizeBytes = file.Length
        });
    }

    /* ================= write ================= */

    public async Task<ServiceResult<string>> SaveAsync(SaveGalleryImageDto request, int? uploadedBy)
    {
        request.Category = (request.Category ?? "resort").Trim().ToLowerInvariant();
        request.Url = request.Url.Trim();

        if (!AllowedCategories.Contains(request.Category))
            return ServiceResult<string>.Fail(
                $"Category must be one of: {string.Join(", ", AllowedCategories)}.", 400);

        if (string.IsNullOrWhiteSpace(request.Url))
            return ServiceResult<string>.Fail("An image is required.", 400);

        var (status, _) = await _gallery.SaveAsync(request, uploadedBy);

        return status switch
        {
            1 => ServiceResult<string>.Ok(
                      request.Id is null ? "Photograph added to the gallery." : "Photograph updated."),
            -1 => ServiceResult<string>.Fail("That photograph no longer exists.", 404),
            -2 => ServiceResult<string>.Fail("Unknown category.", 400),
            _ => ServiceResult<string>.Fail("The photograph could not be saved.", 500)
        };
    }

    public async Task<ServiceResult<string>> DeleteAsync(int galleryImageId)
    {
        var (status, storedFileName) = await _gallery.DeleteAsync(galleryImageId);

        if (status != 1)
            return ServiceResult<string>.Fail("That photograph no longer exists.", 404);

        // Remove the file too. Nothing references a gallery image, so unlike a
        // villa there is no history to preserve - and orphaned uploads would
        // fill the server over time.
        if (!string.IsNullOrWhiteSpace(storedFileName))
        {
            try
            {
                var root = string.IsNullOrWhiteSpace(_env.WebRootPath)
                               ? Path.Combine(_env.ContentRootPath, "wwwroot")
                               : _env.WebRootPath;

                // Guard against a stored name that somehow contains a path.
                var safeName = Path.GetFileName(storedFileName);
                var fullPath = Path.Combine(
                    root, UploadFolder.Replace('/', Path.DirectorySeparatorChar), safeName);

                if (File.Exists(fullPath)) File.Delete(fullPath);
            }
            catch
            {
                // The row is already gone; a locked file is not worth failing
                // the request over.
            }
        }

        return ServiceResult<string>.Ok("Photograph removed from the gallery.");
    }

    public async Task<ServiceResult<string>> ReorderAsync(ReorderGalleryDto request)
    {
        var ids = request.OrderedIds.Distinct().ToList();

        if (ids.Count == 0)
            return ServiceResult<string>.Fail("No order was supplied.", 400);

        var rows = await _gallery.ReorderAsync(ids);

        return rows > 0
            ? ServiceResult<string>.Ok($"{rows} photograph(s) reordered.")
            : ServiceResult<string>.Fail("Nothing was reordered.", 404);
    }

    /* ================= helpers ================= */

    private static string? Normalise(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim().ToLowerInvariant();
        return trimmed == "all" ? null : trimmed;
    }

    private static GalleryImageDto ToDto(GalleryImage g) => new()
    {
        Id = g.GalleryImageId,
        Url = g.ImageUrl,
        Title = g.Title,
        Caption = g.Caption,
        Category = g.Category,
        DisplayOrder = g.DisplayOrder,
        ShowOnHome = g.ShowOnHome,
        IsActive = g.IsActive,
        UploadedBy = g.UploadedByName,
        CreatedAt = g.CreatedAt.ToString("yyyy-MM-dd")
    };
}