namespace backend.Models
{
    public class Episode
    {
        public Guid Id { get; set; }
        public string EpisodeName { get; set; }
        public int EpisodeNumber { get; set; }
        public TimeOnly Duration { get; set; }
        public string VideoUrl { get; set; }
        public DateTime UploadDate { get; set; } = DateTime.UtcNow;
        public DateTime DeletedAt { get; set; } = DateTime.UtcNow;

        public Anime Anime { get; set; }
        public Guid AnimeId { get; set; }
    }
}
