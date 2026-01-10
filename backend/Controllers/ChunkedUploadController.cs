using System.Collections.Concurrent;
using backend.DTOs;
using backend.Extensions;
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
        private readonly IDropletFFmpegService _dropletService;
        private readonly IUnitOfWork _uow;
        private readonly ILogger<ChunkedUploadController> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        // In-memory session storage (use Redis in production for scalability)
        private static readonly ConcurrentDictionary<string, UploadSession> _uploadSessions = new();

        // Temp directory for storing chunks before assembly
        private const string TEMP_UPLOAD_DIR = "TempUploads";
        private const int CHUNK_SIZE_MB = 5; // 5MB chunks

        public ChunkedUploadController(
            IDropletFFmpegService dropletService,
            IUnitOfWork uow,
            ILogger<ChunkedUploadController> logger,
            IServiceScopeFactory serviceScopeFactory)
        {
            _dropletService = dropletService;
            _uow = uow;
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;

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

                // Step 2: Get all Admin users for notifications
                var adminUsers = await _uow.Accounts.GetAdminUsersAsync();
                var adminIds = adminUsers.Select(a => a.Id).ToList();
                
                // Step 3: Send "Processing" notification to all Admins immediately
                _logger.LogInformation("Sending processing notification to Admins...");
                foreach (var adminId in adminIds)
                {
                    var processingNotif = new Models.Notification
                    {
                        UserId = adminId,
                        Title = "Video Processing",
                        Message = $"Episode {session.EpisodeNumber} of '{session.AnimeSlug}' is being converted to HLS format. Please wait...",
                        Type = "info",
                        IsRead = false
                    };
                    _uow.Notifications.Add(processingNotif);
                }
                await _uow.Complete();

                // Step 4: Start background Droplet FFmpeg encoding (don't wait)
                _logger.LogInformation("Starting background Droplet FFmpeg encoding...");
                _ = Task.Run(async () =>
                {
                    try
                    {
                        _logger.LogInformation($"[Background] Converting with Droplet FFmpeg for {request.UploadId}");

                        // Convert to HLS using Droplet
                        using var scope = _serviceScopeFactory.CreateScope();
                        var bgUow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                        var anime = await bgUow.Animes.GetAnimeByNameSlug(session.AnimeSlug);
                        var spacePath = $"anime/{anime.AnimeName}/ep{session.EpisodeNumber}";
                        var (masterUrl, cdnUrl) = await _dropletService.ConvertToHLSAsync(
                            assembledVideoPath,
                            spacePath);

                        _logger.LogInformation($"[Background] Droplet conversion completed. CDN URL: {cdnUrl}");

                        // Create Episode record in database
                        _logger.LogInformation($"[Background] Creating episode record for {request.UploadId}");
                        
                        // Create new scope for background task
                        
                        
                        if (anime == null)
                        {
                            throw new Exception($"Anime not found: {session.AnimeSlug}");
                        }

                        var episode = new Models.Episode
                        {
                            AnimeId = anime.Id,
                            EpisodeNumber = session.EpisodeNumber,
                            EpisodeName = session.EpisodeName,
                            VideoUrl = cdnUrl,
                            Duration = TimeOnly.Parse(request.Duration),
                        };

                        bgUow.Episodes.Add(episode);
                        await bgUow.Complete();

                        // Send ONE success notification to all Admins only
                        _logger.LogInformation("Sending success notification to Admins...");
                        var bgAdminUsers = await bgUow.Accounts.GetAdminUsersAsync();
                        foreach (var admin in bgAdminUsers)
                        {
                            var successNotif = new Models.Notification
                            {
                                UserId = admin.Id,
                                Title = "Upload Completed",
                                Message = $"Episode {session.EpisodeNumber} of '{anime.AnimeName}' has been uploaded and encoded successfully",
                                Type = "success",
                                Link = $"watch?animeName={session.AnimeSlug}",
                                IsRead = false
                            };
                            bgUow.Notifications.Add(successNotif);
                        }
                        await bgUow.Complete();

                        // Cleanup temp files
                        _logger.LogInformation($"[Background] Cleaning up temp files for {request.UploadId}");
                        CleanupSession(session, assembledVideoPath, null);

                        _logger.LogInformation($"[Background] Upload completed successfully. Episode ID: {episode.Id}");
                    }
                    catch (Exception bgEx)
                    {
                        _logger.LogError(bgEx, $"[Background] Error processing upload {request.UploadId}");
                        
                        // Send ONE error notification to all Admins only
                        try
                        {
                            using var scope = _serviceScopeFactory.CreateScope();
                            var bgUow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                            
                            _logger.LogInformation("Sending error notification to Admins...");
                            var bgAdminUsers = await bgUow.Accounts.GetAdminUsersAsync();
                            foreach (var admin in bgAdminUsers)
                            {
                                var errorNotif = new Models.Notification
                                {
                                    UserId = admin.Id,
                                    Title = "Upload Failed",
                                    Message = $"Failed to process episode {session.EpisodeNumber} of '{session.AnimeSlug}'. Error: {bgEx.Message}",
                                    Type = "error",
                                    IsRead = false
                                };
                                bgUow.Notifications.Add(errorNotif);
                            }
                            await bgUow.Complete();
                        }
                        catch (Exception notifEx)
                        {
                            _logger.LogError(notifEx, "Failed to create error notification");
                        }
                    }
                });

                // Return immediately - processing continues in background
                _logger.LogInformation($"Upload initiated for Droplet FFmpeg processing: {request.UploadId}");

                return Ok(new CompleteChunkedUploadResponse
                {
                    Success = true,
                    Message = "Upload completed. Video is being encoded by Droplet FFmpeg. This may take 5-15 minutes depending on video length.",
                    HlsMasterUrl = "processing", // Placeholder
                    EpisodeId = "0" // Will be created when background processing completes
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
        private void CleanupSession(UploadSession session, string assembledVideo, string? hlsDir)
        {
            try
            {
                // Delete assembled video
                if (System.IO.File.Exists(assembledVideo))
                {
                    System.IO.File.Delete(assembledVideo);
                }

                // Delete HLS temp directory (if using local FFmpeg)
                if (!string.IsNullOrEmpty(hlsDir) && Directory.Exists(hlsDir))
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
