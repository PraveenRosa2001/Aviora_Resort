//using System.Data;
//using Microsoft.Data.SqlClient;

//namespace AvioraResort.Data;

///// <summary>
///// The only class in the whole project that opens a SqlConnection.
///// Every call runs a stored procedure. Registered as a singleton in Program.cs.
///// </summary>
//public class SqlHelper
//{
//    private readonly string _connectionString;

//    public SqlHelper(string connectionString) => _connectionString = connectionString;

//    private static SqlCommand BuildCommand(SqlConnection cn, string procedure,
//                                           Action<SqlParameterCollection>? parameters)
//    {
//        var cmd = new SqlCommand(procedure, cn) { CommandType = CommandType.StoredProcedure };
//        parameters?.Invoke(cmd.Parameters);
//        return cmd;
//    }

//    /// <summary>Returns the first row, or default(T) when nothing is found.</summary>
//    public async Task<T?> QuerySingleAsync<T>(string procedure,
//                                              Action<SqlParameterCollection>? parameters,
//                                              Func<SqlDataReader, T> map)
//    {
//        await using var cn = new SqlConnection(_connectionString);
//        await using var cmd = BuildCommand(cn, procedure, parameters);
//        await cn.OpenAsync();
//        await using var rd = await cmd.ExecuteReaderAsync(CommandBehavior.SingleRow);
//        return await rd.ReadAsync() ? map(rd) : default;
//    }

//    /// <summary>Returns every row of the first result set.</summary>
//    public async Task<List<T>> QueryListAsync<T>(string procedure,
//                                                 Action<SqlParameterCollection>? parameters,
//                                                 Func<SqlDataReader, T> map)
//    {
//        var list = new List<T>();
//        await using var cn = new SqlConnection(_connectionString);
//        await using var cmd = BuildCommand(cn, procedure, parameters);
//        await cn.OpenAsync();
//        await using var rd = await cmd.ExecuteReaderAsync();
//        while (await rd.ReadAsync()) list.Add(map(rd));
//        return list;
//    }

//    /// <summary>For procedures that SELECT one scalar value.</summary>
//    public async Task<T?> ExecuteScalarAsync<T>(string procedure,
//                                                Action<SqlParameterCollection>? parameters)
//    {
//        await using var cn = new SqlConnection(_connectionString);
//        await using var cmd = BuildCommand(cn, procedure, parameters);
//        await cn.OpenAsync();
//        var result = await cmd.ExecuteScalarAsync();
//        return result is null or DBNull
//            ? default
//            : (T)Convert.ChangeType(result, typeof(T));
//    }

//    public async Task<int> ExecuteNonQueryAsync(string procedure,
//                                                Action<SqlParameterCollection>? parameters)
//    {
//        await using var cn = new SqlConnection(_connectionString);
//        await using var cmd = BuildCommand(cn, procedure, parameters);
//        await cn.OpenAsync();
//        return await cmd.ExecuteNonQueryAsync();
//    }
//}

using System.Data;
using Microsoft.Data.SqlClient;

namespace AvioraResort.Data;

/// <summary>
/// The only class in the project that opens a SqlConnection.
/// Every call runs a stored procedure. Registered as a singleton in Program.cs.
/// </summary>
public class SqlHelper
{
    private readonly string _connectionString;

    public SqlHelper(string connectionString) => _connectionString = connectionString;

    private static SqlCommand BuildCommand(SqlConnection cn, string procedure,
                                           Action<SqlParameterCollection>? parameters)
    {
        var cmd = new SqlCommand(procedure, cn) { CommandType = CommandType.StoredProcedure };
        parameters?.Invoke(cmd.Parameters);
        return cmd;
    }

    /// <summary>Returns the first row, or default(T) when nothing is found.</summary>
    public async Task<T?> QuerySingleAsync<T>(string procedure,
                                              Action<SqlParameterCollection>? parameters,
                                              Func<SqlDataReader, T> map)
    {
        await using var cn = new SqlConnection(_connectionString);
        await using var cmd = BuildCommand(cn, procedure, parameters);
        await cn.OpenAsync();
        await using var rd = await cmd.ExecuteReaderAsync(CommandBehavior.SingleRow);
        return await rd.ReadAsync() ? map(rd) : default;
    }

    /// <summary>Returns every row of the first result set.</summary>
    public async Task<List<T>> QueryListAsync<T>(string procedure,
                                                 Action<SqlParameterCollection>? parameters,
                                                 Func<SqlDataReader, T> map)
    {
        var list = new List<T>();
        await using var cn = new SqlConnection(_connectionString);
        await using var cmd = BuildCommand(cn, procedure, parameters);
        await cn.OpenAsync();
        await using var rd = await cmd.ExecuteReaderAsync();
        while (await rd.ReadAsync()) list.Add(map(rd));
        return list;
    }

    /// <summary>
    /// ADDED FOR THE VILLAS MODULE.
    ///
    /// Hands the open reader to the caller so a procedure returning several
    /// result sets can be consumed in one round trip. The caller walks them
    /// with NextResultAsync. Used by usp_Villa_GetAll, which returns villas,
    /// then their images, then their amenities.
    ///
    /// Without this, loading six villas with images and amenities would cost
    /// thirteen round trips instead of one.
    /// </summary>
    public async Task<T> QueryMultipleAsync<T>(string procedure,
                                               Action<SqlParameterCollection>? parameters,
                                               Func<SqlDataReader, Task<T>> map)
    {
        await using var cn = new SqlConnection(_connectionString);
        await using var cmd = BuildCommand(cn, procedure, parameters);
        await cn.OpenAsync();
        await using var rd = await cmd.ExecuteReaderAsync();
        return await map(rd);
    }

    /// <summary>For procedures that SELECT one scalar value.</summary>
    public async Task<T?> ExecuteScalarAsync<T>(string procedure,
                                                Action<SqlParameterCollection>? parameters)
    {
        await using var cn = new SqlConnection(_connectionString);
        await using var cmd = BuildCommand(cn, procedure, parameters);
        await cn.OpenAsync();
        var result = await cmd.ExecuteScalarAsync();
        return result is null or DBNull
            ? default
            : (T)Convert.ChangeType(result, typeof(T));
    }

    public async Task<int> ExecuteNonQueryAsync(string procedure,
                                                Action<SqlParameterCollection>? parameters)
    {
        await using var cn = new SqlConnection(_connectionString);
        await using var cmd = BuildCommand(cn, procedure, parameters);
        await cn.OpenAsync();
        return await cmd.ExecuteNonQueryAsync();
    }
}