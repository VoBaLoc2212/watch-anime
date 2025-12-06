namespace backend.Interface
{
    public interface IAuthService
    {
        Task<string> HandleGoogleLoginAsync(string email, string name, string googleId);
    }
}
