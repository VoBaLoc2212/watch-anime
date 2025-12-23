using backend.Data;
using backend.Helpers;
using backend.Interface;
using backend.Repository.UnitOfWork;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using Npgsql;
namespace backend.Extensions
{
    public static class ApplicationServices
    {
        public static IServiceCollection AddApplicationService (this IServiceCollection services, IConfiguration config)
        {
            // Add services to the container.
            services.AddCors();


            var connectionString = config.GetConnectionString("DefaultConnection");
            var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
            dataSourceBuilder.EnableDynamicJson();
            var dataSource = dataSourceBuilder.Build();
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(dataSource));

            services.Configure<GoogleDriveConfig>(config.GetSection("GoogleDrive"));
            services.Configure<CookiePolicyOptions>(options =>
            {
                options.MinimumSameSitePolicy = SameSiteMode.Lax;
                options.Secure = CookieSecurePolicy.Always;
            });

            services.AddScoped<IGoogleDriveService, GoogleDriveService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IPasswordHasherService, PasswordHasherService>();
            services.AddScoped<IGoogleDriveService, GoogleDriveService>();
            services.AddScoped<IAuthService, AuthService>();
            
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddAutoMapper(cfg => { }, AppDomain.CurrentDomain.GetAssemblies());


            return services;
        }
    }
}
