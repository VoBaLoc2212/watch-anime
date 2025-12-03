using backend.DTOs;
using backend.Helpers;
using backend.Interface;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace backend.Services
{
    public class GoogleDriveService : IGoogleDriveService
    {
        private readonly GoogleDriveConfig _config;
        private readonly DriveService _driveService;

        public GoogleDriveService(IOptions<GoogleDriveConfig> config)
        {
            _config = config.Value;

            // Validate configuration
            if (string.IsNullOrEmpty(_config.FolderId) || _config.FolderId == "YOUR_FOLDER_ID")
            {
                throw new InvalidOperationException("Google Drive FolderId is not configured properly. Please set a valid folder ID in appsettings.json");
            }

            // 1. Chuyển service-account object thành JSON string
            string json = JsonSerializer.Serialize(_config.ServiceAccount);

            // 2. Dùng CredentialFactory
            var factory = new ServiceAccountCredential.Initializer(
                ((ServiceAccountConfig)_config.ServiceAccount).client_email
            )
            {
                Scopes = new[] { DriveService.Scope.Drive }
            };

            // 3. Khởi tạo ServiceAccountCredential từ private_key
            var saCredential = new ServiceAccountCredential(factory.FromPrivateKey(
                ((ServiceAccountConfig)_config.ServiceAccount).private_key
            ));

            // 4. Tạo DriveService
            _driveService = new DriveService(new BaseClientService.Initializer
            {
                HttpClientInitializer = saCredential,
                ApplicationName = _config.ApplicationName
            });
        }

        public async Task<string> UploadFileAsync(IFormFile file)
        {
            var driveFile = new Google.Apis.Drive.v3.Data.File()
            {
                Name = file.FileName,
                Parents = new List<string> { _config.FolderId }
            };

            using var stream = file.OpenReadStream();
            var request = _driveService.Files.Create(driveFile, stream, file.ContentType);
            request.Fields = "id";

            await request.UploadAsync();

            return request.ResponseBody.Id;
        }

        public async Task<Stream> GetFileStreamAsync(string fileId, string rangeHeader)
        {
            var url = $"https://drive.google.com/uc?export=download&id={fileId}";
            var client = new HttpClient();

            var req = new HttpRequestMessage(HttpMethod.Get, url);
            if (!string.IsNullOrEmpty(rangeHeader))
                req.Headers.TryAddWithoutValidation("Range", rangeHeader);

            var res = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead);

            res.EnsureSuccessStatusCode();
            return await res.Content.ReadAsStreamAsync();
        }

        public async Task<ICollection<EpisodeDTO>> GetEpisodesFromDrive()
        {
            try
            {
                // First, verify the folder exists and is accessible
                var folderRequest = _driveService.Files.Get(_config.FolderId);
                folderRequest.Fields = "id, name, mimeType";
                var folder = await folderRequest.ExecuteAsync();

                if (folder.MimeType != "application/vnd.google-apps.folder")
                {
                    throw new InvalidOperationException($"The specified ID '{_config.FolderId}' is not a folder.");
                }

                var request = _driveService.Files.List();

                // Chỉ lấy file trong folder mà bạn cấu hình
                request.Q = $"'{_config.FolderId}' in parents and trashed = false";

                // Drive API yêu cầu rõ fields để tối ưu performance
                request.Fields = "files(id, name, mimeType, size, createdTime, modifiedTime, thumbnailLink, videoMediaMetadata)";

                var response = await request.ExecuteAsync();

                return response.Files.Select((file, index) => new EpisodeDTO
                {
                    EpisodeName = file.Name,
                    EpisodeNumber = index + 1,
                    Duration = file.VideoMediaMetadata != null && file.VideoMediaMetadata.DurationMillis.HasValue
                        ? TimeOnly.FromTimeSpan(TimeSpan.FromMilliseconds(file.VideoMediaMetadata.DurationMillis.Value))
                        : TimeOnly.MinValue,
                    VideoUrl = $"https://drive.google.com/uc?export=download&id={file.Id}"
                }).ToList();
            }
            catch (Google.GoogleApiException ex)
            {
                throw new InvalidOperationException($"Google Drive API error: {ex.Message}. Please check if the folder ID '{_config.FolderId}' exists and the service account has access to it.", ex);
            }
        }

        
    }
}
