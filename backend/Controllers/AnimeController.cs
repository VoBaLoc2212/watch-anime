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

        public AnimeController(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        [HttpGet("get-animes")]
        public async Task<ActionResult<ICollection<AnimeDTO>>> GetAnimes()
        {
            var Animes = _uow.Animes.GetAll();

            if (!(await Animes.AnyAsync()))
            {
                return NotFound("Anime video not found");
            }

            var animeDTOs = Animes.Select(anime => new AnimeDTO
            {
                AnimeName = anime.AnimeName,
                Description = anime.Description,
                ThumbnailUrl = anime.ThumbnailUrl
            }).ToImmutableList();

            return Ok(animeDTOs);
        }

        [HttpPost("add-anime")]
        public async Task<ActionResult> AddAnime([FromBody] AnimeDTO animeDTO)
        {
            var anime = _mapper.Map<Anime>(animeDTO);
            _uow.Animes.Add(anime);
            if (await _uow.Complete() == false)
            {
                return BadRequest("Failed to add anime");
            }
            return Ok("Anime added successfully");
        }
    }
}
