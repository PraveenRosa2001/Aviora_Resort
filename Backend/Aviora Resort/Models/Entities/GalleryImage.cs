namespace AvioraResort.Models.Entities;

public class GalleryImage
{
    public int GalleryImageId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Caption { get; set; }
    public string Category { get; set; } = "resort";
    public int DisplayOrder { get; set; }
    public bool ShowOnHome { get; set; } = true;

    /// <summary>
    /// Set when the file arrived through the upload endpoint rather than being
    /// typed in as a path. Deleting the row deletes the file.
    /// </summary>
    public string? StoredFileName { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UploadedByName { get; set; }
}