namespace backend.Interface
{
    public interface IBlobAzureService
    {
        // Hàm upload trả về URL của file
        Task<string> UploadFileAsync(IFormFile file, string containerName);

        // Upload image với path cụ thể (cho avatar và thumbnail)
        Task<string> UploadImageAsync(IFormFile file, string containerName, string blobPath, string fileName);

        // Xóa file theo path
        Task<bool> DeleteBlobAsync(string containerName, string blobPath);

        // Xóa file theo URL
        Task DeleteBlobByUrlAsync(string blobUrl);

        string GetSasToken(string containerName, string fileName);
    }
}
