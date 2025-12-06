using AutoMapper;
using backend.DTOs;
using backend.Interface;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Immutable;

namespace backend.Controllers
{
    public class AnimeController : BaseApiController
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IGoogleDriveService _ggDrive;

        public AnimeController(IUnitOfWork uow, IMapper mapper, IGoogleDriveService ggDrive)
        {
            _uow = uow;
            _mapper = mapper;
            _ggDrive = ggDrive;
        }

        [HttpGet("get-animes")]
        public async Task<ActionResult<ICollection<AnimeGetDTO>>> GetAnimes()
        {
            var Animes = _uow.Animes.GetAll();

            if (!(await Animes.AnyAsync()))
            {
                return NotFound("Anime video not found");
            }

            var animeDTOs = Animes.Select(anime => new AnimeGetDTO
            {
                Id = anime.Id.ToString(),
                AnimeName = anime.AnimeName,
                Description = anime.Description,
                ThumbnailUrl = anime.ThumbnailUrl
            }).ToImmutableList();

            return Ok(animeDTOs);
        }

        [HttpGet("get-anime/{id}")]
        public async Task<ActionResult<AnimeGetDTO>> GetAnime(string animeId)
        {
            var anime = await _uow.Animes.GetByIdAsync(Guid.Parse(animeId));
            if (anime == null)
            {
                return NotFound("Anime not found");
            }
            var animeDTO = new AnimeGetDTO
            {
                Id = anime.Id.ToString(),
                AnimeName = anime.AnimeName,
                Description = anime.Description,
                ThumbnailUrl = anime.ThumbnailUrl
            };
            return Ok(animeDTO);
        }

        [HttpPost("add-anime")]
        public async Task<ActionResult> AddAnime([FromForm] AnimeCreateDTO animeDTO)
        {
            var existingAnime = await _uow.Animes.GetAll()
                .FirstOrDefaultAsync(a => a.AnimeName == animeDTO.AnimeName);
            if (existingAnime != null)
            {
                return BadRequest("Anime with the same name already exists");
            }

            var thumbnailUrl = await _ggDrive.UploadFileAsync(animeDTO.Thumbnail);

            var anime = _mapper.Map<Anime>(animeDTO);

            anime.ThumbnailUrl = thumbnailUrl;
            _uow.Animes.Add(anime);

            if (await _uow.Complete() == false)
            {
                return BadRequest("Failed to add anime");
            }
            return Ok("Anime added successfully");
        }
    }
}
