using Microsoft.EntityFrameworkCore;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Index(nameof(Slug), IsUnique = true)]
    public class Anime
    {
        public Guid Id { get; set; }
        [Required] public string AnimeName { get; set; }
        [Required, MinLength(10)] public string Description { get; set; }
        [Required] public string ReleaseYear { get; set; }
        [Required] public string Studio { get; set; }
        [Required] public string Status { get; set; }
        [Required] public int TotalEpisodes { get; set; }
        [Required][Column(TypeName = "jsonb")] public List<string> Genres { get; set; } = new List<string>();
        [MaxLength(255)] public string Slug { get; set; } //Save a URL-friendly version of the anime name
        public string ThumbnailUrl { get; set; }

        public DateTime UploadDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime DeletedAt { get; set; } = DateTime.UtcNow;


        public ICollection<Episode> Episodes { get; set; }

        public User CreatedBy { get; set; }
        public Guid CreatedById { get; set; }

        public ICollection<Rating> Ratings { get; set; }

    }
}
