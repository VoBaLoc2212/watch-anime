using backend.Models;

namespace backend.Interface
{
    public interface IAccountRepository: IBaseRepository<User>
    {
        Task<User> GetUserByEmail(string email);
    }
}
