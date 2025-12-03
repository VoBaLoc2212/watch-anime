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
    }
}
