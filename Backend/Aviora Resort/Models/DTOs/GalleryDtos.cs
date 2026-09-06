using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace AvioraResort.Models.DTOs;

public class GalleryImageDto
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Caption { get; set; }
    public string Category { get; set; } = "resort";
    public int DisplayOrder { get; set; }
    public bool ShowOnHome { get; set; }
    public bool IsActive { get; set; }
    public string? UploadedBy { get; set; }
    public string? CreatedAt { get; set; }
}

public class GalleryFilterDto
{
    [FromQuery(Name = "homeOnly")] public bool HomeOnly { get; set; } = true;
    [FromQuery(Name = "category")] public string? Category { get; set; }
}

public class SaveGalleryImageDto
{
    /// <summary>Null to create.</summary>
    public int? Id { get; set; }

    [Required(ErrorMessage = "An image is required"), MaxLength(400)]
    public string Url { get; set; } = string.Empty;

    [MaxLength(150)] public string? Title { get; set; }
    [MaxLength(400)] public string? Caption { get; set; }

    [MaxLength(30)] public string Category { get; set; } = "resort";

    public int? DisplayOrder { get; set; }
    public bool ShowOnHome { get; set; } = true;
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Returned by the upload endpoint. Carrying it through means deleting the
    /// row can also delete the file.
    /// </summary>
    [MaxLength(260)] public string? StoredFileName { get; set; }
}

public class ReorderGalleryDto
{
    /// <summary>Image ids in the order they should appear.</summary>
    public List<int> OrderedIds { get; set; } = new();
}

public class GalleryUploadResultDto
{
    public string Url { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
}