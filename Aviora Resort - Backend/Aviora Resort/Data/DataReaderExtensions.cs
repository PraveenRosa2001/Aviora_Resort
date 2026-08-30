//using Microsoft.Data.SqlClient;

//namespace AvioraResort.Data;

///// <summary>Null-safe column readers so repository mapping code stays short.</summary>
//public static class DataReaderExtensions
//{
//    public static string GetStringValue(this SqlDataReader rd, string column)
//        => rd.IsDBNull(rd.GetOrdinal(column)) ? string.Empty : rd.GetString(rd.GetOrdinal(column));

//    public static string? GetNullableString(this SqlDataReader rd, string column)
//        => rd.IsDBNull(rd.GetOrdinal(column)) ? null : rd.GetString(rd.GetOrdinal(column));

//    public static int GetInt(this SqlDataReader rd, string column)
//        => rd.GetInt32(rd.GetOrdinal(column));

//    public static int? GetNullableInt(this SqlDataReader rd, string column)
//        => rd.IsDBNull(rd.GetOrdinal(column)) ? null : rd.GetInt32(rd.GetOrdinal(column));

//    public static decimal GetDecimal(this SqlDataReader rd, string column)
//        => rd.GetDecimal(rd.GetOrdinal(column));

//    public static bool GetBool(this SqlDataReader rd, string column)
//        => !rd.IsDBNull(rd.GetOrdinal(column)) && rd.GetBoolean(rd.GetOrdinal(column));

//    public static DateTime GetDate(this SqlDataReader rd, string column)
//        => rd.GetDateTime(rd.GetOrdinal(column));

//    public static DateTime? GetNullableDate(this SqlDataReader rd, string column)
//        => rd.IsDBNull(rd.GetOrdinal(column)) ? null : rd.GetDateTime(rd.GetOrdinal(column));
//}

using Microsoft.Data.SqlClient;

namespace AvioraResort.Data;

/// <summary>Null-safe column readers so repository mapping code stays short.</summary>
public static class DataReaderExtensions
{
    public static string GetStringValue(this SqlDataReader rd, string column)
        => rd.IsDBNull(rd.GetOrdinal(column)) ? string.Empty : rd.GetString(rd.GetOrdinal(column));

    public static string? GetNullableString(this SqlDataReader rd, string column)
        => rd.IsDBNull(rd.GetOrdinal(column)) ? null : rd.GetString(rd.GetOrdinal(column));

    public static int GetInt(this SqlDataReader rd, string column)
        => rd.GetInt32(rd.GetOrdinal(column));

    public static int? GetNullableInt(this SqlDataReader rd, string column)
        => rd.IsDBNull(rd.GetOrdinal(column)) ? null : rd.GetInt32(rd.GetOrdinal(column));

    public static decimal GetDecimal(this SqlDataReader rd, string column)
        => rd.GetDecimal(rd.GetOrdinal(column));

    // ADDED FOR THE VILLAS MODULE - dbo.Villas.Rating is nullable
    public static decimal? GetNullableDecimal(this SqlDataReader rd, string column)
        => rd.IsDBNull(rd.GetOrdinal(column)) ? null : rd.GetDecimal(rd.GetOrdinal(column));

    public static bool GetBool(this SqlDataReader rd, string column)
        => !rd.IsDBNull(rd.GetOrdinal(column)) && rd.GetBoolean(rd.GetOrdinal(column));

    public static DateTime GetDate(this SqlDataReader rd, string column)
        => rd.GetDateTime(rd.GetOrdinal(column));

    public static DateTime? GetNullableDate(this SqlDataReader rd, string column)
        => rd.IsDBNull(rd.GetOrdinal(column)) ? null : rd.GetDateTime(rd.GetOrdinal(column));

    // ADDED FOR THE REVIEWS MODULE - dbo.VillaReviews.Rating is TINYINT
    public static byte GetByte(this SqlDataReader rd, string column)
        => rd.IsDBNull(rd.GetOrdinal(column)) ? (byte)0 : rd.GetByte(rd.GetOrdinal(column));

    // ADDED FOR THE ADMIN VILLA MODULE - MapVilla is shared by the public and
    // admin procedures, and the admin one selects three extra columns.
    public static bool HasColumn(this SqlDataReader rd, string column)
    {
        for (var i = 0; i < rd.FieldCount; i++)
        {
            if (string.Equals(rd.GetName(i), column, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }
}