using backend.Models;
using Microsoft.EntityFrameworkCore;

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

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);


            builder.Entity<Anime>()
                .HasMany(a => a.Episodes)
                .WithOne(e => e.Anime)
                .HasForeignKey(e => e.AnimeId)
                .OnDelete(DeleteBehavior.Restrict);



        }
    }
}
