using AutoMapper;
using backend.DTOs;
using backend.Interface;
using Microsoft.AspNetCore.Mvc;
using backend.Models;
namespace backend.Controllers
{
    public class AccountController : BaseApiController
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITokenService _tokenService;
        private readonly IMapper _mapper;
        private readonly IPasswordHasherService _hasherPasswordService;

        public AccountController(IUnitOfWork unitOfWork, ITokenService tokenService, IMapper mapper, IPasswordHasherService hasherPasswordService)
        {
            _unitOfWork = unitOfWork;
            _tokenService = tokenService;
            _mapper = mapper;
            _hasherPasswordService = hasherPasswordService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<UserAuthResponseDTO>> Register([FromBody] UserAuthRegisterDTO registerDto)
        {
            if(await _unitOfWork.Accounts.GetUserByEmail(registerDto.Email) != null)
                return BadRequest("Email is already taken");
            var user = _mapper.Map<User>(registerDto);
            user.PasswordHash = await _hasherPasswordService.HashPassword(registerDto.Password);

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
            catch (Exception ex) { 
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
    }
}
