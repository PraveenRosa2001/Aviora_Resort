using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// Public villa catalogue. Anonymous by design - a guest has to be able to
/// browse villas before creating an account. Writing to villas will live on
/// AdminController under [Authorize(Roles = "admin")].
/// </summary>
[ApiController]
[Route("api/villas")]
[AllowAnonymous]
[Produces("application/json")]
public class VillasController : ControllerBase
{
    private readonly IVillaService _villas;

    public VillasController(IVillaService villas) => _villas = villas;

    private IActionResult FromResult<T>(ServiceResult<T> result) =>
        result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    /// <summary>
    /// GET /api/villas
    /// ?category=canopy&amp;view=ocean&amp;maxPrice=3000&amp;adults=2&amp;children=0&amp;sortBy=price-asc&amp;featured=true
    /// Every parameter is optional. "all" is accepted and treated as no filter.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetVillas([FromQuery] VillaFilterDto filter)
        => FromResult(await _villas.GetVillasAsync(filter));

    /// <summary>
    /// GET /api/villas/canopy-villa-01
    /// Accepts either the villa code or the slug.
    /// </summary>
    [HttpGet("{villaCode}")]
    public async Task<IActionResult> GetVilla(string villaCode,
                                           [FromQuery] DateTime? checkIn,
                                           [FromQuery] DateTime? checkOut)
     => FromResult(await _villas.GetVillaAsync(villaCode, checkIn, checkOut));

    /// <summary>GET /api/villas/categories - filter chips with live counts.</summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
        => FromResult(await _villas.GetCategoriesAsync());

    /// <summary>GET /api/villas/amenities - amenity master list.</summary>
    [HttpGet("amenities")]
    public async Task<IActionResult> GetAmenities()
        => FromResult(await _villas.GetAmenitiesAsync());
}