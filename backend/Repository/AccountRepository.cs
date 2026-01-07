using backend.Data;
using backend.Enums;
using backend.Interface;
using backend.Models;
using Microsoft.EntityFrameworkCore;

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

        public async Task<List<User>> GetAdminUsersAsync()
        {
            return await _context.Users
                .Where(u => u.Role == UserRole.Admin)
                .ToListAsync();
        }

        public async Task<List<User>> GetRegularUsersAsync()
        {
            return await _context.Users
                .Where(u => u.Role == UserRole.User)
                .ToListAsync();
        }

    }
}
