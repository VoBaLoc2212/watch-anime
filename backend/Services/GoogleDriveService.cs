using backend.DTOs;
using backend.Helpers;
using backend.Interface; // Giả sử bạn có interface này
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Google.Apis.Upload;
using Google.Apis.Util.Store;
using Microsoft.Extensions.Options;
using System.Security.AccessControl;

namespace backend.Services
{
    public class GoogleDriveService : IGoogleDriveService
    {
        private readonly GoogleDriveConfig _config;

        public GoogleDriveService(IOptions<GoogleDriveConfig> config)
        {
            _config = config.Value;
        }

        public string GetCloudflareWorkerUrl
        {
            get => _config.CloudflareWorker;
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

        public async Task<string> GetOrCreateFolderAsync(string folderName, string parentId = null)
        {
            var service = GetDriveService();

            var query = $"mimeType = 'application/vnd.google-apps.folder' and name = '{folderName}' and trashed = false";

            if (!string.IsNullOrEmpty(parentId))
            {
                query += $" and '{parentId}' in parents";
            }

            var listRequest = service.Files.List();
            listRequest.Q = query;
            listRequest.Fields = "files(id, name)";
            listRequest.PageSize = 1;

            var listResponse = await listRequest.ExecuteAsync();
            var existingFolder = listResponse.Files.FirstOrDefault();

            if (existingFolder != null)
            {
                return existingFolder.Id;
            }

            var folderMetadata = new Google.Apis.Drive.v3.Data.File()
            {
                Name = folderName,
                MimeType = "application/vnd.google-apps.folder" 
            };

            if (!string.IsNullOrEmpty(parentId))
            {
                folderMetadata.Parents = new List<string> { parentId };
            }

            var createRequest = service.Files.Create(folderMetadata);
            createRequest.Fields = "id";

            var folder = await createRequest.ExecuteAsync();
            return folder.Id;
        }

        public async Task<string> CreateFolderStructureAsync(string path, string rootParentId = null)
        {
            var folderNames = path.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);

            string currentParentId = rootParentId;

            foreach (var folderName in folderNames)
            {
                currentParentId = await GetOrCreateFolderAsync(folderName, currentParentId);
            }

            return currentParentId;
        }


