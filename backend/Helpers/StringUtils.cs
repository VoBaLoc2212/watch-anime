using System.Text.RegularExpressions;
using System.Text;

public static class StringUtils
{
    public static string GenerateSlug(string phrase)
    {
        string str = phrase.ToLower();

        // Thay thế tiếng Việt có dấu thành không dấu (nếu cần)
        // (Bạn có thể tìm code convert Tiếng Việt full trên mạng, đây là demo cơ bản)

        // Xóa ký tự đặc biệt không hợp lệ
        str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
        // Chuyển nhiều khoảng trắng thành 1 khoảng trắng
        str = Regex.Replace(str, @"\s+", " ").Trim();
        // Cắt khoảng trắng đi và thay bằng dấu gạch ngang
        str = str.Substring(0, str.Length <= 45 ? str.Length : 45).Trim();
        str = Regex.Replace(str, @"\s", "-");

        return str;
    }
}