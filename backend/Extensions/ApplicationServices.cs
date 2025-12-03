using backend.Data;
using backend.Helpers;
using backend.Interface;
using backend.Repository.UnitOfWork;
using backend.Services;
using Microsoft.EntityFrameworkCore;
namespace backend.Extensions
{
    public static class ApplicationServices
    {
        public static IServiceCollection AddApplicationService (this IServiceCollection services, IConfiguration config)
        {
            // Add services to the container.
            services.AddCors();

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(config.GetConnectionString("DefaultConnection")));

            services.Configure<GoogleDriveConfig>(config.GetSection("GoogleDrive"));
            services.AddScoped<IGoogleDriveService, GoogleDriveService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IPasswordHasherService, PasswordHasherService>();
            services.AddScoped<IGoogleDriveService, GoogleDriveService>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddAutoMapper(cfg => { }, AppDomain.CurrentDomain.GetAssemblies());


            return services;
        }
    }
}
