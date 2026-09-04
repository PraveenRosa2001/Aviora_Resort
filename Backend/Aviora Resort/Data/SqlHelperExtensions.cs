using System.Data;
using Microsoft.Data.SqlClient;

namespace AvioraResort.Data;

/// <summary>
/// Helpers for passing table-valued parameters through ADO.NET.
///
/// A TVP lets one stored procedure call carry a whole list. Saving a villa
/// sends its images and amenities as two sets in the same call, so the write
/// happens inside a single transaction instead of the API looping one INSERT
/// per row and half-failing.
///
/// AddWithValue cannot be used for a TVP: SqlDbType must be Structured and
/// TypeName must name the SQL type exactly, schema included.
/// </summary>
public static class SqlHelperExtensions
{
    public static SqlParameter AddStructured(this SqlParameterCollection parameters,
                                             string name, string typeName, DataTable table)
    {
        var parameter = parameters.Add(name, SqlDbType.Structured);
        parameter.TypeName = typeName;
        parameter.Value = table;
        return parameter;
    }

    /// <summary>Builds a dbo.VillaImageList table from a list of URLs.</summary>
    public static DataTable ToVillaImageTable(this IEnumerable<string>? imageUrls, string? altText = null)
    {
        var table = new DataTable();
        table.Columns.Add("ImageUrl", typeof(string));
        table.Columns.Add("AltText", typeof(string));
        table.Columns.Add("DisplayOrder", typeof(int));

        var order = 1;
        foreach (var url in (imageUrls ?? Enumerable.Empty<string>())
                            .Where(u => !string.IsNullOrWhiteSpace(u))
                            .Select(u => u.Trim())
                            .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            table.Rows.Add(url, (object?)altText ?? DBNull.Value, order++);
        }

        return table;
    }

    /// <summary>Builds a dbo.VillaAmenityList table from a list of names.</summary>
    public static DataTable ToVillaAmenityTable(this IEnumerable<string>? amenityNames)
    {
        var table = new DataTable();
        table.Columns.Add("AmenityName", typeof(string));
        table.Columns.Add("DisplayOrder", typeof(int));

        var order = 1;
        foreach (var name in (amenityNames ?? Enumerable.Empty<string>())
                             .Where(a => !string.IsNullOrWhiteSpace(a))
                             .Select(a => a.Trim())
                             .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            table.Rows.Add(name, order++);
        }

        return table;
    }
}