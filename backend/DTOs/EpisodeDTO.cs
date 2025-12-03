namespace backend.DTOs
{
    public class EpisodeDTO
    {
        public string EpisodeName { get; set; }
        public int EpisodeNumber { get; set; }
        public TimeOnly Duration { get; set; }
        public string VideoUrl { get; set; }
    }
}
