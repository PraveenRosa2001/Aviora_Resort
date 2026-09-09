using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// Image uploads for the admin console - villa photographs, dining venues,
/// experiences.
///
/// [Authorize(Roles = "admin")] on the class. This writes files into the
/// server's own wwwroot, so a missing role check would let a stranger host
/// arbitrary content on the resort's domain.
/// </summary>
[ApiController]
[Route("api/admin/media")]
[Authorize(Roles = "admin")]
[Produces("application/json")]
public class AdminMediaController : ControllerBase
{
    private readonly IMediaService _media;

    public AdminMediaController(IMediaService media) => _media = media;

    private IActionResult FromResult<T>(ServiceResult<T> result) =>
        result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    /// <summary>
    /// POST /api/admin/media/upload?folder=villas
    /// Multipart, field name "file". Returns the root-relative path.
    ///
    /// Nothing is written to the database here. The caller decides what points
    /// at the file, so a failed save leaves an orphaned image rather than a
    /// row pointing at nothing.
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(8 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile? file, [FromQuery] string folder = "villas")
        => FromResult(await _media.UploadAsync(file, folder));

    /// <summary>
    /// DELETE /api/admin/media — body { "url": "/uploads/villas/abc.jpg" }
    /// Refuses anything that is not a path this service could have produced.
    /// </summary>
    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] DeleteMediaDto request)
    {
        var result = await _media.DeleteAsync(request.Url);

        return result.Success
            ? Ok(new { message = result.Data })
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }
}