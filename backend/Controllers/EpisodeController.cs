using AutoMapper;
using backend.Data;
using backend.DTOs;
using backend.Interface;
using backend.Models;
using Google.Apis.Drive.v3;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Immutable;
using System.IO;


namespace backend.Controllers
{
    public class EpisodeController : BaseApiController
    {
        private readonly IUnitOfWork _uow;
        private readonly IGoogleDriveService _ggDrive;
        private readonly IWebHostEnvironment _environment;
        private readonly IVideoService _videoService;
        private readonly IServiceScopeFactory _scopeFactory;

        public EpisodeController(IUnitOfWork uow, IGoogleDriveService ggDrive, IWebHostEnvironment environment, IVideoService videoService, IServiceScopeFactory scopeFactory)
        {
            _uow = uow;
            _ggDrive = ggDrive;
            _environment = environment;
            _videoService = videoService;
            _scopeFactory = scopeFactory;
        }

        [HttpGet("get-animeepisodes")]
        public async Task<ActionResult<ICollection<EpisodeGetDTO>>> GetEpisodeInAnimes([FromQuery] string animeName)
        {
            var anime = await _uow.Animes.GetAnimeByNameSlug(animeName);
            if (anime == null)
            {
                return NotFound("Anime not found");
            }
            var animeEpisodes = await _uow.Episodes.GetAnimeEpisodesAsync(anime.Id);
            if (!animeEpisodes.Any())
            {
                return NotFound("Episodes not found");
            }
            var episodeDTOs = animeEpisodes.Select(episode => new EpisodeGetDTO
            {
                EpisodeName = episode.EpisodeName,
                EpisodeNumber = episode.EpisodeNumber,
                Duration = episode.Duration, // Convert TimeOnly to string
                VideoUrl = _ggDrive.GetCloudflareWorkerUrl + episode.VideoUrl
            }).ToImmutableList();
            return Ok(episodeDTOs);
        }

        [HttpGet("get-episodefromdrive")]
        public async Task<ActionResult<ICollection<EpisodeDTO>>> GetEpisodeFromDrive()
        {
            var episodes = await _ggDrive.GetEpisodesFromDrive();
            return Ok(episodes);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("upload-episode-chunk")]
        [RequestSizeLimit(100_000_000)] // 100MB
        public async Task<IActionResult> UploadEpisodeChunk([FromForm] EpisodeUploadDTO dto)
        {
            try
            {
                // 1. Tạo đường dẫn lưu file tạm
                string tempFolder = Path.Combine(_environment.WebRootPath, "temp", dto.UploadId);
                if (!Directory.Exists(tempFolder)) Directory.CreateDirectory(tempFolder);

                string filePath = Path.Combine(tempFolder, dto.FileName);

                // 2. Append (Nối) dữ liệu
                using (var stream = new FileStream(filePath, FileMode.Append, FileAccess.Write, FileShare.None))
                {
                    await dto.FileChunk.CopyToAsync(stream);
                }

                // 3. Kiểm tra Chunk cuối cùng
                if (dto.ChunkIndex == dto.TotalChunks - 1)
                {
                    // === QUAN TRỌNG: Fire & Forget ===
                    // Chạy task nén ở luồng khác, không bắt User phải chờ
                    _ = Task.Run(async () =>
                    {
                        await ProcessVideoBackground(filePath, dto);
                    });

                    // Trả về kết quả NGAY LẬP TỨC
                    return Ok(new
                    {
                        isCompleted = true,
                        message = "Upload completed. Processing started in background."
                    });
                }

                return Ok(new { isCompleted = false, chunkIndex = dto.ChunkIndex });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Hàm xử lý ngầm (Chạy sau khi đã trả response cho client)
        private async Task ProcessVideoBackground(string inputPath, EpisodeUploadDTO dto)
        {
            string compressedFilePath = "";
            try
            {
                // A. Đổi tên file & B. Nén Video (Giữ nguyên)
                string fileNameWithoutExt = Path.GetFileNameWithoutExtension(inputPath);
                compressedFilePath = Path.Combine(Path.GetDirectoryName(inputPath), $"{fileNameWithoutExt}_compressed.mp4");

                Console.WriteLine($"[Processing] Start compressing: {dto.FileName}");
                bool compressResult = await _videoService.CompressAndConvertToMp4Async(inputPath, compressedFilePath);

                if (!compressResult) return;

                string animeName = "Unknown";

                // Tạo scope nhỏ chỉ để lấy tên Anime rồi hủy ngay (để không giữ kết nối DB lâu)
                using (var scope = _scopeFactory.CreateScope())
                {
                    var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                    var anime = await uow.Animes.GetAnimeByNameSlug(dto.AnimeSlug);
                    if (anime != null)
                    {
                        animeName = anime.AnimeName;
                    }
                }
                // Kết thúc khối này, kết nối DB đóng lại, an toàn.

                // C. Upload lên Google Drive
                Console.WriteLine($"[Processing] Start uploading to Drive...");

                // Dùng using cho FileStream để tránh leak memory
                using (var stream = new FileStream(compressedFilePath, FileMode.Open, FileAccess.Read))
                {
                    string videoUrl = await _ggDrive.UploadStreamAsync(
                            stream,
                            $"anime/{animeName}/{dto.EpisodeNumber}", // Dùng biến animeName vừa lấy
                            $"{animeName} - Episode {dto.EpisodeNumber}",
                            "video/mp4"
                    );

                    // D. Cập nhật database (Tạo scope mới lần nữa để lưu)
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();


                        // Vì dto.AnimeSlug là string, cần đảm bảo Logic Add Episode của bạn xử lý đúng
                        // Nếu cần AnimeId, bạn lại phải query lại trong scope này
                        var animeInDb = await dbContext.Animes.FirstOrDefaultAsync(a => a.Slug == dto.AnimeSlug);
                        if (animeInDb == null)
                        {
                            Console.WriteLine($"[Error] Anime not found for slug: {dto.AnimeSlug}");
                            return;
                        }

                        var episode = new Episode
                        {
                            AnimeId = animeInDb.Id, // Quan trọng: Gán khóa ngoại
                            EpisodeNumber = dto.EpisodeNumber,
                            EpisodeName = dto.EpisodeName, // Hoặc dto.Name tùy DTO của bạn
                            Duration = dto.Duration,       // Giả sử DTO và Entity cùng kiểu TimeOnly
                            VideoUrl = videoUrl
                            // Gán thêm các trường khác nếu có
                        };

                        dbContext.Episodes.Add(episode);
                        await dbContext.SaveChangesAsync();
                    }
                }

                Console.WriteLine("[Success] Video processed and uploaded.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Background Error] {ex.Message}");
            }
            finally
            {
                // E. Dọn dẹp rác (Giữ nguyên)
                if (System.IO.File.Exists(inputPath)) System.IO.File.Delete(inputPath);
                if (System.IO.File.Exists(compressedFilePath)) System.IO.File.Delete(compressedFilePath);

                string folder = Path.GetDirectoryName(inputPath);
                if (Directory.Exists(folder) && !Directory.EnumerateFileSystemEntries(folder).Any())
                {
                    Directory.Delete(folder);
                }
            }
        }
    }
}
