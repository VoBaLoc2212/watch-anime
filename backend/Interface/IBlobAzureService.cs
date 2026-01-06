namespace backend.Interface
{
    public interface IBlobAzureService
    {
        // Hàm upload trả về URL của file
        Task<string> UploadFileAsync(IFormFile file, string containerName);

        // Hàm xóa file (nên có để sau này dọn dẹp)
        Task DeleteBlobAsync(string blobUrl);
        string GetSasToken(string containerName, string fileName);
    }
}
