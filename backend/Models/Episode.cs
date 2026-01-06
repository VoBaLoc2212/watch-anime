using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Episode
    {
        public Guid Id { get; set; }
        [Required]
        public string EpisodeName { get; set; }
        [Required]
        public int EpisodeNumber { get; set; }
        [Required]
        public TimeOnly Duration { get; set; }
        [Required]
        public string VideoUrl { get; set; }
        public DateTime UploadDate { get; set; } = DateTime.UtcNow;
        public DateTime DeletedAt { get; set; }

        public Anime Anime { get; set; }
        public Guid AnimeId { get; set; }
    }
}
