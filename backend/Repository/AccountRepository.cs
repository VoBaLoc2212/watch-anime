using backend.Data;
using backend.Interface;
using backend.Models;

namespace backend.Repository
{
    public class AccountRepository: BaseRepository<User>, IAccountRepository
    {
        public AccountRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<User> GetUserByEmail(string email)
        {
            return await Task.FromResult(_context.Users.FirstOrDefault(u => u.Email.Equals(email)));
         }

    }
}
