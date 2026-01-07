namespace backend.Interface;

public interface IDropletFFmpegService
{
    /// <summary>
    /// Convert video to HLS using DigitalOcean Droplet FFmpeg API
    /// </summary>
    /// <param name="videoFilePath">Local path to video file</param>
    /// <param name="spacePath">Path in DigitalOcean Spaces (e.g., "anime/naruto/ep1")</param>
    /// <returns>Tuple of (masterUrl, cdnUrl)</returns>
    Task<(string masterUrl, string cdnUrl)> ConvertToHLSAsync(string videoFilePath, string spacePath);

    /// <summary>
    /// Health check for Droplet API
    /// </summary>
    Task<bool> IsHealthyAsync();
}