        public async Task<string> UploadImgAsync(IFormFile file, string folderPath, string customName)
        {

            string targetFolderId = await CreateFolderStructureAsync(folderPath, _config.FolderId);

            var service = GetDriveService();

            var listRequest = service.Files.List();
            listRequest.Q = $"'{targetFolderId}' in parents and name contains '{customName}' and trashed = false";
            listRequest.Fields = "files(id)";
            var existingFiles = await listRequest.ExecuteAsync();

            if (existingFiles.Files != null && existingFiles.Files.Count > 0)
            {
                foreach (var oldFile in existingFiles.Files)
                {
                    try
                    {
                        await service.Files.Delete(oldFile.Id).ExecuteAsync();
                    }
                    catch
                    {
                        // Có thể log lỗi xóa nhưng không nên chặn quy trình upload
                    }
                }
            }

            string fileExtension = Path.GetExtension(file.FileName);
            string finalName = customName;

            // Nếu tên mới chưa có đuôi, thì ghép đuôi của file gốc vào
            if (!finalName.EndsWith(fileExtension, StringComparison.OrdinalIgnoreCase))
            {
                finalName += fileExtension;
            }

            var driveFile = new Google.Apis.Drive.v3.Data.File()
            {
                Name = finalName,
                Parents = new List<string> { targetFolderId }
            };

            using var stream = file.OpenReadStream();
            var request = service.Files.Create(driveFile, stream, file.ContentType);
            request.Fields = "id";

            var response = await request.UploadAsync();

            if (response.Status != Google.Apis.Upload.UploadStatus.Completed)
                throw new Exception("Upload failed");

            var permission = new Google.Apis.Drive.v3.Data.Permission()
            {
                Type = "anyone", // Hoặc "user" nếu muốn share cho email cụ thể
                Role = "reader"  // Chỉ được xem
            };
            var permissionRequest = service.Permissions.Create(permission, request.ResponseBody.Id);
            await permissionRequest.ExecuteAsync();

            return request.ResponseBody.Id;
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

        private async Task<string?> FindIdAsync(string name, string parentId, bool isFolder = false)
        {
            var service = GetDriveService();

            // Tạo câu truy vấn
            var query = $"name = '{name}' and trashed = false";

            // Nếu có parentId, tìm trong folder đó. Nếu không, tìm trong Root hoặc folder config
            if (!string.IsNullOrEmpty(parentId))
            {
                query += $" and '{parentId}' in parents";
            }

            if (isFolder)
            {
                query += " and mimeType = 'application/vnd.google-apps.folder'";
            }

            var request = service.Files.List();
            request.Q = query;
            request.Fields = "files(id)";
            request.PageSize = 1; // Chỉ lấy 1 kết quả đầu tiên tìm thấy

            var result = await request.ExecuteAsync();
            return result.Files.FirstOrDefault()?.Id;
        }

        public async Task<bool> DeleteFileByPathAsync(string fullPath)
        {
            var service = GetDriveService();

            // Ví dụ input: "user/avatar/EMP001/image.jpg"

            // 1. Tách chuỗi
            // folderNames = ["user", "avatar", "EMP001"]
            // fileName = "image.jpg"
            var parts = fullPath.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);

            if (parts.Length == 0) return false;

            string fileName = parts.Last();
            var folderNames = parts.Take(parts.Length - 1);

            // Bắt đầu từ Root folder (hoặc folder cấu hình của bạn)
            string currentParentId = _config.FolderId;

            // 2. Dò tìm folder cha cuối cùng
            foreach (var folder in folderNames)
            {
                currentParentId = await FindIdAsync(folder, currentParentId, isFolder: true);

                // Nếu đứt đoạn (không tìm thấy folder cha), tức là đường dẫn sai -> Dừng lại
                if (currentParentId == null) return false;
            }

            // 3. Tìm ID của file trong folder cha cuối cùng
            string fileId = await FindIdAsync(fileName, currentParentId, isFolder: false);

            if (fileId == null)
            {
                // Không tìm thấy file
                return false;
            }

            // 4. Thực hiện Xóa
            try
            {
                // Lệnh này xóa vĩnh viễn (không vào thùng rác)
                await service.Files.Delete(fileId).ExecuteAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<string> UploadStreamAsync(Stream stream, string folderPath, string customFileName, string contentType = "video/mp4")
        {
            // 1. Đảm bảo Stream ở vị trí đầu tiên
            if (stream.CanSeek)
            {
                stream.Position = 0;
            }

            // --- LOGIC MỚI: Xử lý tên file ---
            string finalName = customFileName;

            // Nếu contentType là video/mp4 mà tên chưa có đuôi .mp4 thì tự thêm vào
            if (contentType == "video/mp4" && !finalName.EndsWith(".mp4", StringComparison.OrdinalIgnoreCase))
            {
                finalName += ".mp4";
            }
            // --------------------------------

            // 2. Tạo/Lấy folder đích
            string targetFolderId = await CreateFolderStructureAsync(folderPath, _config.FolderId);

            // 3. Chuẩn bị Metadata
            var service = GetDriveService();
            var driveFile = new Google.Apis.Drive.v3.Data.File()
            {
                Name = finalName, // Sử dụng tên đã xử lý
                Parents = new List<string> { targetFolderId }
            };

            // 4. Tạo request upload
            var uploadRequest = service.Files.Create(driveFile, stream, contentType);
            uploadRequest.ChunkSize = FilesResource.CreateMediaUpload.MinimumChunkSize * 40; // 10MB chunk

            uploadRequest.ProgressChanged += (IUploadProgress progress) =>
            {
                switch (progress.Status)
                {
                    case UploadStatus.Uploading:
                        // Log ra tên file mới để dễ theo dõi
                        Console.WriteLine($"[Drive Upload] {finalName}: {progress.BytesSent} bytes sent.");
                        break;
                    case UploadStatus.Completed:
                        Console.WriteLine($"[Drive Upload] {finalName}: Hoàn tất!");
                        break;
                    case UploadStatus.Failed:
                        Console.WriteLine($"[Drive Upload] {finalName} Lỗi: {progress.Exception}");
                        break;
                }
            };

            // 5. Thực hiện Upload
            var uploadResult = await uploadRequest.UploadAsync();

            if (uploadResult.Status != UploadStatus.Completed)
            {
                throw new Exception($"Upload to Drive failed: {uploadResult.Exception?.Message}");
            }

            // 6. Cấp quyền
            var permission = new Google.Apis.Drive.v3.Data.Permission()
            {
                Type = "anyone",
                Role = "reader"
            };
            await service.Permissions.Create(permission, uploadRequest.ResponseBody.Id).ExecuteAsync();

            return $"{uploadRequest.ResponseBody.Id}";
        }


        public async Task<bool> RenameFolderAsync(string parentPath, string currentFolderName, string newFolderName)
        {
            try
            {
                var service = GetDriveService();

                //Tìm ID của folder cha (ví dụ: "anime")
                // parentPath có thể là "anime" hoặc "root/anime"
                string parentId = _config.FolderId; // Bắt đầu từ Root folder cấu hình

                if (!string.IsNullOrEmpty(parentPath))
                {
                    var folderNames = parentPath.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var name in folderNames)
                    {
                        parentId = await FindIdAsync(name, parentId, isFolder: true);
                        if (parentId == null)
                        {
                            // Không tìm thấy đường dẫn cha
                            return false;
                        }
                    }
                }

                // Tìm ID của Folder cần đổi tên nằm trong parentId
                string folderIdToRename = await FindIdAsync(currentFolderName, parentId, isFolder: true);

                if (folderIdToRename == null)
                {
                    // Không tìm thấy folder cũ để đổi tên
                    return false;
                }

                // Bước 3: Thực hiện đổi tên
                var fileMetadata = new Google.Apis.Drive.v3.Data.File()
                {
                    Name = newFolderName
                };

                var request = service.Files.Update(fileMetadata, folderIdToRename);
                await request.ExecuteAsync();

                return true;
            }
            catch (Exception ex)
            {
                // Log lỗi tại đây nếu cần thiết
                Console.WriteLine($"Lỗi đổi tên folder: {ex.Message}");
                return false;
            }
        }


    }

}