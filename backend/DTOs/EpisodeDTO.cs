using backend.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace backend.DTOs
{
    public class EpisodeDTO
    {
        public string EpisodeName { get; set; }
        public int EpisodeNumber { get; set; }
        [ModelBinder(typeof(TimeOnlyModelBinder))]
        public TimeOnly Duration { get; set; }

    }


    public class EpisodeUploadDTO : EpisodeDTO
    {
        public string AnimeSlug { get; set; }
        public string VideoFileName { get; set; }
    }

    public class EpisodeGetDTO : EpisodeDTO
    {
        public string VideoUrl { get; set; }
    }


}
