namespace backend.Helpers;

public class TransloaditSettings
{
    public string AuthKey { get; set; } = string.Empty;
    public string AuthSecret { get; set; } = string.Empty;
    public string TemplateId { get; set; } = string.Empty;
    public string ApiUrl { get; set; } = "https://api2.transloadit.com";
}
