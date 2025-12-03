using System.Security.Claims;

namespace backend.Extensions
{
    public static class ClaimPrincipalExtensions
    {
        public static Guid GetUserId(this ClaimsPrincipal user)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new InvalidOperationException("User ID claim is missing or invalid.");
            }
            return userId;
        }
        public static string GetEmail(this ClaimsPrincipal user)
        {
            var emailClaim = user.FindFirst(ClaimTypes.Name)?.Value;
            if (emailClaim == null)
            {
                throw new InvalidOperationException("Email claim is missing.");
            }
            return emailClaim;
        }
    }
}
