using backend.Models;

namespace backend.Interface
{
    public interface ITokenService
    {
        Task<string> CreateToken(User user);
    }
}
