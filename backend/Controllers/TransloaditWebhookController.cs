using backend.Interface;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace backend.Controllers;

/// <summary>
/// Webhook endpoint for Transloadit notifications
/// Transloadit will call this when assembly completes (optional - can use polling instead)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TransloaditWebhookController : ControllerBase
{
    private readonly ILogger<TransloaditWebhookController> _logger;
    private readonly IUnitOfWork _uow;

    public TransloaditWebhookController(
        ILogger<TransloaditWebhookController> logger,
        IUnitOfWork uow)
    {
        _logger = logger;
        _uow = uow;
    }

    /// <summary>
    /// Handle Transloadit webhook notification
    /// POST /api/transloaditwebhook/notify
    /// </summary>
    [HttpPost("notify")]
    public async Task<IActionResult> HandleWebhook()
    {
        try
        {
            // Read raw body
            using var reader = new StreamReader(Request.Body);
            var body = await reader.ReadToEndAsync();
            
            _logger.LogInformation($"Received Transloadit webhook: {body}");

            // Parse Transloadit payload
            // Format: transloadit=<json_payload>
            var formData = Request.Form;
            if (!formData.ContainsKey("transloadit"))
            {
                _logger.LogWarning("Webhook missing 'transloadit' parameter");
                return BadRequest("Missing transloadit parameter");
            }

            var jsonPayload = formData["transloadit"].ToString();
            using var doc = JsonDocument.Parse(jsonPayload);
            var root = doc.RootElement;

            var assemblyId = root.GetProperty("assembly_id").GetString();
            var ok = root.GetProperty("ok").GetString();

            _logger.LogInformation($"Assembly {assemblyId} status: {ok}");

            // Handle different statuses
            if (ok == "ASSEMBLY_COMPLETED")
            {
                // Extract video URL and other metadata
                string? videoUrl = null;
                string? thumbnailUrl = null;

                if (root.TryGetProperty("results", out var results))
                {
                    if (results.TryGetProperty("converted_video", out var videos) && videos.GetArrayLength() > 0)
                    {
                        videoUrl = videos[0].GetProperty("ssl_url").GetString();
                    }

                    if (results.TryGetProperty("thumbnail", out var thumbs) && thumbs.GetArrayLength() > 0)
                    {
                        thumbnailUrl = thumbs[0].GetProperty("ssl_url").GetString();
                    }
                }

                _logger.LogInformation($"Assembly completed. Video: {videoUrl}, Thumbnail: {thumbnailUrl}");

                // TODO: You can store this info in database or cache
                // For example, update an UploadJob table with the video URL
                // This is optional since we're using polling in the main flow
            }
            else if (ok == "ASSEMBLY_CANCELED" || ok == "REQUEST_ABORTED")
            {
                var error = root.TryGetProperty("error", out var errProp) ? errProp.GetString() : ok;
                _logger.LogError($"Assembly {assemblyId} failed: {error}");
                
                // TODO: Send error notification to user
            }

            return Ok(new { message = "Webhook received" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Transloadit webhook");
            return StatusCode(500, new { message = "Internal error" });
        }
    }
}
