using Microsoft.AspNetCore.Http;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;

namespace AvioraResort.Services;

public interface IMediaService
{
    Task<ServiceResult<MediaUploadResultDto>> UploadAsync(IFormFile? file, string folder);
    Task<ServiceResult<string>> DeleteAsync(string url);
}