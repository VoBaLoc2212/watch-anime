using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{

    public class UserAuthLoginDTO
    {
        public string Email { get; set; }
        [Required] public string Password { get; set; }
    }
    public class UserAuthDTO : UserAuthLoginDTO
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
    }

    public class UserAuthResponseDTO
    {
        public string Token { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string PhotoUrl { get; set; }
    }

    public class  UserAuthGetUserInformation : UserAuthResponseDTO
    {
        public string PhoneNumber { get; set; }

    }

    public class UserAuthUpdateDTO
    {
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public IFormFile Avatar { get; set; }
    }
}
