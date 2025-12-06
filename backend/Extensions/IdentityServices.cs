using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.IdentityModel.Tokens;

namespace backend.Extensions
{
    public static class IdentityServices
    {
        public static IServiceCollection IdentityServiceExtensions(this IServiceCollection services, IConfiguration config)
        {
            // Configure multiple authentication schemes
            services.AddAuthentication(options =>
            {
                options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
            })
            .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, opt =>
            {
                opt.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(config["Token:SecretKey"])),
                    ValidateIssuer = false,
                    ValidateAudience = false
                };

                opt.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;

                        if (!string.IsNullOrEmpty(accessToken))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            })
            .AddGoogle(GoogleDefaults.AuthenticationScheme, opt =>
            {
                opt.ClientId = config["Authentication:Google:ClientId"];
                opt.ClientSecret = config["Authentication:Google:ClientSecret"];
                
                // Add required scopes for accessing user profile information
                opt.Scope.Add("profile");
                opt.Scope.Add("email");
                
                // Save tokens to be able to access them later
                opt.SaveTokens = true;

                opt.CorrelationCookie.SameSite = SameSiteMode.Lax;
                opt.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;

                // Configure callback path
                opt.CallbackPath = "/signin-google";
            });

            return services;
        }
    }
}
