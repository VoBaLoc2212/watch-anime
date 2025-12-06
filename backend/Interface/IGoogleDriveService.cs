using backend.DTOs;
using Google.Apis.Drive.v3;
using Microsoft.AspNetCore.Http;

namespace backend.Interface
{
    public interface IGoogleDriveService
    {
        Task<string> UploadFileAsync(IFormFile file);
        Task<Stream> GetFileStreamAsync(string fileId, string rangeHeader = null);
        DriveService GetDriveService();
        Task<ICollection<EpisodeGetDTO>> GetEpisodesFromDrive();
    }
}
