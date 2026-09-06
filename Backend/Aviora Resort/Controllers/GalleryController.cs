using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// The home page bento grid. Read-only and anonymous - every write is on
/// AdminGalleryController behind [Authorize(Roles = "admin")].
/// </summary>
[ApiController]
[Route("api/gallery")]
[AllowAnonymous]
[Produces("application/json")]
public class GalleryController : ControllerBase
{
    private readonly IGalleryService _gallery;

    public GalleryController(IGalleryService gallery) => _gallery = gallery;

    /// <summary>
    /// GET /api/gallery?homeOnly=true&amp;category=villas
    /// Defaults to the home grid. Pass homeOnly=false for the full gallery.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetImages([FromQuery] GalleryFilterDto filter)
    {
        var result = await _gallery.GetImagesAsync(filter);

        return result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }
}