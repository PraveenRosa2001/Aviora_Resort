using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;

namespace AvioraResort.Services;

/// <summary>
/// Image uploads for anything an administrator manages - villa photographs,
/// dining venues, the home gallery.
///
/// The gallery module keeps its own copy of this logic because it writes a
/// database row in the same flow. This one is deliberately storage-only: it
/// takes a file, returns a path, and knows nothing about what will point at
/// it. That is what lets the villa editor use it for a hero image and for six
/// gallery slots without either needing an endpoint of its own.
/// </summary>
public class MediaService : IMediaService
{
    private readonly IWebHostEnvironment _env;

    public MediaService(IWebHostEnvironment env) => _env = env;

    private const long MaxBytes = 6 * 1024 * 1024;   // 6 MB

    /// <summary>
    /// An allow-list, never a path taken from the caller. A folder of "../../"
    /// would otherwise write anywhere the process can reach - appsettings.json
    /// included.
    /// </summary>
    private static readonly string[] AllowedFolders =
        { "villas", "dining", "gallery", "experiences" };

    /// <summary>
    /// Extensions are an allow-list too. A block-list has to anticipate every
    /// dangerous extension; an allow-list only has to name the safe ones.
    /// </summary>
    private static readonly string[] AllowedExtensions =
        { ".jpg", ".jpeg", ".png", ".webp", ".avif" };

    private static readonly string[] AllowedContentTypes =
        { "image/jpeg", "image/png", "image/webp", "image/avif" };

    private string WebRoot =>
        string.IsNullOrWhiteSpace(_env.WebRootPath)
            ? Path.Combine(_env.ContentRootPath, "wwwroot")
            : _env.WebRootPath;

    public async Task<ServiceResult<MediaUploadResultDto>> UploadAsync(IFormFile? file, string folder)
    {
        folder = (folder ?? string.Empty).Trim().ToLowerInvariant();

        if (!AllowedFolders.Contains(folder))
            return ServiceResult<MediaUploadResultDto>.Fail(
                $"Folder must be one of: {string.Join(", ", AllowedFolders)}.", 400);

        if (file is null || file.Length == 0)
            return ServiceResult<MediaUploadResultDto>.Fail("No file was received.", 400);

        if (file.Length > MaxBytes)
            return ServiceResult<MediaUploadResultDto>.Fail(
                $"Images must be under {MaxBytes / (1024 * 1024)} MB. " +
                "Resize the photograph and try again.", 400);

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!AllowedExtensions.Contains(extension))
            return ServiceResult<MediaUploadResultDto>.Fail(
                $"Only {string.Join(", ", AllowedExtensions)} images are accepted.", 400);

        if (!AllowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
            return ServiceResult<MediaUploadResultDto>.Fail(
                "That file does not appear to be an image.", 400);

        // The stored name is generated, never taken from the client. A
        // filename of "../../appsettings.json" would otherwise escape the
        // upload folder entirely.
        var storedName = $"{Guid.NewGuid():N}{extension}";
        var directory = Path.Combine(WebRoot, "uploads", folder);

        Directory.CreateDirectory(directory);

        await using (var stream = new FileStream(Path.Combine(directory, storedName), FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return ServiceResult<MediaUploadResultDto>.Ok(new MediaUploadResultDto
        {
            Url = $"/uploads/{folder}/{storedName}",
            StoredFileName = storedName,
            Folder = folder,
            SizeBytes = file.Length
        });
    }

    /// <summary>
    /// Removes an uploaded file. Only paths this service could have produced
    /// are accepted - anything else is refused rather than resolved, so a
    /// crafted url cannot reach outside the upload folders.
    /// </summary>
    public Task<ServiceResult<string>> DeleteAsync(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return Task.FromResult(ServiceResult<string>.Fail("No image was named.", 400));

        var segments = url.Trim().TrimStart('/').Split('/');

        // Expect exactly: uploads / <allowed folder> / <file>
        if (segments.Length != 3 ||
            !segments[0].Equals("uploads", StringComparison.OrdinalIgnoreCase) ||
            !AllowedFolders.Contains(segments[1].ToLowerInvariant()))
        {
            return Task.FromResult(ServiceResult<string>.Fail(
                "Only uploaded images can be removed. Paths under /assets ship with " +
                "the site and are not managed here.", 400));
        }

        // GetFileName strips any traversal that survived the shape check.
        var fileName = Path.GetFileName(segments[2]);

        if (string.IsNullOrWhiteSpace(fileName))
            return Task.FromResult(ServiceResult<string>.Fail("That path names no file.", 400));

        try
        {
            var fullPath = Path.Combine(WebRoot, "uploads", segments[1].ToLowerInvariant(), fileName);
            if (File.Exists(fullPath)) File.Delete(fullPath);
        }
        catch
        {
            // A locked file is not worth failing the request over - the caller
            // has already stopped pointing at it.
        }

        return Task.FromResult(ServiceResult<string>.Ok("Image removed."));
    }
}