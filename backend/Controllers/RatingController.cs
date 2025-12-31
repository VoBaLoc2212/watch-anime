using backend.DTOs;
using backend.Extensions;
using backend.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Models;
namespace backend.Controllers
{
    public class RatingController : BaseApiController
    {
        private readonly IUnitOfWork _uow;
        public RatingController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        [HttpGet("get-animeratings")]
        public async Task<ActionResult<RatingGetDTO>> GetRatings([FromQuery] string animeSlug)
        {
            var anime = await _uow.Animes.GetAnimeByNameSlug(animeSlug);
            if (anime == null) return NotFound(new { message = "Anime not found" });
            var ratings = await _uow.Ratings.GetRatingsByAnimeIdAsync(anime.Id);

            return Ok(_uow.Ratings.GetQueryable(a => a.Anime)
                .Select(r => new RatingGetDTO
                {
                    Score = r.Score,
                    Review = r.Review,
                    UserName = r.User.FirstName + " " + r.User.LastName,
                    CreatedAt = r.CreatedAt
                }));

        }

        [Authorize(Policy = "MemberSection")]
        [HttpPost("add-animerating")]
        public async Task<ActionResult> AddRating([FromQuery] string animeSlug, [FromBody] RatingDTO ratingDTO)
        {
            var user = await _uow.Accounts.GetUserByEmail(User.GetEmail());

            var anime = await _uow.Animes.GetAnimeByNameSlug(animeSlug);
            if (anime == null) return NotFound(new { message = "Anime not found" });

            _uow.Ratings.Add(new Rating { Score = ratingDTO.Score, Review = ratingDTO.Review, CreatedById = user.Id, ReportedAnimeId = anime.Id });

            if (await _uow.Complete()) return Ok(new { message = "Rating added successfully" });

            return BadRequest(new { message = "Failed to add rating" });


        }

        [Authorize(Policy = "MemberSection")]
        [HttpDelete("delete-animerating")]
        public async Task<ActionResult> DeleteRating([FromQuery] string animeSlug)
        {
            var user = await _uow.Accounts.GetUserByEmail(User.GetEmail());
            var anime = await _uow.Animes.GetAnimeByNameSlug(animeSlug);
            if (anime == null) return NotFound(new { message = "Anime not found" });

            var rating = _uow.Ratings.GetQueryable(a => a.Anime)
                .FirstOrDefault(r => r.CreatedById == user.Id && r.ReportedAnimeId == anime.Id);
            if (rating == null) return NotFound(new { message = "Rating not found" });

            _uow.Ratings.Delete(rating);
            if (await _uow.Complete()) return Ok(new { message = "Rating deleted successfully" });
            return BadRequest(new { message = "Failed to delete rating" });
        }
    }
}
