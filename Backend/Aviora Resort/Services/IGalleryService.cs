using Microsoft.AspNetCore.Http;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;

namespace AvioraResort.Services;

public interface IGalleryService
{
    Task<ServiceResult<List<GalleryImageDto>>> GetImagesAsync(GalleryFilterDto filter);
    Task<ServiceResult<List<GalleryImageDto>>> GetImagesForAdminAsync();

    Task<ServiceResult<GalleryUploadResultDto>> UploadAsync(IFormFile? file);
    Task<ServiceResult<string>> SaveAsync(SaveGalleryImageDto request, int? uploadedBy);
    Task<ServiceResult<string>> DeleteAsync(int galleryImageId);
    Task<ServiceResult<string>> ReorderAsync(ReorderGalleryDto request);
}