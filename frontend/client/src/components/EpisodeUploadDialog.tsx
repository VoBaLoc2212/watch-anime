import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileVideo, CheckCircle2, Loader2 } from "lucide-react";
import { UploadEpisodeChunkApi } from "@/api/EpisodeAPI";

interface EpisodeUploadDialogProps {
  open: boolean;
  onClose: () => void;
  animeSlug: string;
  animeName: string;
  onUploadSuccess?: () => void;
}

const CHUNK_SIZE = 10 * 1024 * 1024; // 100MB per chunk

type UploadState = 'idle' | 'uploading' | 'processing' | 'completed';

export default function EpisodeUploadDialog({ open, onClose, animeSlug, animeName, onUploadSuccess }: EpisodeUploadDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [episodeNumber, setEpisodeNumber] = useState<string>("");
  const [episodeName, setEpisodeName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadId, setUploadId] = useState<string>("");

  // Convert seconds to TimeOnly format (HH:mm:ss)
  const formatDurationForBackend = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5GB for example)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Video file must be less than 5GB",
        variant: "destructive",
      });
      return;
    }

    // Extract video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      setVideoDuration(Math.round(video.duration));
    };
    video.src = URL.createObjectURL(file);

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a video file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!episodeNumber || parseInt(episodeNumber) <= 0) {
      toast({
        title: "Invalid episode number",
        description: "Please enter a valid episode number",
        variant: "destructive",
      });
      return;
    }

    if (!episodeName.trim()) {
      toast({
        title: "Missing episode name",
        description: "Please enter an episode name",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadState('uploading');
      setUploadProgress(0);
      
      // Generate unique upload ID
      const newUploadId = `${animeSlug}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setUploadId(newUploadId);

      const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
      const fileName = selectedFile.name;

      // Upload chunks sequentially
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, selectedFile.size);
        const chunkBlob = selectedFile.slice(start, end);

        const formData = new FormData();
        formData.append('fileChunk', chunkBlob);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileName', fileName);
        formData.append('uploadId', newUploadId);
        formData.append('animeSlug', animeSlug);
        formData.append('episodeNumber', episodeNumber);
        formData.append('episodeName', episodeName);
        formData.append('duration', formatDurationForBackend(videoDuration));

        // Upload this chunk
        const response = await UploadEpisodeChunkApi(formData);

        // Update progress
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setUploadProgress(progress);
        
        // Check if this is the last chunk and upload is completed
        if (chunkIndex === totalChunks - 1 && response.isCompleted) {
          // All chunks uploaded successfully
          setUploadState('processing');
          
          toast({
            title: "Upload completed",
            description: response.message || "Video is now being processed on the server. This may take several minutes.",
          });

          // Wait 3 seconds before closing to show the message
          setTimeout(() => {
            setUploadState('completed');
            resetDialog();
            onClose();
            
            // Call the success callback to refresh episodes list
            if (onUploadSuccess) {
              onUploadSuccess();
            }
            
            toast({
              title: "Processing started",
              description: "You can leave this page. The episode will be available once processing is complete.",
            });
          }, 3000);
        }
      }

    } catch (error) {
      console.error("Upload error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to upload video";
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setUploadState('idle');
      setUploadProgress(0);
    }
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setEpisodeNumber("");
    setEpisodeName("");
    setVideoDuration(0);
    setUploadProgress(0);
    setUploadState('idle');
    setUploadId("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (uploadState === 'uploading' || uploadState === 'processing') {
      const confirmClose = window.confirm(
        "Upload is in progress. Are you sure you want to close? This will cancel the upload."
      );
      if (!confirmClose) return;
    }
    
    resetDialog();
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Episode</DialogTitle>
          <DialogDescription>
            Add a new episode for {animeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Episode Number */}
          <div className="space-y-2">
            <Label htmlFor="episode-number">Episode Number *</Label>
            <Input
              id="episode-number"
              type="number"
              min="1"
              placeholder="1"
              value={episodeNumber}
              onChange={(e) => setEpisodeNumber(e.target.value)}
              disabled={uploadState !== 'idle'}
            />
          </div>

          {/* Episode Name */}
          <div className="space-y-2">
            <Label htmlFor="episode-name">Episode Name *</Label>
            <Input
              id="episode-name"
              type="text"
              placeholder="Enter episode name"
              value={episodeName}
              onChange={(e) => setEpisodeName(e.target.value)}
              disabled={uploadState !== 'idle'}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="video-file">Video File *</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploadState !== 'idle'}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadState !== 'idle'}
              >
                <Upload className="h-4 w-4 mr-2" />
                {selectedFile ? "Change Video" : "Select Video"}
              </Button>
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <FileVideo className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadState !== 'idle' && (
            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {uploadState === 'uploading' && 'Đang tải lên máy chủ...'}
                    {uploadState === 'processing' && 'Tải lên hoàn tất'}
                    {uploadState === 'completed' && 'Hoàn tất'}
                  </span>
                  <span className="text-muted-foreground">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>

              {uploadState === 'uploading' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading chunks... Please wait</span>
                </div>
              )}

              {uploadState === 'processing' && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Hệ thống đang xử lý chuẩn hóa video
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      Quá trình này có thể mất vài phút. Bạn có thể rời khỏi trang này.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploadState === 'uploading' || uploadState === 'processing'}
          >
            {uploadState === 'idle' ? 'Cancel' : 'Close'}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadState !== 'idle'}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Episode
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
