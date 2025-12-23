using backend.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace backend.DTOs
{
    public class AnimeDTO
    {
        public string AnimeName { get; set; }
        public string Description { get; set; }
        public string ReleaseYear { get; set; }
        public string Studio { get; set; }
        public string Status { get; set; }
        public int TotalEpisodes { get; set; }
        public decimal Rating { get; set; }
        [ModelBinder(BinderType = typeof(CommaSeparatedModelBinder))] //Bind a ","-separated list from query string to List<string>
        public List<string> Genres { get; set; }
    }

    public class AnimeGetDTO : AnimeDTO
    {
        public string ThumbnailUrl { get; set; }
    }

    public class AnimeCreateDTO : AnimeDTO
    {
        public IFormFile Thumbnail { get; set; }
    }
}
