using backend.Models;

namespace backend.Interface
{
    public interface IRatingRepository: IBaseRepository<Rating>
    {
        Task<IEnumerable<Rating>> GetRatingsByAnimeIdAsync(Guid animeId);
    }
}
