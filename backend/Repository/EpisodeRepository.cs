using backend.Data;
using backend.Interface;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repository
{
    public class EpisodeRepository: BaseRepository<Episode>, IEpisodeRepository
    {
        public EpisodeRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<ICollection<Episode>> GetAnimeEpisodesAsync(Guid animeId)
        {
            var anime = await _context.Animes
                .Include(a => a.Episodes)
                .FirstOrDefaultAsync(a => a.Id == animeId);
            return anime?.Episodes.ToList() ?? [];
        }
    }
}
