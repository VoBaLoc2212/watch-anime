using backend.Models;

namespace backend.Interface
{
    public interface IEpisodeRepository : IBaseRepository<Episode>
    {
        Task<ICollection<Episode>> GetAnimeEpisodesAsync(Guid animeId);
    }
}
