using backend.Interface;
using Microsoft.AspNetCore.Mvc;
using backend.Models;
using backend.Extensions;
using Microsoft.EntityFrameworkCore;
namespace backend.Controllers
{
    public class LikingController : BaseApiController
    {
        private readonly IUnitOfWork _uow;
        public LikingController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        [HttpPost("add-liking")]
        public async Task<IActionResult> AddLiking([FromQuery] string AnimeSlug)
        {
            var anime = await _uow.Animes.GetAnimeByNameSlug(AnimeSlug);
            if (anime == null) return NotFound(new { message = "Anime not found" });

            var user = await _uow.Accounts.GetUserByEmail(User.GetEmail());
            if (user == null) return Unauthorized(new { message = "User not found" });

            var liking = new Liking
            {
                LikedAnimeId = anime.Id,
                LikedById = user.Id
            };
            _uow.Likings.Add(liking);
            if (await _uow.Complete()) return Ok(new { message = "Liking added successfully" });
            return BadRequest(new { message = "Failed to add liking" });
        }

        [HttpDelete("remove-liking")]
        public async Task<IActionResult> RemoveLiking([FromQuery] string AnimeSlug)
        {
            var anime = await _uow.Animes.GetAnimeByNameSlug(AnimeSlug);
            if (anime == null) return NotFound(new { message = "Anime not found" });
            var user = await _uow.Accounts.GetUserByEmail(User.GetEmail());
            if (user == null) return Unauthorized(new { message = "User not found" });

            var liking = await _uow.Likings.GetAll()
                .FirstOrDefaultAsync(l => l.LikedAnimeId == anime.Id && l.LikedById == user.Id);

            if (liking == null) return NotFound(new { message = "Liking not found" });
            _uow.Likings.Delete(liking);
            if (await _uow.Complete()) return Ok(new { message = "Liking removed successfully" });
            return BadRequest(new { message = "Failed to remove liking" });
        }
    }
}
