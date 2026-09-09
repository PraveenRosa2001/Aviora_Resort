using System.ComponentModel.DataAnnotations;

namespace AvioraResort.Models.DTOs;

public class MediaUploadResultDto
{
    /// <summary>Root-relative path. Resolve against the API origin on the client.</summary>
    public string Url { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string Folder { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
}

public class DeleteMediaDto
{
    /// <summary>The path returned by the upload, e.g. /uploads/villas/abc.jpg</summary>
    [Required, MaxLength(400)]
    public string Url { get; set; } = string.Empty;
}