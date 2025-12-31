using AutoMapper;
using backend.DTOs;
using backend.Interface;
using Google.Apis.Drive.v3.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers
{
    public class AccountController : BaseApiController
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITokenService _tokenService;
        private readonly IMapper _mapper;
        private readonly IPasswordHasherService _hasherPasswordService;
        private readonly IAuthService _authService;
        private readonly IConfiguration _configuration;
        private readonly IGoogleDriveService _ggService;

        public AccountController(IUnitOfWork unitOfWork, ITokenService tokenService, IMapper mapper, IPasswordHasherService hasherPasswordService, IAuthService authService, IConfiguration configuration, IGoogleDriveService ggService)
        {
            _unitOfWork = unitOfWork;
            _tokenService = tokenService;
            _mapper = mapper;
            _hasherPasswordService = hasherPasswordService;
            _authService = authService;
            _configuration = configuration;
            _ggService = ggService;
        }

        [HttpGet("user")]
        public async Task<ActionResult<UserAuthGetUserInformation>> GetUser([FromQuery] string email)
        {
            var existedUser = await _unitOfWork.Accounts.GetUserByEmail(email);
            if (existedUser == null) return BadRequest("Email Not Found");

            return Ok(new UserAuthGetUserInformation
            {
                Token = await _tokenService.CreateToken(existedUser),
                Email = existedUser.Email,
                FullName = $"{existedUser.FirstName} {existedUser.LastName}",
                PhotoUrl = existedUser.PhotoUrl,
                PhoneNumber = existedUser.PhoneNumber ?? string.Empty
            });
        }

        [HttpPost("register")]
        public async Task<ActionResult<UserAuthResponseDTO>> Register([FromBody] UserAuthDTO registerDto)
        {
            if (await _unitOfWork.Accounts.GetUserByEmail(registerDto.Email) != null)
                return BadRequest("Email is already taken");
            var user = _mapper.Map<Models.User>(registerDto);
            user.PasswordHash = await _hasherPasswordService.HashPassword(registerDto.Password);
            user.GoogleId = null;

            _unitOfWork.Accounts.Add(user);
            try
            {
                if (await _unitOfWork.Complete())
                    return Ok(new UserAuthResponseDTO
                    {
                        Token = await _tokenService.CreateToken(user),
                        Email = user.Email,
                        FullName = $"{user.FirstName} {user.LastName}",
                        PhotoUrl = user.PhotoUrl
                    });
            }
            catch (Exception ex)
            {
                return BadRequest($"Registration failed: {ex.Message}");
            }
            return BadRequest("Registration failed");

        }

        [HttpPost("login")]
        public async Task<ActionResult<UserAuthResponseDTO>> Login([FromBody] UserAuthLoginDTO loginDto)
        {
            var user = await _unitOfWork.Accounts.GetUserByEmail(loginDto.Email);
            if (user == null)
                return Unauthorized("Invalid email or password");
            var isPasswordValid = await _hasherPasswordService.VerifyPassword(user.PasswordHash, loginDto.Password);
            if (!isPasswordValid)
                return Unauthorized("Invalid email or password");
            return Ok(new UserAuthResponseDTO
            {
                Token = await _tokenService.CreateToken(user),
                Email = user.Email,
                FullName = $"{user.FirstName} {user.LastName}",
                PhotoUrl = user.PhotoUrl
            });
        }

        [HttpGet("login-google")]
        public IActionResult LoginGoogle()
        {
            var properties = new AuthenticationProperties
            {
                RedirectUri = Url.Action("GoogleResponse")
            };
            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }

        [HttpGet("google-response")]
        public async Task<IActionResult> GoogleResponse()
        {
            // 1. Lấy thông tin từ Cookie tạm của Google
            var result = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            if (!result.Succeeded)
                return BadRequest("Xác thực Google thất bại.");

            // 2. Trích xuất thông tin
            var email = result.Principal.FindFirstValue(ClaimTypes.Email);
            var name = result.Principal.FindFirstValue(ClaimTypes.Name);
            var googleId = result.Principal.FindFirstValue(ClaimTypes.NameIdentifier);
            var photoUrl = result.Principal.FindFirst("picture")?.Value;
            // 3. GỌI SERVICE (Dependency Injection hoạt động ở đây)
            // Controller không cần biết logic tạo user hay tạo token
            var mySystemToken = await _authService.HandleGoogleLoginAsync(email, name, googleId, photoUrl);

            // 4. Redirect về Frontend kèm token
            var frontendUrl = _configuration.GetSection("CORS").Get<string[]>()?.FirstOrDefault();
            return Redirect($"{frontendUrl}/dashboard?token={mySystemToken}");
        }

        [HttpPut("update-user")]
        public async Task<ActionResult<UserAuthGetUserInformation>> UpdateUser([FromForm] UserAuthUpdateDTO updateDto)
        {
            var user = await _unitOfWork.Accounts.GetUserByEmail(updateDto.Email);
            if (user == null)
                return BadRequest("User not found");
            var userUpdated = _mapper.Map<UserAuthUpdateDTO, Models.User>(updateDto, user);

            if (updateDto.Avatar != null)
            {
                // Handle file upload logic here
                // For example, save the file and get the URL
                var photoId = await _ggService.UploadImgAsync(updateDto.Avatar,$"user/{user.FirstName + " " + user.LastName}/avatar","avatar");
                userUpdated.PhotoUrl = $"https://drive.google.com/thumbnail?id={photoId}&sz=w400";
            }
            _unitOfWork.Accounts.Update(user);

            if(!(await _unitOfWork.Complete()))
                return BadRequest("Update failed");

            return Ok(new UserAuthGetUserInformation
            {
                Token = await _tokenService.CreateToken(userUpdated),
                Email = userUpdated.Email,
                FullName = $"{userUpdated.FirstName} {userUpdated.LastName}",
                PhotoUrl = userUpdated.PhotoUrl,
                PhoneNumber = userUpdated.PhoneNumber ?? string.Empty
            });


        }

        [HttpPost("change-password")]
        public async Task<ActionResult> ChangePassword([FromBody] UserAuthLoginDTO changePasswordDto)
        {
            var user = await _unitOfWork.Accounts.GetUserByEmail(changePasswordDto.Email);
            if (user == null)
                return BadRequest("User not found");
            user.PasswordHash = await _hasherPasswordService.HashPassword(changePasswordDto.Password);

            _unitOfWork.Accounts.Update(user);
            if (await _unitOfWork.Complete())
                return Ok(new { message = "Password changed successfully" });

            return BadRequest(new { message = "Change password failed" });
        }

    }
}
