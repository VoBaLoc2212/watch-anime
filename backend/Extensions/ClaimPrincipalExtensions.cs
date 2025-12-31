using System.Security.Claims;

namespace backend.Extensions
{
    public static class ClaimPrincipalExtensions
    {
        public static string GetEmail(this ClaimsPrincipal user)
        {
            var emailClaim = user.FindFirst(ClaimTypes.Email)?.Value;
            if (emailClaim == null)
            {
                throw new InvalidOperationException("Email claim is missing.");
            }
            return emailClaim;
        }
    }
}
