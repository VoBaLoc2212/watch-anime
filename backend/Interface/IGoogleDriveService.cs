using backend.DTOs;

namespace backend.Interface
{
    public interface IGoogleDriveService
    {
        Task<string> UploadFileAsync(IFormFile file);
        Task<Stream> GetFileStreamAsync(string fileId, string rangeHeader);
        Task<ICollection<EpisodeDTO>> GetEpisodesFromDrive();
    }
}
