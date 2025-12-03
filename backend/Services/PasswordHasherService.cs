using backend.Interface;
using Konscious.Security.Cryptography;
using System.Security.Cryptography;
using System.Text;

namespace backend.Services
{
    public class PasswordHasherService : IPasswordHasherService
    {
        public async Task<string> HashPassword(string password)
        {
            byte[] salt = RandomNumberGenerator.GetBytes(16);

            var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
            {
                Salt = salt,
                DegreeOfParallelism = 2, // số luồng
                Iterations = 3,          // time cost
                MemorySize = 65536       // 64 MB
            };

            byte[] hash = argon2.GetBytes(32); // 256-bit


            return await Task.FromResult($"ARGON2id${argon2.DegreeOfParallelism}${argon2.Iterations}${argon2.MemorySize}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}");
        }

        public async Task<bool> VerifyPassword(string stored, string password)
        {
            var parts = stored.Split('$');
            if (parts.Length != 6 || !parts[0].StartsWith("ARGON2")) return false;
            int p = int.Parse(parts[1]);
            int it = int.Parse(parts[2]);
            int mem = int.Parse(parts[3]);
            byte[] salt = Convert.FromBase64String(parts[4]);
            byte[] hash = Convert.FromBase64String(parts[5]);

            var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
            {
                Salt = salt,
                DegreeOfParallelism = p,
                Iterations = it,
                MemorySize = mem
            };

            byte[] computed = argon2.GetBytes(hash.Length);
            return await Task.FromResult(CryptographicOperations.FixedTimeEquals(hash, computed));
        }
    }
}
