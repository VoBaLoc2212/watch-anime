namespace backend.Interface;

public interface ITransloaditService
{
    /// <summary>
    /// Upload video to Transloadit for encoding to HLS
    /// </summary>
    /// <param name="videoFilePath">Path to the assembled video file</param>
    /// <param name="animeName">Anime name for storage path</param>
    /// <param name="episodeNumber">Episode number for storage path</param>
    /// <returns>Assembly ID to track encoding status</returns>
    Task<string> CreateAssemblyAsync(string videoFilePath, string animeName, int episodeNumber);

    /// <summary>
    /// Get assembly status and video URL when completed
    /// </summary>
    /// <param name="assemblyId">Assembly ID from CreateAssemblyAsync</param>
    /// <returns>Tuple of (isCompleted, videoUrl, thumbnailUrl, errorMessage)</returns>
    Task<(bool isCompleted, string? videoUrl, string? thumbnailUrl, string? errorMessage)> GetAssemblyStatusAsync(string assemblyId);

    /// <summary>
    /// Wait for assembly to complete with polling
    /// </summary>
    /// <param name="assemblyId">Assembly ID to wait for</param>
    /// <param name="maxWaitSeconds">Maximum wait time in seconds (default 3600 = 1 hour)</param>
    /// <param name="pollIntervalSeconds">Polling interval in seconds (default 10)</param>
    /// <returns>Tuple of (videoUrl, thumbnailUrl)</returns>
    Task<(string videoUrl, string thumbnailUrl)> WaitForAssemblyCompletionAsync(
        string assemblyId, 
        int maxWaitSeconds = 3600, 
        int pollIntervalSeconds = 10);
}
