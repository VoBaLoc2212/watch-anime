using backend.Data;
using backend.Helpers;
using backend.Interface;
using backend.Repository.UnitOfWork;
using backend.Services;
using Microsoft.AspNetCore.Http.Features;
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


            var connectionString = config.GetConnectionString("DatabaseConnectionString");
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
            services.Configure<BlobAzureSetting>(config.GetSection("BlobAzure"));


            services.AddScoped<IGoogleDriveService, GoogleDriveService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IPasswordHasherService, PasswordHasherService>();
            services.AddScoped<IGoogleDriveService, GoogleDriveService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IVideoService, VideoService>();
            services.AddScoped<IBlobAzureService, BlobAzureService>();
            services.AddScoped<IHLSConversionService, HLSConversionService>();

            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddAutoMapper(cfg => { }, AppDomain.CurrentDomain.GetAssemblies());

            services.Configure<FormOptions>(opt =>
            {
               opt.MultipartBodyLengthLimit = long.MaxValue; // In case of need to upload large files
            });

            return services;
        }
    }
}
