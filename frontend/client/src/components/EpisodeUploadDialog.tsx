import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileVideo, CheckCircle2, Loader2, X } from "lucide-react";
import { GetSASTokenForEpisodeUploadApi, CreateEpisodeApi } from "@/api/EpisodeAPI";
import { BlockBlobClient } from "@azure/storage-blob";
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '@/contexts/FFmpegContext';

interface EpisodeUploadDialogProps {
  open: boolean;
  onClose: () => void;
  animeSlug: string;
  animeName: string;
  onUploadSuccess?: () => void;
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'completed';

export default function EpisodeUploadDialog({ open, onClose, animeSlug, animeName, onUploadSuccess }: EpisodeUploadDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  
  // Sử dụng FFmpeg từ context (đã được pre-load)
  const { ffmpeg, isLoaded: ffmpegLoaded, isLoading: isLoadingFFmpeg } = useFFmpeg();
  
  const [episodeNumber, setEpisodeNumber] = useState<string>("");
  const [episodeName, setEpisodeName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [compressProgress, setCompressProgress] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>('');

  const formatDurationForBackend = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({ title: "Lỗi định dạng", description: "Vui lòng chọn file video", variant: "destructive" });
      return;
    }

    // Giới hạn 2GB để tránh crash trình duyệt (v0.11 chịu tải kém hơn v0.12 một chút)
    if (file.size > 2 * 1024 * 1024 * 1024) {
      toast({ title: "File quá lớn", description: "Vui lòng chọn file dưới 2GB", variant: "destructive" });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(previewUrl);

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      setVideoDuration(Math.round(video.duration));
    };
    video.src = previewUrl;
    setSelectedFile(file);
  };

  const smartProcessVideo = async (file: File): Promise<File> => {
    if (!ffmpeg) {
      toast({
        title: "Lỗi",
        description: "FFmpeg chưa sẵn sàng",
        variant: "destructive",
      });
      return file;
    }

    // Nếu file > 1.5GB, bỏ qua xử lý để an toàn
    if (file.size > 1.5 * 1024 * 1024 * 1024) {
        toast({
            title: "File lớn",
            description: "Sẽ upload file gốc để tránh lỗi bộ nhớ.",
            variant: "default",
        });
        return file;
    }

    setIsCompressing(true);
    setCurrentStep('Đang tối ưu Video & Audio...');
    setCompressProgress(0);

    try {
        const inputName = 'input.mp4';
        const outputName = 'output.mp4';

        // 1. Ghi file vào bộ nhớ ảo (API v0.12.x)
        await ffmpeg.writeFile(inputName, await fetchFile(file));

        // 2. Chạy lệnh (API v0.12.x dùng .exec)
        // Copy video, Convert Audio AAC, Faststart
        await ffmpeg.exec([
            '-i', inputName,
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-movflags', '+faststart',
            outputName
        ]);

        // 3. Đọc file ra (API v0.12.x)
        const data = await ffmpeg.readFile(outputName) as Uint8Array;

        // 4. Dọn dẹp (API v0.12.x)
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

        const processedBlob = new Blob([data.buffer as BlobPart], { type: 'video/mp4' });
        const processedFile = new File([processedBlob], file.name, { type: 'video/mp4' });

        setIsCompressing(false);
        setCompressProgress(100);
        return processedFile;

    } catch (error) {
        console.error("Lỗi xử lý video:", error);
        setIsCompressing(false);
        toast({
            title: "Lỗi xử lý",
            description: "Chuyển sang upload file gốc...",
            variant: "destructive"
        });
        return file;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !episodeNumber || !episodeName) return;

    if (!ffmpegLoaded) {
      toast({
        title: "Đang tải FFmpeg...",
        description: "Vui lòng đợi FFmpeg tải xong (đang tải ở background)",
        variant: "default",
      });
      return;
    }

    try {
      setUploadState('uploading');
      setUploadProgress(0);
      setOverallProgress(0);

      // Step 1: Process video (FFmpeg đã được pre-load)
      setCurrentStep('Đang xử lý video...');
      const processedFile = await smartProcessVideo(selectedFile);

      // Step 2: Get Token
      setCurrentStep('Đang lấy token upload...');
      setOverallProgress(40);
      const { uploadUrl, fileName } = await GetSASTokenForEpisodeUploadApi(
        processedFile.name,
        animeName,
        episodeNumber
      );

      // Step 3: Upload
      setCurrentStep('Đang tải lên Azure...');
      const blockBlobClient = new BlockBlobClient(uploadUrl);
      await blockBlobClient.uploadData(processedFile, {
        onProgress: (progress) => {
          const percent = Math.round((progress.loadedBytes / processedFile.size) * 100);
          setUploadProgress(percent);
          setOverallProgress(40 + Math.round(percent * 0.5));
        },
        blobHTTPHeaders: { blobContentType: 'video/mp4' }
      });

      // Step 5: Metadata
      setUploadState('processing');
      setCurrentStep('Đang lưu thông tin...');
      await CreateEpisodeApi({
        animeSlug,
        episodeNumber: parseInt(episodeNumber),
        episodeName,
        videoFileName: fileName,
        duration: formatDurationForBackend(videoDuration)
      });

      setUploadState('completed');
      setOverallProgress(100);
      setCurrentStep('Hoàn tất!');
      toast({ title: "Thành công", description: "Đã upload tập phim mới!" });

      setTimeout(() => {
        resetDialog();
        onClose();
        onUploadSuccess?.();
      }, 1500);

    } catch (error: any) {
      console.error(error);
      setUploadState('idle');
      toast({ title: "Thất bại", description: error.message || "Lỗi upload", variant: "destructive" });
    }
  };

