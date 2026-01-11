using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;
using System.Text.Json;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }
        public DbSet<User> Users { get; set; }
        public DbSet<Anime> Animes { get; set; }
        public DbSet<Episode> Episodes { get; set; }

        public DbSet<Rating> Ratings { get; set; }

        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Liking> Likings { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>();

            builder.Entity<Anime>()
                .Property(a => a.Genres)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new List<string>()
                );


            builder.Entity<Anime>()
                .HasMany(a => a.Episodes)
                .WithOne(e => e.Anime)
                .HasForeignKey(e => e.AnimeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Anime>()
                .HasOne(a => a.CreatedBy)
                .WithMany(u => u.CreatedAnimes)
                .HasForeignKey(a => a.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Rating>()
                .HasOne(r => r.User)
                .WithMany(u => u.Ratings)
                .HasForeignKey(r => r.CreatedById)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Rating>()
                .HasOne(r => r.Anime)
                .WithMany(a => a.Ratings)
                .HasForeignKey(r => r.ReportedAnimeId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Liking>()
                .HasOne(l => l.LikedBy)
                .WithMany(u => u.LikedAnimes)
                .HasForeignKey(l => l.LikedById)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Liking>()
                .HasOne(l => l.LikedAnime)
                .WithMany(a => a.LikedByUsers)
                .HasForeignKey(l => l.LikedAnimeId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
