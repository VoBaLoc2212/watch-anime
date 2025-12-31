using backend.Models;

namespace backend.Interface
{
    public interface IAnimeRepository: IBaseRepository<Anime>
    {
        Task<Anime> GetAnimeByNameSlug(string animeNameSlug);
    }
}
