namespace backend.DTOs
{
    public class RatingDTO
    {
        public int Score { get; set; }
        public string Review { get; set; }

    }

    public class RatingGetDTO : RatingDTO
    {
        public string UserName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
