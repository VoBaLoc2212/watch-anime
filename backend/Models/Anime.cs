using System;

namespace backend.Models
{
    public class Anime
    {
        public Guid Id { get; set; }
        public string AnimeName { get; set; }
        public string Description { get; set; }
        public string ThumbnailUrl { get; set; }

        public DateTime UploadDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime DeletedAt { get; set; } = DateTime.UtcNow;


        public ICollection<Episode> Episodes { get; set; }
    }
}