  const resetDialog = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setSelectedFile(null);
    setVideoPreviewUrl("");
    setEpisodeNumber("");
    setEpisodeName("");
    setUploadState('idle');
    setOverallProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleClose = () => {
    if (uploadState !== 'idle') {
        if (!window.confirm("Đang upload, bạn có chắc muốn hủy?")) return;
    }
    resetDialog();
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Episode</DialogTitle>
          <DialogDescription>Add a new episode for {animeName}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Episode Number *</Label>
              <Input type="number" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)} disabled={uploadState !== 'idle'} />
            </div>
            <div className="space-y-2">
              <Label>Episode Name *</Label>
              <Input value={episodeName} onChange={(e) => setEpisodeName(e.target.value)} disabled={uploadState !== 'idle'} />
            </div>
            <div className="space-y-2">
              <Label>Video File *</Label>
              <div className="flex gap-2">
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} disabled={uploadState !== 'idle'} />
                <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={uploadState !== 'idle'}>
                  <Upload className="h-4 w-4 mr-2" /> {selectedFile ? "Change Video" : "Select Video"}
                </Button>
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <FileVideo className="h-5 w-5" />
                  <div className="flex-1 truncate text-sm">{selectedFile.name} ({formatFileSize(selectedFile.size)})</div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {selectedFile && videoPreviewUrl && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video src={videoPreviewUrl} controls className="w-full h-full object-contain" />
              </div>
            )}

            {/* Hiển thị trạng thái FFmpeg khi chưa load xong */}
            {isLoadingFFmpeg && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang tải FFmpeg... (chỉ lần đầu)</span>
                </div>
                <Progress value={overallProgress} />
              </div>
            )}

            {uploadState !== 'idle' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{currentStep}</span>
                  <span>{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} />
                {isCompressing && <p className="text-xs text-orange-500 animate-pulse">Đang fix lỗi âm thanh (Audio AC3 → AAC)...</p>}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={uploadState !== 'idle'}>Close</Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploadState !== 'idle' || isLoadingFFmpeg}>
                {uploadState === 'idle' ? (isLoadingFFmpeg ? 'Đang tải FFmpeg...' : 'Upload') : <Loader2 className="animate-spin" />}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}