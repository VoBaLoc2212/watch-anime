using AutoMapper;
using backend.DTOs;
using backend.Extensions;
using backend.Interface;
using backend.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Immutable;
using System.Security.Claims;
using static System.Net.WebRequestMethods;

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
                return NotFound(new {message = "Anime video not found" });
            }

            var animeDTOs = Animes.Select((anime) => new AnimeGetDTO
            {
                AnimeName = anime.AnimeName,
                Description = anime.Description,
                ThumbnailUrl = anime.ThumbnailUrl,
                ReleaseYear = anime.ReleaseYear,
                Studio = anime.Studio,
                Status = anime.Status,
                TotalEpisodes = anime.TotalEpisodes,
                Genres = anime.Genres,
                Slug = anime.Slug
            }).ToImmutableList();

            return Ok(animeDTOs);
        }

        [HttpGet("get-anime-detail")]
        public async Task<ActionResult<AnimeGetDTO>> GetAnime([FromQuery]string AnimeNameSlug)
        {
            var anime = await _uow.Animes.GetAnimeByNameSlug(AnimeNameSlug);
            if (anime == null)
            {
                return NotFound(new {message = "Anime not found" });
            }
            var animeDTO = new AnimeGetDTO
            {
                AnimeName = anime.AnimeName,
                Description = anime.Description,
                ThumbnailUrl = anime.ThumbnailUrl,
                ReleaseYear = anime.ReleaseYear,
                Studio = anime.Studio,
                Status = anime.Status,
                TotalEpisodes = anime.TotalEpisodes,
                Genres = anime.Genres,
                Slug = anime.Slug
            };
            return Ok(animeDTO);
        }

        [Authorize(Policy ="AdminOnly")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [HttpPost("add-anime")]
        public async Task<ActionResult> AddAnime([FromForm] AnimeCreateDTO animeDTO)
        {
            var emailUser = User.GetEmail();

            var user = await _uow.Accounts.GetUserByEmail(emailUser);

            if (user == null) return Unauthorized();

            var existingAnime = await _uow.Animes.GetAll()
                .FirstOrDefaultAsync(a => a.AnimeName == animeDTO.AnimeName);
            if (existingAnime != null)
            {
                return BadRequest(new {message = "Anime with the same name already exists" });
            }
            var anime = _mapper.Map<Anime>(animeDTO);

            anime.CreatedById = user.Id;

            var thumbnailId = await _ggDrive.UploadImgAsync(animeDTO.Thumbnail, $"anime/{anime.AnimeName}/thumbnail", "thumbnail");

            anime.ThumbnailUrl = $"https://drive.google.com/thumbnail?id={thumbnailId}&sz=w400";

            anime.Slug = StringUtils.GenerateSlug(animeDTO.AnimeName);
            if(await _uow.Animes.Any(a => a.Slug == anime.Slug))
            {
                return BadRequest(new {message = "Anime này đã tồn tại (trùng Slug)" });
            }

            _uow.Animes.Add(anime);

            if (await _uow.Complete() == false)
            {
                return BadRequest(new {message = "Failed to add anime" });
            }
            return Ok(new { message = "Anime added successfully" });
        }

        [Authorize(Policy = "AdminOnly")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [HttpPut("update-anime")]
        public async Task<ActionResult> UpdateAnime([FromForm] AnimeUpdateDTO animeUpdateDTO, [FromQuery] string AnimeSlug)
        {
            var anime = await _uow.Animes.GetAnimeByNameSlug(AnimeSlug);
            if (anime == null)
            {
                return NotFound(new {message = "Anime not found" });
            }

            _mapper.Map(animeUpdateDTO, anime);

            anime.UpdatedAt = DateTime.UtcNow;

            if (animeUpdateDTO.Thumbnail != null)
            {
                if(_ggDrive.RenameFolderAsync("anime", anime.AnimeName, animeUpdateDTO.AnimeName).Result == false)
                {
                    return BadRequest(new { message = "Failed to rename anime folder in Google Drive" });
                }
                var thumbnailId = await _ggDrive.UploadImgAsync(animeUpdateDTO.Thumbnail, $"anime/{anime.AnimeName}/thumbnail", "thumbnail");
                anime.ThumbnailUrl = $"https://drive.google.com/thumbnail?id={thumbnailId}&sz=w400";
            }

            if(!StringUtils.GenerateSlug(animeUpdateDTO.AnimeName).Equals(AnimeSlug))
            {
                anime.Slug = StringUtils.GenerateSlug(animeUpdateDTO.AnimeName);
            }

            _uow.Animes.Update(anime);

            if (await _uow.Complete() == false)
            {
                return BadRequest(new {message = "Failed to update anime" });
            }
            return Ok(new { message = "Anime updated successfully" });
        }
    }
}
