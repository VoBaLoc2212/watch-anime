using backend.DTOs;
using backend.Helpers;
using backend.Interface; // Giả sử bạn có interface này
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using Microsoft.Extensions.Options;

namespace backend.Services
{
    public class GoogleDriveService : IGoogleDriveService
    {
        private readonly GoogleDriveConfig _config;

        public GoogleDriveService(IOptions<GoogleDriveConfig> config)
        {
            _config = config.Value;
        }

        private UserCredential GetUserCredential()
        {
            var clientSecrets = new ClientSecrets
            {
                ClientId = _config.OAuth2.ClientId,
                ClientSecret = _config.OAuth2.ClientSecret
            };


            var tokenResponse = new TokenResponse
            {
                RefreshToken = _config.OAuth2.RefreshToken
            };


            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = clientSecrets,
                Scopes = new[] { DriveService.Scope.Drive },
                DataStore = null
            });

            return new UserCredential(flow, "user", tokenResponse);
        }

        public DriveService GetDriveService()
        {
            var credential = GetUserCredential();

            return new DriveService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential,
                ApplicationName = _config.ApplicationName
            });
        }

        public async Task<string> UploadFileAsync(IFormFile file)
        {
            var service = GetDriveService();

            var driveFile = new Google.Apis.Drive.v3.Data.File()
            {
                Name = file.FileName,

                Parents = string.IsNullOrEmpty(_config.FolderId) ? null : new List<string> { _config.FolderId }
            };

            using var stream = file.OpenReadStream();

            var request = service.Files.Create(driveFile, stream, file.ContentType);
            request.Fields = "id";

            var response = await request.UploadAsync();

            if (response.Status != Google.Apis.Upload.UploadStatus.Completed)
            {
                throw new Exception($"Upload failed: {response.Exception?.Message}");
            }

            return request.ResponseBody?.Id!;
        }

        public async Task<Stream> GetFileStreamAsync(string fileId, string rangeHeader = null)
        {
            var service = GetDriveService();
            var request = service.Files.Get(fileId);

            var stream = new MemoryStream();

            // Download file vào MemoryStream
            await request.DownloadAsync(stream);
            stream.Position = 0;

            return stream;
        }

        public async Task<ICollection<EpisodeGetDTO>> GetEpisodesFromDrive()
        {
            var service = GetDriveService();
            var request = service.Files.List();

            request.Q = $"'{_config.FolderId}' in parents and mimeType contains 'video/'";

            request.Fields = "files(id, name, videoMediaMetadata)";

            var result = await request.ExecuteAsync();

            var episodes = result.Files.Select((file, index) =>
            {
                long durationMs = file.VideoMediaMetadata?.DurationMillis ?? 0;

                var timeSpan = TimeSpan.FromMilliseconds(durationMs);

                return new EpisodeGetDTO
                {
                    EpisodeName = file.Name,
                    EpisodeNumber = index + 1,

                    Duration = TimeOnly.FromTimeSpan(timeSpan),

                    VideoUrl = $"https://drive.google.com/uc?id={file.Id}&export=download"
                };
            }).ToList();

            return episodes;
        }
    }
}