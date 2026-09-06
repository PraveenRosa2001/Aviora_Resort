using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// Gallery management, including the file upload.
///
/// [Authorize(Roles = "admin")] on the class. This is the only endpoint in the
/// project that writes files to the server, so it is also the only one where a
/// missing role check would let a stranger host arbitrary content on the
/// resort's own domain.
/// </summary>
[ApiController]
[Route("api/admin/gallery")]
[Authorize(Roles = "admin")]
[Produces("application/json")]
public class AdminGalleryController : ControllerBase
{
    private readonly IGalleryService _gallery;

    public AdminGalleryController(IGalleryService gallery) => _gallery = gallery;

    private int? CurrentUserId =>
        int.TryParse(User.FindFirstValue("uid"), out var id) ? id : null;

    private IActionResult FromResult<T>(ServiceResult<T> result) =>
        result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    private IActionResult FromMessage(ServiceResult<string> result) =>
        result.Success
            ? Ok(new { message = result.Data })
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    private string FirstValidationError() =>
        ModelState.Values.SelectMany(v => v.Errors)
                         .Select(e => e.ErrorMessage)
                         .FirstOrDefault() ?? "Invalid request.";

    /// <summary>GET /api/admin/gallery — every photograph, including hidden ones.</summary>
    [HttpGet]
    public async Task<IActionResult> GetImages()
        => FromResult(await _gallery.GetImagesForAdminAsync());

    /// <summary>
    /// POST /api/admin/gallery/upload — multipart form, field name "file".
    ///
    /// Returns the public URL and the stored file name. Nothing is written to
    /// the database here; the caller passes both back to POST /api/admin/gallery
    /// with the title and caption. Two steps, so a failed save leaves an
    /// orphaned file rather than a broken row.
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(8 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile? file)
        => FromResult(await _gallery.UploadAsync(file));

    /// <summary>POST /api/admin/gallery — create or update.</summary>
    [HttpPost]
    public async Task<IActionResult> Save([FromBody] SaveGalleryImageDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromMessage(await _gallery.SaveAsync(request, CurrentUserId));
    }

    /// <summary>DELETE /api/admin/gallery/{id} — removes the row and the file.</summary>
    [HttpDelete("{galleryImageId:int}")]
    public async Task<IActionResult> Delete(int galleryImageId)
        => FromMessage(await _gallery.DeleteAsync(galleryImageId));

    /// <summary>PUT /api/admin/gallery/order — ids in the order they should appear.</summary>
    [HttpPut("order")]
    public async Task<IActionResult> Reorder([FromBody] ReorderGalleryDto request)
        => FromMessage(await _gallery.ReorderAsync(request));
}