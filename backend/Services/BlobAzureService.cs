using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using backend.Helpers;
using backend.Interface;
using Microsoft.Extensions.Options;

public class BlobAzureService: IBlobAzureService
{
    private readonly BlobAzureSetting _config;
    private readonly BlobServiceClient _blobServiceClient;

    public BlobAzureService(IOptions<BlobAzureSetting> config)
    {
        _config = config.Value;
        _blobServiceClient = new BlobServiceClient(_config.ConnectionStringStorage);
    }

    public async Task<string> UploadFileAsync(IFormFile file, string containerName)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);

        // Tên file duy nhất
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var blobClient = containerClient.GetBlobClient(fileName);

        // QUAN TRỌNG: Mở Stream và đẩy thẳng lên Azure (Stream-to-Stream)
        // Không copy vào MemoryStream (RAM) của server
        using (var stream = file.OpenReadStream())
        {
            // Azure SDK tự động handle việc chia nhỏ packet khi stream lớn
            await blobClient.UploadAsync(stream, new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders { ContentType = file.ContentType }
            });
        }

        return blobClient.Uri.ToString();
    }

    public async Task DeleteBlobAsync(string blobUrl)
    {
        // Logic xóa file (để dành làm sau cũng được)
        // Cần tách tên file từ URL để xóa
    }

    public string GetSasToken(string containerName, string fileName)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = containerClient.GetBlobClient(fileName);

        // Định nghĩa quyền hạn của cái vé (Token)
        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = containerName,
            BlobName = fileName,
            Resource = "b", // b = Blob
            StartsOn = DateTimeOffset.UtcNow,
            ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(10) // Vé chỉ có tác dụng 10 phút
        };

        // Cho phép quyền Ghi (Write) và Tạo (Create)
        sasBuilder.SetPermissions(BlobSasPermissions.Write | BlobSasPermissions.Create);

        // Ký tên vào vé (Dùng Key bí mật của Server để ký)
        var sasToken = blobClient.GenerateSasUri(sasBuilder);

        return sasToken.ToString(); // Trả về Full URL có kèm token
    }
}