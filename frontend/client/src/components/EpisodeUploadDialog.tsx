import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileVideo, CheckCircle2, Loader2, X } from "lucide-react";
import { GetSASTokenForEpisodeUploadApi, CreateEpisodeApi } from "@/api/EpisodeAPI";
import { BlockBlobClient } from "@azure/storage-blob";

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
  
  const [episodeNumber, setEpisodeNumber] = useState<string>("");
  const [episodeName, setEpisodeName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0);

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

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(previewUrl);

    // Extract video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      setVideoDuration(Math.round(video.duration));
    };
    video.src = previewUrl;

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

      // Step 1: Get SAS Token from backend
      const { uploadUrl, fileName } = await GetSASTokenForEpisodeUploadApi(selectedFile.name,animeName, episodeNumber);

      // Step 2: Upload directly to Azure Blob with progress tracking
      const blockBlobClient = new BlockBlobClient(uploadUrl);
      
      await blockBlobClient.uploadData(selectedFile, {
        onProgress: (progress) => {
          const percent = Math.round((progress.loadedBytes / selectedFile.size) * 100);
          setUploadProgress(percent);
        },
        blobHTTPHeaders: {
          blobContentType: selectedFile.type
        }
      });

      // Step 3: Create episode metadata in database
      setUploadState('processing');
      await CreateEpisodeApi({
        animeSlug,
        episodeNumber: parseInt(episodeNumber),
        episodeName: episodeName.trim(),
        videoFileName: episodeNumber,
        duration: formatDurationForBackend(videoDuration)
      });

      setUploadState('completed');
      
      toast({
        title: "Upload completed",
        description: "Episode uploaded successfully",
      });

      // Wait a bit before closing
      setTimeout(() => {
        resetDialog();
        onClose();
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }, 1500);

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
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setSelectedFile(null);
    setVideoPreviewUrl("");
    setEpisodeNumber("");
    setEpisodeName("");
    setVideoDuration(0);
    setUploadProgress(0);
    setUploadState('idle');
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

  const removeSelectedFile = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setSelectedFile(null);
    setVideoPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Episode</DialogTitle>
          <DialogDescription>
            Add a new episode for {animeName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left Side - Episode Info */}
          <div className="space-y-4">
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
                  <FileVideo className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  {uploadState === 'idle' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeSelectedFile}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Video Preview & Progress */}
          <div className="space-y-4">
            {/* Video Preview */}
            {selectedFile && videoPreviewUrl && (
              <div className="space-y-2">
                <Label>Video Preview</Label>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoPreviewRef}
                    src={videoPreviewUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploadState !== 'idle' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {uploadState === 'uploading' && 'Đang tải lên...'}
                      {uploadState === 'processing' && 'Đang xử lý...'}
                      {uploadState === 'completed' && 'Hoàn tất!'}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {uploadProgress}%
                    </span>
                  </div>
                  <Progress value={uploadProgress} className="h-3" />
                </div>

                {uploadState === 'uploading' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading to Azure Blob Storage...</span>
                  </div>
                )}

                {uploadState === 'processing' && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                    <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Creating episode metadata...
                      </p>
                    </div>
                  </div>
                )}

                {uploadState === 'completed' && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-md">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-green-900 dark:text-green-100">
                        Upload completed successfully!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Placeholder when no file selected */}
            {!selectedFile && uploadState === 'idle' && (
              <div className="flex items-center justify-center aspect-video bg-muted rounded-lg border-2 border-dashed">
                <div className="text-center p-6">
                  <FileVideo className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Video preview will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
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
            {uploadState === 'idle' && (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Episode
              </>
            )}
            {uploadState === 'uploading' && (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            )}
            {uploadState === 'processing' && (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            )}
            {uploadState === 'completed' && 'Completed'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
