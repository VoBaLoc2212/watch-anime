using backend.Data;
using backend.Interface;
using backend.Models;
using Google;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
// using YourProject.Data; // Import namespace chứa DbContext của bạn
// using YourProject.Models; // Import namespace chứa User Model

public class AuthService : IAuthService
{
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _context; // Thay bằng DbContext của bạn
    private readonly ITokenService _tokenService;

    // Constructor Injection: Tiêm DbContext và Config vào Service
    public AuthService(IConfiguration configuration, AppDbContext context, ITokenService tokenService)
    {
        _configuration = configuration;
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<string> HandleGoogleLoginAsync(string email, string name, string googleId)
    {
        // 1. Kiểm tra User đã tồn tại trong DB chưa
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            var nameParts = name?.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries) ?? new string[0];
            var firstName = nameParts.Length > 0 ? nameParts[0] : "";
            var lastName = nameParts.Length > 1 ? nameParts[1] : "";
            // 2. Nếu chưa -> Tạo User mới
            user = new User
            {
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                GoogleId = googleId, // Lưu GoogleId để sau này đối chiếu
                CreatedAt = DateTime.UtcNow,
                // Password = ... // Với user Google, có thể để password null hoặc random string
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        // 3. Tạo JWT Token cho hệ thống của bạn
        return await _tokenService.CreateToken(user);
    }
}