namespace backend.Interface
{
    public interface IPasswordHasherService
    {
        Task<string> HashPassword(string password);
        Task<bool> VerifyPassword(string stored, string password);
    }
}
