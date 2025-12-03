using AutoMapper;
using backend.DTOs;
using backend.Interface;
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
        public async Task<ActionResult<ICollection<EpisodeDTO>>> GetEpisodeInAnimes([FromQuery] string animeId)
        {
            Guid animeGuid = Guid.Parse(animeId);
            var animeEpisodes = await _uow.Episodes.GetAnimeEpisodesAsync(animeGuid);
            if (!animeEpisodes.Any())
            {
                return NotFound("Episodes not found");
            }
            var episodeDTOs = animeEpisodes.Select(episode => new EpisodeDTO
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
    }
}
