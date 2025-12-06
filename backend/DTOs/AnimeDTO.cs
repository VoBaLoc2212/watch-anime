namespace backend.DTOs
{
    public class AnimeDTO
    {
        public string AnimeName { get; set; }
        public string Description { get; set; }
        
    }

    public class AnimeGetDTO : AnimeDTO
    {
        public string Id { get; set; }
        public string ThumbnailUrl { get; set; }
    }

    public class AnimeCreateDTO : AnimeDTO
    {
        public IFormFile Thumbnail { get; set; }
    }
}
