using backend.Data;
using backend.Interface;
using Microsoft.EntityFrameworkCore;

namespace backend.Repository
{
    public class BaseRepository<T> : IBaseRepository<T> where T : class
    {
        protected readonly AppDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public BaseRepository(AppDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }
        public IQueryable<T> GetAll()
        {
            return _dbSet.AsQueryable();
        }

        public void Add(T entity)
        {
             _dbSet.Add(entity);
        }

        public async Task<T> GetByIdAsync(Guid id)
        {
            return await _dbSet.FindAsync(id);
        }

        public void Update(T entity)
        {
             _dbSet.Update(entity);
        }

        public void Delete(T entity)
        {
            _dbSet.Remove(entity);
        }
    }
}
