using backend.Interface;
using FFMpegCore;
using FFMpegCore.Enums;

namespace backend.Services
{
    public class VideoService : IVideoService
    {
        public async Task<bool> CompressAndConvertToMp4Async(string inputPath, string outputPath)
        {
            try
            {
                if (!File.Exists(inputPath))
                {
                    Console.WriteLine($"[VideoService] Input file not found: {inputPath}");
                    return false;
                }

                // 1. Phân tích video gốc để lấy chiều rộng/cao
                var mediaAnalysis = await FFProbe.AnalyseAsync(inputPath);
                var videoStream = mediaAnalysis.PrimaryVideoStream;

                if (videoStream == null)
                {
                    Console.WriteLine("[VideoService] Không tìm thấy stream video.");
                    return false;
                }

                int width = videoStream.Width;
                int height = videoStream.Height;

                // FIX Error: Đảm bảo width/height là số chẵn (FFmpeg yêu cầu yuv420p phải chia hết cho 2)
                if (width % 2 != 0) width++;
                if (height % 2 != 0) height++;

                Console.WriteLine($"[VideoService] Detected Resolution: {width}x{height}");

                // 2. Thực hiện Convert
                await FFMpegArguments
                    .FromFileInput(inputPath)
                    .OutputToFile(outputPath, true, options => options
                        .WithVideoCodec(VideoCodec.LibX264)
                        .WithConstantRateFactor(28)
                        .WithAudioCodec(AudioCodec.Aac)
                        .WithAudioBitrate(128)
                        .WithSpeedPreset(Speed.VeryFast)

                        // QUAN TRỌNG: Gán cứng kích thước để tránh Error 1920x0
                        .Resize(width, height)

                        .ForceFormat("mp4")
                    )
                    .ProcessAsynchronously();

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VideoService Error] {ex.Message}");
                // Log inner exception để thấy rõ lệnh ffmpeg bị sai chỗ nào nếu có
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[Inner Error] {ex.InnerException.Message}");
                }
                return false;
            }
        }
    }
}
