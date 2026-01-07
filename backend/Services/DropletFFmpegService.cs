using Microsoft.Extensions.Options;
using System.Text.Json;
using backend.Helpers;
using backend.Interface;

namespace backend.Services;

public class DropletFFmpegService : IDropletFFmpegService
{
    private readonly DropletSettings _settings;
    private readonly ILogger<DropletFFmpegService> _logger;
    private readonly HttpClient _httpClient;

    public DropletFFmpegService(
        IOptions<DropletSettings> settings,
        ILogger<DropletFFmpegService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _settings = settings.Value;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
        _httpClient.Timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds);
    }

    public async Task<(string masterUrl, string cdnUrl)> ConvertToHLSAsync(string videoFilePath, string spacePath)
    {
        try
        {
            _logger.LogInformation($"Starting Droplet FFmpeg conversion for {videoFilePath}");

            if (!File.Exists(videoFilePath))
            {
                throw new FileNotFoundException($"Video file not found: {videoFilePath}");
            }

            var fileInfo = new FileInfo(videoFilePath);
            _logger.LogInformation($"Video file size: {fileInfo.Length} bytes");

            // Create multipart form data
            using var formData = new MultipartFormDataContent();
            
            // Add blob_path parameter
            formData.Add(new StringContent(spacePath), "blob_path");

            // Add video file
            var fileStream = File.OpenRead(videoFilePath);
            var fileContent = new StreamContent(fileStream);
            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("video/mp4");
            formData.Add(fileContent, "video", Path.GetFileName(videoFilePath));

            // Send request to Droplet API
            var url = $"{_settings.ApiUrl}/convert";
            _logger.LogInformation($"Posting to Droplet API: {url}");

            var response = await _httpClient.PostAsync(url, formData);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Droplet response status: {response.StatusCode}");
            _logger.LogInformation($"Droplet response: {responseContent}");

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Droplet API error: {response.StatusCode} - {responseContent}");
            }

            // Parse response
            using var doc = JsonDocument.Parse(responseContent);
            var root = doc.RootElement;

            if (!root.TryGetProperty("success", out var successProp) || !successProp.GetBoolean())
            {
                var error = root.TryGetProperty("error", out var errProp) ? errProp.GetString() : "Unknown error";
                throw new Exception($"Droplet conversion failed: {error}");
            }

            var masterUrl = root.GetProperty("master_url").GetString();

            if (string.IsNullOrEmpty(masterUrl))
            {
                throw new Exception("Droplet did not return video URL");
            }

            _logger.LogInformation($"Droplet conversion completed. Master URL: {masterUrl}");
            return (masterUrl!, masterUrl!); // Return same URL for both
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Droplet FFmpeg conversion");
            throw;
        }
    }

    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            var url = $"{_settings.ApiUrl}/health";
            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning($"Droplet health check failed: {response.StatusCode}");
                return false;
            }

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            var status = root.GetProperty("status").GetString();
            return status == "ok";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Droplet health check error");
            return false;
        }
    }
}
