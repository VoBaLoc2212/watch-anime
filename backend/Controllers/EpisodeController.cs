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
        private readonly IBlobAzureService _blobService;
        private readonly IMapper _mapper;

        public EpisodeController(IUnitOfWork uow, IGoogleDriveService ggDrive, IBlobAzureService blobService, IMapper mapper)
        {
            _uow = uow;
            _ggDrive = ggDrive;
            _blobService = blobService;
            _mapper = mapper;
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
                VideoUrl = episode.VideoUrl
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
        [HttpPost("get-upload-link")]
        public IActionResult GetUploadLink([FromQuery] string fileName, [FromQuery] string animeName, [FromQuery] string episodeNumber)
        {
            // 1. Xử lý tên Anime cho sạch (Slugify)
            // Ví dụ: "Naruto Shippuden" -> "naruto-shippuden"
            string safeAnimeName = ToUrlSlug(animeName);

            // 2. Lấy đuôi file gốc (ví dụ .mp4)
            string extension = Path.GetExtension(fileName);

            // 3. TẠO CẤU TRÚC THƯ MỤC Ở ĐÂY
            // Format: anime/{ten-anime}/{so-tap}.mp4
            // Ví dụ: anime/naruto-shippuden/1.mp4
            string fullBlobName = $"anime/{safeAnimeName}/{episodeNumber}{extension}";

            // 4. Tạo SAS Token cho cái đường dẫn dài ngoằng đó
            // Lưu ý: _blobService.GetSasToken không cần sửa, vì nó nhận blobName là string
            var uploadUrl = _blobService.GetSasToken("media", fullBlobName);

            return Ok(new
            {
                uploadUrl = uploadUrl,
                blobName = fullBlobName // Trả về cái tên này để Frontend biết mà lưu vào DB
            });
        }
        private string ToUrlSlug(string value)
        {
            // Bạn có thể tìm hàm Slugify xịn hơn trên mạng, đây là ví dụ đơn giản
            return value.ToLower()
                .Replace(" ", "-")
                .Replace("đ", "d")
                // ... (xử lý thêm tiếng Việt có dấu nếu cần) ...
                ;
        }

        [HttpPost("create-episode")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult> CreateEpisode([FromBody] EpisodeUploadDTO episodeDTO)
        {
            var anime = await _uow.Animes.GetAnimeByNameSlug(episodeDTO.AnimeSlug);
            if (anime == null)
            {
                return NotFound(new { message = "Anime not found" });
            }
            var newEpisode = _mapper.Map<Episode>(episodeDTO);
            anime.Episodes.Add(newEpisode);
            _uow.Animes.Update(anime);
            if (await _uow.Complete())
            {
                return Ok(new { message = "Episode created successfully" });
            }
            else
            {
                return BadRequest(new { message = "Failed to create episode" });
            }


        }
    }
}
