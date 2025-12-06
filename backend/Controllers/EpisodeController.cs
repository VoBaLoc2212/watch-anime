using AutoMapper;
using backend.DTOs;
using backend.Interface;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Immutable;

namespace backend.Controllers
{
    public class EpisodeController : BaseApiController
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IGoogleDriveService _ggDrive;

        public EpisodeController(IUnitOfWork uow, IMapper mapper, IGoogleDriveService ggDrive)
        {
            _uow = uow;
            _mapper = mapper;
            _ggDrive = ggDrive;
        }

        [HttpGet("get-animeepisodes")]
        public async Task<ActionResult<ICollection<EpisodeGetDTO>>> GetEpisodeInAnimes([FromQuery] string animeId)
        {
            Guid animeGuid = Guid.Parse(animeId);
            var animeEpisodes = await _uow.Episodes.GetAnimeEpisodesAsync(animeGuid);
            if (!animeEpisodes.Any())
            {
                return NotFound("Episodes not found");
            }
            var episodeDTOs = animeEpisodes.Select(episode => new EpisodeGetDTO
            {
                EpisodeName = episode.EpisodeName,
                EpisodeNumber = episode.EpisodeNumber,
                Duration = episode.Duration,
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

        [HttpPost("upload-episode")]
        public async Task<ActionResult> UploadEpisode([FromForm] EpisodeUploadDTO episodeUploadDTO)
        {
            var listOfEpisodes = await _uow.Episodes.GetAnimeEpisodesAsync(Guid.Parse(episodeUploadDTO.AnimeId));

            if (listOfEpisodes.Any(e => e.EpisodeNumber == episodeUploadDTO.EpisodeNumber))
            {
                return BadRequest("Episode number already exists for this anime.");
            }

            var episode = _mapper.Map<Episode>(episodeUploadDTO);

            var videoUrl = await _ggDrive.UploadFileAsync(episodeUploadDTO.File);

            episode.VideoUrl = videoUrl;

            _uow.Episodes.Add(episode);
            if (await _uow.Complete())
            {
                return Ok("Episode uploaded successfully.");
            }
            return BadRequest("Failed to upload episode.");
        }
    }
}
