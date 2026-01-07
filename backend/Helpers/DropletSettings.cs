namespace backend.Helpers;

public class DropletSettings
{
    public string ApiUrl { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 3600; // 1 hour for video conversion
}
