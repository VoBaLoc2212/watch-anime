namespace backend.Interface
{
    public interface IHLSConversionService
    {
        Task<string> ConvertToHLSAsync(
            string inputVideoPath, 
            string outputDirectory,
            Action<int>? progressCallback = null
        );
        Task<string> UploadHLSToAzureBlobAsync(string hlsDirectory, string blobPath);
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
