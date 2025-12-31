using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Rating
    {
        public Guid Id { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Score must be greater than 0")]
        public int Score { get; set; }
        public string Review { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; }
        public Guid CreatedById { get; set; }
        public Guid ReportedAnimeId { get; set; }
        public User User { get; set; }
        public Anime Anime { get; set; }
    }
}
