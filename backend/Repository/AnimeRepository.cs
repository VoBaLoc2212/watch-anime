using backend.Data;
using backend.Interface;
using backend.Models;
using AutoMapper;
using backend.DTOs;
using Microsoft.EntityFrameworkCore;

namespace backend.Repository
{
    public class AnimeRepository : BaseRepository<Anime>, IAnimeRepository
    {
        public AnimeRepository(AppDbContext context) : base(context)
        {
        }
        public async Task<Anime> GetAnimeByNameSlug (string animeNameSlug)
        {
            return await _context.Animes.FirstOrDefaultAsync(a => a.Slug.Equals(animeNameSlug));
        }
        
    }
}
