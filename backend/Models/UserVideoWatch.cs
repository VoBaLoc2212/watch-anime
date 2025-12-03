namespace backend.Models
{
    public class UserVideoWatch
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid VideoId { get; set; }
        public DateTime WatchedAt { get; set; } = DateTime.UtcNow;
    }
}
