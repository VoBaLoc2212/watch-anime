namespace backend.Models
{
    public class Liking
    {
        public Guid Id { get; set; }
        public Guid LikedAnimeId { get; set; }
        public Anime LikedAnime { get; set; }
        public Guid LikedById { get; set; }
        public User LikedBy { get; set; }

        public DateTime LikedAt { get; set; } = DateTime.UtcNow;

    }
}
