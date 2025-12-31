using backend.Data;
using backend.Interface;
using backend.Models;
using System.Collections.Immutable;

namespace backend.Repository
{
    public class RatingRepository: BaseRepository<Rating>, IRatingRepository
    {
        public RatingRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Rating>> GetRatingsByAnimeIdAsync(Guid animeId)
        {
            return await Task.FromResult(_context.Ratings.Where(r => r.ReportedAnimeId == animeId).ToImmutableList());
        }
    }
}
