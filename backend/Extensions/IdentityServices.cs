using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace backend.Extensions
{
    public static class IdentityServices
    {
        public static IServiceCollection IdentityServiceExtensions(this IServiceCollection services, IConfiguration config)
        {
            services.AddAuthentication(options =>
            {
                // 1. Khi check quyền (Authorize), ưu tiên dùng JWT Token
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;

                // 2. Khi gặp Error 401, ưu tiên trả về Header của JWT
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;

                // 3. QUAN TRỌNG: SỬA DÒNG NÀY
                // Khi thực hiện hành động "SignIn" (lưu phiên), bắt buộc dùng Cookie
                // (Google Login cần cái này để hoạt động)
                options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            })
            .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme) // Đảm bảo đã thêm dịch vụ Cookie
            .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, opt =>
            {
                opt.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(config["Token:SecretKey"])),
                    ValidateIssuer = false,
                    ValidateAudience = false
                };

                // Phần Events giữ nguyên như của bạn
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

                // Cấu hình để Google biết dùng Cookie nào để SignIn tạm thời
                opt.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;

                opt.ClaimActions.MapJsonKey("picture", "picture", "url");
                opt.Scope.Add("profile");
                opt.Scope.Add("email");
                opt.SaveTokens = true;

                // Sửa lại Correlation Cookie để tránh Error vòng lặp redirect
                opt.CorrelationCookie.SameSite = SameSiteMode.Lax;
                opt.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;

                opt.CallbackPath = "/signin-google";
            });

            services.AddAuthorization(options =>
            {
                options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
                options.AddPolicy("MemberSection", policy => policy.RequireRole("Admin,User"));
            });

            return services;
        }
    }
}