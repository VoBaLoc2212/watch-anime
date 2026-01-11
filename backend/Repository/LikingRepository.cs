using backend.Data;
using backend.Interface;
using backend.Models;

namespace backend.Repository
{
    public class LikingRepository : BaseRepository<Liking>, ILikingRepository
    {
        public LikingRepository(AppDbContext context) : base(context)
        {
        }
    }
}
