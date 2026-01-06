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
    private readonly ILogger<BlobAzureService> _logger;

    public BlobAzureService(IOptions<BlobAzureSetting> config, ILogger<BlobAzureService> logger)
    {
        _config = config.Value;
        _blobServiceClient = new BlobServiceClient(_config.ConnectionStringStorage);
        _logger = logger;
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

    /// <summary>
    /// Upload image với path cụ thể (avatar hoặc thumbnail)
    /// Tự động xóa ảnh cũ trước khi upload ảnh mới
    /// </summary>
    /// <param name="file">File ảnh</param>
    /// <param name="containerName">Container name (vd: "media")</param>
    /// <param name="blobPath">Đường dẫn folder (vd: "user/John-Doe-abc123/avatar")</param>
    /// <param name="fileName">Tên file (vd: "avatar")</param>
    /// <returns>URL của ảnh đã upload</returns>
    public async Task<string> UploadImageAsync(IFormFile file, string containerName, string blobPath, string fileName)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

        // Xóa ảnh cũ trước (nếu có)
        await DeleteBlobAsync(containerName, blobPath);

        // Tạo full path: blobPath/fileName.extension
        var extension = Path.GetExtension(file.FileName);
        var fullBlobName = $"{blobPath}/{fileName}{extension}";
        var blobClient = containerClient.GetBlobClient(fullBlobName);

        _logger.LogInformation($"Uploading image to: {fullBlobName}");

        using (var stream = file.OpenReadStream())
        {
            await blobClient.UploadAsync(stream, new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders { ContentType = file.ContentType }
            });
        }

        return blobClient.Uri.ToString();
    }

    /// <summary>
    /// Xóa tất cả file trong một folder (blobPath)
    /// </summary>
    public async Task<bool> DeleteBlobAsync(string containerName, string blobPath)
    {
        try
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            
            // List tất cả blob trong folder
            await foreach (var blobItem in containerClient.GetBlobsAsync(prefix: blobPath))
            {
                var blobClient = containerClient.GetBlobClient(blobItem.Name);
                await blobClient.DeleteIfExistsAsync();
                _logger.LogInformation($"Deleted blob: {blobItem.Name}");
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error deleting blobs in path {blobPath}: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Xóa blob theo URL
    /// </summary>
    public async Task DeleteBlobByUrlAsync(string blobUrl)
    {
        try
        {
            // Parse URL để lấy container và blob name
            var uri = new Uri(blobUrl);
            var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            
            if (segments.Length < 2) return;

            var containerName = segments[0];
            var blobName = string.Join("/", segments.Skip(1));

            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = containerClient.GetBlobClient(blobName);

            await blobClient.DeleteIfExistsAsync();
            _logger.LogInformation($"Deleted blob: {blobUrl}");
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error deleting blob by URL {blobUrl}: {ex.Message}");
        }
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