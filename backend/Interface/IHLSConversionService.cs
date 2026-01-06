namespace backend.Interface
{
    /// <summary>
    /// Service for converting video to HLS adaptive streaming format
    /// Uses FFmpeg to create multiple quality variants (360p, 720p, 1080p)
    /// </summary>
    public interface IHLSConversionService
    {
        /// <summary>
        /// Convert uploaded video to HLS format with multiple bitrates
        /// </summary>
        /// <param name="inputVideoPath">Path to the source video file</param>
        /// <param name="outputDirectory">Directory to save HLS output files</param>
        /// <param name="progressCallback">Optional callback for progress updates (0-100)</param>
        /// <returns>Path to master.m3u8 file</returns>
        Task<string> ConvertToHLSAsync(
            string inputVideoPath, 
            string outputDirectory,
            Action<int>? progressCallback = null
        );

        /// <summary>
        /// Upload all HLS files (master.m3u8, variant playlists, .ts segments) to Azure Blob
        /// </summary>
        /// <param name="hlsDirectory">Local directory containing HLS files</param>
        /// <param name="blobPath">Azure blob path prefix (e.g., anime/naruto/ep1)</param>
        /// <returns>Public URL to master.m3u8</returns>
        Task<string> UploadHLSToAzureBlobAsync(string hlsDirectory, string blobPath);

        /// <summary>
        /// Get video metadata (duration, resolution, codec) using FFprobe
        /// </summary>
        Task<VideoMetadata> GetVideoMetadataAsync(string videoPath);
    }

    public class VideoMetadata
    {
        public TimeSpan Duration { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public string VideoCodec { get; set; }
        public string AudioCodec { get; set; }
        public long Bitrate { get; set; }
        public double FrameRate { get; set; }
    }
}
