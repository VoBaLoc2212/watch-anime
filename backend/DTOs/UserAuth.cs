namespace backend.DTOs
{

    public class UserAuthLoginDTO
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
    public class UserAuthRegisterDTO : UserAuthLoginDTO
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
}
