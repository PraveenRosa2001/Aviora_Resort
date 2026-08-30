namespace AvioraResort.Models.Common;

/// <summary>
/// Return type for every service method. Lets the business layer report a
/// failure with an HTTP status code without referencing ASP.NET Core types.
/// </summary>
public class ServiceResult<T>
{
    public bool Success { get; private set; }
    public T? Data { get; private set; }
    public string Error { get; private set; } = string.Empty;
    public int StatusCode { get; private set; } = 200;

    public static ServiceResult<T> Ok(T data) =>
        new() { Success = true, Data = data, StatusCode = 200 };

    public static ServiceResult<T> Fail(string error, int statusCode = 400) =>
        new() { Success = false, Error = error, StatusCode = statusCode };
}