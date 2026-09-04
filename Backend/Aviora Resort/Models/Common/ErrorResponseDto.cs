namespace AvioraResort.Models.Common;

/// <summary>
/// Standard error body. The property must stay named "message" because
/// services/apiClient.js reads error.response.data.message.
/// </summary>
public class ErrorResponseDto
{
    public string Message { get; set; } = string.Empty;

    public ErrorResponseDto() { }
    public ErrorResponseDto(string message) => Message = message;
}