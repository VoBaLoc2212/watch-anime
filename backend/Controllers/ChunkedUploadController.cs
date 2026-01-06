using System.Collections.Concurrent;
using backend.DTOs;
using backend.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    /// <summary>
    /// Controller for handling chunked video uploads and HLS conversion
    /// Production-ready implementation for large file uploads (300MB-1GB+)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    public class ChunkedUploadController : BaseApiController
    {
        private readonly IHLSConversionService _hlsService;
        private readonly IUnitOfWork _uow;
        private readonly ILogger<ChunkedUploadController> _logger;

        // In-memory session storage (use Redis in production for scalability)
        private static readonly ConcurrentDictionary<string, UploadSession> _uploadSessions = new();

        // Temp directory for storing chunks before assembly
        private const string TEMP_UPLOAD_DIR = "TempUploads";
        private const int CHUNK_SIZE_MB = 5; // 5MB chunks

        public ChunkedUploadController(
            IHLSConversionService hlsService,
            IUnitOfWork uow,
            ILogger<ChunkedUploadController> logger)
        {
            _hlsService = hlsService;
            _uow = uow;
            _logger = logger;

            // Ensure temp directory exists
            Directory.CreateDirectory(TEMP_UPLOAD_DIR);
        }

        /// <summary>
        /// Step 1: Initiate chunked upload
        /// Client calls this first to get an upload session ID
        /// </summary>
        [HttpPost("initiate-chunked-upload")]
        public IActionResult InitiateChunkedUpload([FromBody] InitiateChunkedUploadRequest request)
        {
            _logger.LogInformation($"Initiating chunked upload: {request.FileName} ({request.TotalSize} bytes)");

            // Generate unique upload ID
            var uploadId = Guid.NewGuid().ToString();

            // Create temp directory for this upload session
            var tempDir = Path.Combine(TEMP_UPLOAD_DIR, uploadId);
            Directory.CreateDirectory(tempDir);

            // Create upload session
            var session = new UploadSession
            {
                UploadId = uploadId,
                FileName = request.FileName,
                TotalSize = request.TotalSize,
                TotalChunks = request.TotalChunks,
                AnimeSlug = request.AnimeSlug,
                EpisodeNumber = request.EpisodeNumber,
                EpisodeName = request.EpisodeName,
                TempDirectory = tempDir,
                CreatedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow
            };

            _uploadSessions[uploadId] = session;

            return Ok(new InitiateChunkedUploadResponse
            {
                UploadId = uploadId,
                ChunkSize = CHUNK_SIZE_MB * 1024 * 1024,
                TotalChunks = request.TotalChunks
            });
        }

        /// <summary>
        /// Step 2: Upload individual chunk
        /// Client calls this multiple times (once per chunk)
        /// Supports resume - can re-upload chunks if failed
        /// </summary>
        [HttpPost("upload-chunk")]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10MB max per chunk
        public async Task<IActionResult> UploadChunk([FromForm] UploadChunkRequest request)
        {
            if (!_uploadSessions.TryGetValue(request.UploadId, out var session))
            {
                return NotFound(new { Message = "Upload session not found or expired" });
            }

            _logger.LogInformation($"Uploading chunk {request.ChunkIndex}/{session.TotalChunks} for session {request.UploadId}");

            // Check if chunk already uploaded (resume scenario)
            if (session.UploadedChunks.ContainsKey(request.ChunkIndex))
            {
                _logger.LogInformation($"Chunk {request.ChunkIndex} already uploaded, skipping");
                return Ok(new UploadChunkResponse
                {
                    Success = true,
                    ChunkIndex = request.ChunkIndex,
                    Message = "Chunk already uploaded"
                });
            }

            try
            {
                // Save chunk to temp file
                var chunkPath = Path.Combine(session.TempDirectory, $"chunk_{request.ChunkIndex:D4}");
                using (var fileStream = new FileStream(chunkPath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    await request.ChunkData.CopyToAsync(fileStream);
                }

                // Mark chunk as uploaded
                session.UploadedChunks[request.ChunkIndex] = true;
                session.LastActivity = DateTime.UtcNow;

                _logger.LogInformation($"Chunk {request.ChunkIndex} saved successfully");

                return Ok(new UploadChunkResponse
                {
                    Success = true,
                    ChunkIndex = request.ChunkIndex,
                    Message = $"Chunk {request.ChunkIndex + 1}/{session.TotalChunks} uploaded"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to upload chunk {request.ChunkIndex}");
                return StatusCode(500, new { Message = "Chunk upload failed", Error = ex.Message });
            }
        }

        /// <summary>
        /// Step 3: Complete upload and start HLS conversion
        /// Assembles chunks, converts to HLS, uploads to Azure, creates Episode record
        /// This is a long-running operation - consider using background job (Hangfire) in production
        /// </summary>
        [HttpPost("complete-chunked-upload")]
        public async Task<IActionResult> CompleteChunkedUpload([FromBody] CompleteChunkedUploadRequest request)
        {
            if (!_uploadSessions.TryGetValue(request.UploadId, out var session))
            {
                return NotFound(new { Message = "Upload session not found" });
            }

            _logger.LogInformation($"Completing upload session {request.UploadId}");

            // Verify all chunks uploaded
            if (session.UploadedChunks.Count != session.TotalChunks)
            {
                return BadRequest(new
                {
                    Message = "Not all chunks uploaded",
                    Uploaded = session.UploadedChunks.Count,
                    Expected = session.TotalChunks
                });
            }

            try
            {
                // Step 1: Assemble chunks into single video file
                _logger.LogInformation("Assembling chunks...");
                var assembledVideoPath = await AssembleChunksAsync(session);

                // Step 2: Convert to HLS
                _logger.LogInformation("Converting to HLS...");
                var hlsOutputDir = Path.Combine(TEMP_UPLOAD_DIR, $"{request.UploadId}_hls");
                Directory.CreateDirectory(hlsOutputDir);

                await _hlsService.ConvertToHLSAsync(assembledVideoPath, hlsOutputDir, progress =>
                {
                    _logger.LogInformation($"HLS conversion progress: {progress}%");
                });

                // Step 3: Upload HLS files to Azure Blob
                _logger.LogInformation("Uploading HLS to Azure Blob...");
                var blobPath = $"anime/{session.AnimeSlug}/ep{session.EpisodeNumber}";
                var masterUrl = await _hlsService.UploadHLSToAzureBlobAsync(hlsOutputDir, blobPath);

                // Step 4: Create Episode record in database
                _logger.LogInformation("Creating episode record...");
                var anime = await _uow.Animes.GetAnimeByNameSlug(session.AnimeSlug);
                if (anime == null)
                {
                    throw new Exception($"Anime not found: {session.AnimeSlug}");
                }

                var episode = new Models.Episode
                {
                    AnimeId = anime.Id,
                    EpisodeNumber = session.EpisodeNumber,
                    EpisodeName = session.EpisodeName,
                    VideoUrl = masterUrl,
                    Duration = TimeOnly.Parse(request.Duration),
                };

                _uow.Episodes.Add(episode);
                await _uow.Complete();

                // Step 5: Cleanup temp files
                _logger.LogInformation("Cleaning up temp files...");
                CleanupSession(session, assembledVideoPath, hlsOutputDir);

                _logger.LogInformation($"Upload completed successfully. Episode ID: {episode.Id}");

                return Ok(new CompleteChunkedUploadResponse
                {
                    Success = true,
                    Message = "Upload and conversion completed successfully",
                    HlsMasterUrl = masterUrl,
                    EpisodeId = episode.Id.ToString()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to complete upload");
                return StatusCode(500, new { Message = "Upload completion failed", Error = ex.Message });
            }
        }

        /// <summary>
        /// Get upload progress (optional - for UI progress display)
        /// </summary>
        [HttpGet("upload-progress/{uploadId}")]
        public IActionResult GetUploadProgress(string uploadId)
        {
            if (!_uploadSessions.TryGetValue(uploadId, out var session))
            {
                return NotFound();
            }

            var progress = (double)session.UploadedChunks.Count / session.TotalChunks * 100;

            return Ok(new
            {
                UploadId = uploadId,
                Progress = progress,
                UploadedChunks = session.UploadedChunks.Count,
                TotalChunks = session.TotalChunks,
                LastActivity = session.LastActivity
            });
        }

        /// <summary>
        /// Cancel upload and cleanup temp files
        /// </summary>
        [HttpDelete("cancel-upload/{uploadId}")]
        public IActionResult CancelUpload(string uploadId)
        {
            if (!_uploadSessions.TryRemove(uploadId, out var session))
            {
                return NotFound();
            }

            try
            {
                if (Directory.Exists(session.TempDirectory))
                {
                    Directory.Delete(session.TempDirectory, true);
                }

                _logger.LogInformation($"Upload {uploadId} cancelled and cleaned up");
                return Ok(new { Message = "Upload cancelled" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cleanup cancelled upload");
                return StatusCode(500, new { Message = "Cleanup failed" });
            }
        }

        /// <summary>
        /// Assemble all chunks into single video file
        /// Chunks are written in order to produce valid video file
        /// </summary>
        private async Task<string> AssembleChunksAsync(UploadSession session)
        {
            var outputPath = Path.Combine(session.TempDirectory, session.FileName);

            using (var outputStream = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.None, bufferSize: 81920))
            {
                // Write chunks in order
                for (int i = 0; i < session.TotalChunks; i++)
                {
                    var chunkPath = Path.Combine(session.TempDirectory, $"chunk_{i:D4}");

                    if (!System.IO.File.Exists(chunkPath))
                    {
                        throw new FileNotFoundException($"Chunk {i} not found");
                    }

                    using (var chunkStream = new FileStream(chunkPath, FileMode.Open, FileAccess.Read, FileShare.Read, bufferSize: 81920))
                    {
                        await chunkStream.CopyToAsync(outputStream);
                    }

                    // Delete chunk after writing to save disk space
                    System.IO.File.Delete(chunkPath);
                }
            }

            _logger.LogInformation($"Assembled video: {outputPath} ({new FileInfo(outputPath).Length} bytes)");
            return outputPath;
        }

        /// <summary>
        /// Cleanup temp files and session data
        /// </summary>
        private void CleanupSession(UploadSession session, string assembledVideo, string hlsDir)
        {
            try
            {
                // Delete assembled video
                if (System.IO.File.Exists(assembledVideo))
                {
                    System.IO.File.Delete(assembledVideo);
                }

                // Delete HLS temp directory
                if (Directory.Exists(hlsDir))
                {
                    Directory.Delete(hlsDir, true);
                }

                // Delete session temp directory
                if (Directory.Exists(session.TempDirectory))
                {
                    Directory.Delete(session.TempDirectory, true);
                }

                // Remove session from memory
                _uploadSessions.TryRemove(session.UploadId, out _);

                _logger.LogInformation($"Session {session.UploadId} cleaned up successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during cleanup");
            }
        }

        /// <summary>
        /// Background cleanup job - removes expired sessions
        /// Call this periodically (e.g., every hour) via scheduled job
        /// </summary>
        [HttpPost("cleanup-expired-sessions")]
        [AllowAnonymous] // Should be protected by internal network or API key in production
        public IActionResult CleanupExpiredSessions()
        {
            var expiredSessions = _uploadSessions.Values
                .Where(s => DateTime.UtcNow - s.LastActivity > TimeSpan.FromHours(24))
                .ToList();

            foreach (var session in expiredSessions)
            {
                try
                {
                    if (Directory.Exists(session.TempDirectory))
                    {
                        Directory.Delete(session.TempDirectory, true);
                    }

                    _uploadSessions.TryRemove(session.UploadId, out _);
                    _logger.LogInformation($"Cleaned up expired session: {session.UploadId}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to cleanup session {session.UploadId}");
                }
            }

            return Ok(new { Message = $"Cleaned up {expiredSessions.Count} expired sessions" });
        }
    }
}
