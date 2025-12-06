namespace backend.DTOs
{
    public class EpisodeDTO
    {
        public string EpisodeName { get; set; }
        public int EpisodeNumber { get; set; }
        public TimeOnly Duration { get; set; }
        

    }
    public class EpisodeUploadDTO : EpisodeDTO
    {
        public string AnimeId { get; set; }
        public IFormFile File { get; set; }
    }

    public class EpisodeGetDTO : EpisodeDTO
    {
        public string VideoUrl { get; set; }
    }


}
