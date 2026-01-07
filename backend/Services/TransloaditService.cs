using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using backend.Helpers;
using backend.Interface;

namespace backend.Services;

public class TransloaditService : ITransloaditService
{
    private readonly TransloaditSettings _settings;
    private readonly ILogger<TransloaditService> _logger;
    private readonly HttpClient _httpClient;

    public TransloaditService(
        IOptions<TransloaditSettings> settings,
        ILogger<TransloaditService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _settings = settings.Value;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
        _httpClient.Timeout = TimeSpan.FromMinutes(60); // Long timeout for large uploads
    }

    public async Task<string> CreateAssemblyAsync(string videoFilePath, string animeName, int episodeNumber)
    {
        try
        {
            _logger.LogInformation($"Creating Transloadit assembly for {animeName} episode {episodeNumber}");

            if (!File.Exists(videoFilePath))
            {
                throw new FileNotFoundException($"Video file not found: {videoFilePath}");
            }

            // Prepare the assembly parameters
            var expiresTimestamp = GetExpiryTimestamp();
            var paramsJson = new
            {
                auth = new
                {
                    key = _settings.AuthKey,
                    expires = expiresTimestamp
                },
                template_id = _settings.TemplateId,
                fields = new
                {
                    animeName = animeName,
                    episodeNumber = episodeNumber.ToString()
                }
            };

            var paramsString = JsonSerializer.Serialize(paramsJson, new JsonSerializerOptions
            {
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });
            var signature = GenerateSignature(paramsString);

            _logger.LogInformation($"Transloadit params: {paramsString}");
            _logger.LogInformation($"Transloadit expires timestamp: {expiresTimestamp}");
            _logger.LogInformation($"Transloadit signature: {signature}");

            // Create multipart form data
            using var formData = new MultipartFormDataContent();
            formData.Add(new StringContent(paramsString), "params");
            formData.Add(new StringContent(signature), "signature");

            // Add video file
            var fileStream = File.OpenRead(videoFilePath);
            var fileContent = new StreamContent(fileStream);
            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("video/mp4");
            formData.Add(fileContent, "file", Path.GetFileName(videoFilePath));

            // Send request to Transloadit
            var url = $"{_settings.ApiUrl}/assemblies";
            _logger.LogInformation($"Posting to Transloadit: {url}");

            var response = await _httpClient.PostAsync(url, formData);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Transloadit response status: {response.StatusCode}");
            _logger.LogInformation($"Transloadit response: {responseContent}");

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Transloadit API error: {response.StatusCode} - {responseContent}");
            }

            // Parse response
            using var doc = JsonDocument.Parse(responseContent);
            var root = doc.RootElement;

            if (!root.TryGetProperty("ok", out var okProp) || okProp.GetString() != "ASSEMBLY_EXECUTING")
            {
                var error = root.TryGetProperty("error", out var errProp) ? errProp.GetString() : "Unknown error";
                throw new Exception($"Transloadit assembly creation failed: {error}");
            }

            var assemblyId = root.GetProperty("assembly_id").GetString();
            if (string.IsNullOrEmpty(assemblyId))
            {
                throw new Exception("Transloadit did not return assembly_id");
            }

            _logger.LogInformation($"Transloadit assembly created: {assemblyId}");
            return assemblyId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Transloadit assembly");
            throw;
        }
    }

    public async Task<(bool isCompleted, string? videoUrl, string? thumbnailUrl, string? errorMessage)> GetAssemblyStatusAsync(string assemblyId)
    {
        try
        {
            var url = $"{_settings.ApiUrl}/assemblies/{assemblyId}";
            
            // Add auth parameters
            var paramsJson = JsonSerializer.Serialize(new
            {
                auth = new
                {
                    key = _settings.AuthKey,
                    expires = GetExpiryTimestamp()
                }
            }, new JsonSerializerOptions
            {
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });
            var signature = GenerateSignature(paramsJson);

            var requestUrl = $"{url}?signature={signature}&params={Uri.EscapeDataString(paramsJson)}";
            
            var response = await _httpClient.GetAsync(requestUrl);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning($"Error checking assembly status: {response.StatusCode} - {responseContent}");
                return (false, null, null, $"API error: {response.StatusCode}");
            }

            using var doc = JsonDocument.Parse(responseContent);
            var root = doc.RootElement;

            var ok = root.GetProperty("ok").GetString();

            // Check for errors
            if (ok == "ASSEMBLY_CANCELED" || ok == "REQUEST_ABORTED")
            {
                var error = root.TryGetProperty("error", out var errProp) ? errProp.GetString() : ok;
                return (true, null, null, error);
            }

            // Still processing
            if (ok != "ASSEMBLY_COMPLETED")
            {
                return (false, null, null, null);
            }

            // Assembly completed - extract video and thumbnail URLs
            string? videoUrl = null;
            string? thumbnailUrl = null;

            if (root.TryGetProperty("results", out var results))
            {
                // Get video URL from converted_video step
                if (results.TryGetProperty("converted_video", out var convertedVideos) && convertedVideos.GetArrayLength() > 0)
                {
                    var firstVideo = convertedVideos[0];
                    if (firstVideo.TryGetProperty("ssl_url", out var sslUrl))
                    {
                        videoUrl = sslUrl.GetString();
                    }
                }

                // Get thumbnail URL from thumbnail step
                if (results.TryGetProperty("thumbnail", out var thumbnails) && thumbnails.GetArrayLength() > 0)
                {
                    var firstThumb = thumbnails[0];
                    if (firstThumb.TryGetProperty("ssl_url", out var thumbSslUrl))
                    {
                        thumbnailUrl = thumbSslUrl.GetString();
                    }
                }
            }

            if (string.IsNullOrEmpty(videoUrl))
            {
                return (true, null, null, "Video URL not found in completed assembly");
            }

            return (true, videoUrl, thumbnailUrl, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting assembly status for {assemblyId}");
            return (false, null, null, ex.Message);
        }
    }

    public async Task<(string videoUrl, string thumbnailUrl)> WaitForAssemblyCompletionAsync(
        string assemblyId,
        int maxWaitSeconds = 3600,
        int pollIntervalSeconds = 10)
    {
        _logger.LogInformation($"Waiting for Transloadit assembly {assemblyId} to complete (max {maxWaitSeconds}s)");

        var startTime = DateTime.UtcNow;
        var maxWaitTime = TimeSpan.FromSeconds(maxWaitSeconds);

        while (DateTime.UtcNow - startTime < maxWaitTime)
        {
            var (isCompleted, videoUrl, thumbnailUrl, errorMessage) = await GetAssemblyStatusAsync(assemblyId);

            if (isCompleted)
            {
                if (!string.IsNullOrEmpty(errorMessage))
                {
                    throw new Exception($"Transloadit assembly failed: {errorMessage}");
                }

                if (string.IsNullOrEmpty(videoUrl))
                {
                    throw new Exception("Transloadit completed but no video URL returned");
                }

                _logger.LogInformation($"Transloadit assembly completed. Video: {videoUrl}, Thumbnail: {thumbnailUrl}");
                return (videoUrl, thumbnailUrl ?? string.Empty);
            }

            // Wait before polling again
            await Task.Delay(TimeSpan.FromSeconds(pollIntervalSeconds));
        }

        throw new TimeoutException($"Transloadit assembly {assemblyId} did not complete within {maxWaitSeconds} seconds");
    }

    private string GetExpiryTimestamp()
    {
        // Transloadit expects expires as UTC date string in format: "2026/01/07 12:00:00+00:00"
        var expiry = DateTime.UtcNow.AddHours(1);
        return expiry.ToString("yyyy/MM/dd HH:mm:ss+00:00");
    }

    private string GenerateSignature(string paramsString)
    {
        // Generate HMAC-SHA1 signature (Transloadit default)
        var encoding = new UTF8Encoding();
        var keyBytes = encoding.GetBytes(_settings.AuthSecret);
        var messageBytes = encoding.GetBytes(paramsString);

        using var hmac = new HMACSHA1(keyBytes);
        var hashBytes = hmac.ComputeHash(messageBytes);
        
        // Convert to hex string
        var signature = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        return signature;
    }
}
