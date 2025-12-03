namespace backend.Interface
{
    public interface IBaseRepository<T> where T : class
    {
        IQueryable<T> GetAll();
        Task<T?> GetByIdAsync(Guid id);
        void Add(T entity);
        void Update(T entity);
        void Delete(T entity);
    }
}
