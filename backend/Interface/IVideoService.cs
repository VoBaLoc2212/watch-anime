namespace backend.Interface
{
    public interface IVideoService
    {
        /// <summary>
        /// Nén và convert video sang MP4
        /// </summary>
        /// <param name="inputPath">Đường dẫn file gốc</param>
        /// <param name="outputPath">Đường dẫn file đầu ra mong muốn</param>
        /// <returns>True nếu thành công</returns>
        Task<bool> CompressAndConvertToMp4Async(string inputPath, string outputPath);
    }
}
