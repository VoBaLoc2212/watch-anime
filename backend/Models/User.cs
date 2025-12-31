using backend.Enums;
using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string GoogleId { get; set; }
        [Required, EmailAddress]  public string Email { get; set; }
        public string PasswordHash { get; set; }
        [Required, Phone, RegularExpression(@"^0\d{9}$")] public string PhoneNumber { get; set; }
        [Required] public string FirstName { get; set; }
        [Required] public string LastName { get; set; }
        public string PhotoUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime DeletedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Anime> CreatedAnimes { get; set; }

        public UserRole Role { get; set; } = UserRole.User;

        public ICollection<Rating> Ratings { get; set; }



    }
}
