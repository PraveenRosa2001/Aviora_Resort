using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;

namespace AvioraResort.Services;

public interface IVillaService
{
    /* ---------- public catalogue ---------- */
    Task<ServiceResult<List<VillaDto>>> GetVillasAsync(VillaFilterDto filter);
    Task<ServiceResult<VillaDto>> GetVillaAsync(string villaCode,
                                              DateTime? checkIn = null,
                                              DateTime? checkOut = null);
    Task<ServiceResult<List<VillaCategoryDto>>> GetCategoriesAsync();
    Task<ServiceResult<List<AmenityDto>>> GetAmenitiesAsync();

    /* ---------- administrator ---------- */
    Task<ServiceResult<List<VillaAdminDto>>> GetVillasForAdminAsync(bool includeInactive);
    Task<ServiceResult<VillaDto>> CreateVillaAsync(SaveVillaRequestDto request);
    Task<ServiceResult<VillaDto>> UpdateVillaAsync(string villaCode, SaveVillaRequestDto request);
    Task<ServiceResult<string>> DeleteVillaAsync(string villaCode, bool force);
    Task<ServiceResult<string>> RestoreVillaAsync(string villaCode);
}