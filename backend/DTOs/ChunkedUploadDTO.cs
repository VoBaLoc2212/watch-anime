using System.Collections.Concurrent;

namespace backend.DTOs
{
    /// <summary>
    /// DTO for initiating chunked video upload
    /// </summary>
    public class InitiateChunkedUploadRequest
    {
        public string FileName { get; set; }
        public long TotalSize { get; set; }
        public int TotalChunks { get; set; }
        public string AnimeSlug { get; set; }
        public int EpisodeNumber { get; set; }
        public string EpisodeName { get; set; }
    }

    public class InitiateChunkedUploadResponse
    {
        public string UploadId { get; set; }
        public int ChunkSize { get; set; }
        public int TotalChunks { get; set; }
    }

    /// <summary>
    /// DTO for uploading individual chunk
    /// </summary>
    public class UploadChunkRequest
    {
        public string UploadId { get; set; }
        public int ChunkIndex { get; set; }
        public IFormFile ChunkData { get; set; }
    }

    public class UploadChunkResponse
    {
        public bool Success { get; set; }
        public int ChunkIndex { get; set; }
        public string Message { get; set; }
    }

    /// <summary>
    /// DTO for completing chunked upload and starting HLS conversion
    /// </summary>
    public class CompleteChunkedUploadRequest
    {
        public string UploadId { get; set; }
        public string Duration { get; set; } // Format: HH:mm:ss
    }

    public class CompleteChunkedUploadResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string HlsMasterUrl { get; set; }
        public string EpisodeId { get; set; }
    }

    /// <summary>
    /// Internal upload session tracking
    /// </summary>
    public class UploadSession
    {
        public string UploadId { get; set; }
        public string FileName { get; set; }
        public long TotalSize { get; set; }
        public int TotalChunks { get; set; }
        public string AnimeSlug { get; set; }
        public int EpisodeNumber { get; set; }
        public string EpisodeName { get; set; }
        public string TempDirectory { get; set; }
        public ConcurrentDictionary<int, bool> UploadedChunks { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime LastActivity { get; set; }
    }
}
