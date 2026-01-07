using AutoMapper;
using backend.Data;
using backend.Interface;

namespace backend.Repository.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;

        public UnitOfWork(AppDbContext context)
        {
            _context = context;
        }

        public IAccountRepository Accounts => new AccountRepository(_context);
        public IAnimeRepository Animes => new AnimeRepository(_context);
        public IEpisodeRepository Episodes => new EpisodeRepository(_context);
        public IRatingRepository Ratings => new RatingRepository(_context);
        public INotificationRepository Notifications => new NotificationRepository(_context);

        public async Task<bool> Complete()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
