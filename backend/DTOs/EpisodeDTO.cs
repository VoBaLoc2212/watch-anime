using backend.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace backend.DTOs
{
    public class EpisodeDTO
    {
        public string EpisodeName { get; set; }
        public int EpisodeNumber { get; set; }
        [ModelBinder(typeof(TimeOnlyModelBinder))]
        public TimeOnly Duration { get; set; }

    }


    public class EpisodeUploadDTO : EpisodeDTO
    {
        public string AnimeSlug { get; set; }
        public IFormFile FileChunk { get; set; } // Dữ liệu của chunk hiện tại
        public int ChunkIndex { get; set; }      // Số thứ tự của chunk (0, 1, 2...)
        public int TotalChunks { get; set; }     // Tổng số lượng chunk
        public string FileName { get; set; }     // Tên file gốc (VD: ep1.mp4)
        public string UploadId { get; set; }     // ID duy nhất cho phiên upload này (để tránh trùng tên file giữa các user)
    }

    public class EpisodeGetDTO : EpisodeDTO
    {
        public string VideoUrl { get; set; }
    }


}
