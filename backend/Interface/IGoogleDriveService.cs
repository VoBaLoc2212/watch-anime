using backend.DTOs;
using Google.Apis.Drive.v3;
using Microsoft.AspNetCore.Http;

namespace backend.Interface
{
    public interface IGoogleDriveService
    {
        Task<string> UploadImgAsync(IFormFile file, string folderPath, string customName);
        Task<Stream> GetFileStreamAsync(string fileId, string rangeHeader = null);
        DriveService GetDriveService();
        Task<ICollection<EpisodeGetDTO>> GetEpisodesFromDrive();
        Task<string> UploadAnimeAsync(IFormFile file, string folderPath, string customName);
    }
}
