import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle2, XCircle, Pause, Play } from 'lucide-react';
import {
  InitiateChunkedUploadApi,
  UploadChunkApi,
  CompleteChunkedUploadApi,
  CancelUploadApi,
} from '@/api/ChunkedUploadAPI';

interface ChunkedVideoUploadDialogProps {
  open: boolean;
  onClose: () => void;
  animeSlug: string;
  animeName: string;
  onUploadSuccess?: () => void;
}

type UploadStage = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

/**
 * Production-ready chunked video upload component
 * - Uploads large videos (300MB-1GB+) in 5MB chunks
 * - Supports pause/resume
 * - Automatic retry on chunk failure
 * - Progress tracking
 * - Converts to HLS on backend
 */
export default function ChunkedVideoUploadDialog({
  open,
  onClose,
  animeSlug,
  animeName,
  onUploadSuccess,
}: ChunkedVideoUploadDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [episodeNumber, setEpisodeNumber] = useState<string>('');
  const [episodeName, setEpisodeName] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Upload session state
  const [uploadId, setUploadId] = useState<string>('');
  const [currentChunk, setCurrentChunk] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const MAX_RETRIES = 3;

  /**
   * Handle file selection and extract duration
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select a video file',
        variant: 'destructive',
      });
      return;
    }

    // Get video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      setVideoDuration(Math.round(video.duration));
    };
    video.src = URL.createObjectURL(file);

    setSelectedFile(file);
    setUploadProgress(0);
    setCurrentChunk(0);
  };

  /**
   * Format duration as HH:mm:ss for backend
   */
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Upload single chunk with retry logic
   */
  const uploadChunkWithRetry = async (
    uploadId: string,
    chunkIndex: number,
    chunkBlob: Blob,
    retries = 0
  ): Promise<boolean> => {
    try {
      const response = await UploadChunkApi(uploadId, chunkIndex, chunkBlob);
      return response.success;
    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.log(`Retrying chunk ${chunkIndex}, attempt ${retries + 1}/${MAX_RETRIES}`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retries + 1))); // Exponential backoff
        return uploadChunkWithRetry(uploadId, chunkIndex, chunkBlob, retries + 1);
      }
      throw error;
    }
  };

  /**
   * Main upload function - chunked upload with pause/resume support
   */
  const handleUpload = async () => {
    if (!selectedFile || !episodeNumber || !episodeName || !videoDuration) {
      toast({
        title: 'Missing information',
        description: 'Please fill all fields and select a video',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadStage('uploading');
      setStatusMessage('Initializing upload...');
      abortControllerRef.current = new AbortController();

      // Calculate total chunks
      const fileSize = selectedFile.size;
      const calculatedTotalChunks = Math.ceil(fileSize / CHUNK_SIZE);
      setTotalChunks(calculatedTotalChunks);

      // Step 1: Initiate upload session
      const initResponse = await InitiateChunkedUploadApi({
        fileName: selectedFile.name,
        totalSize: fileSize,
        totalChunks: calculatedTotalChunks,
        animeSlug,
        episodeNumber: parseInt(episodeNumber),
        episodeName,
      });

      const sessionUploadId = initResponse.uploadId;
      setUploadId(sessionUploadId);

      setStatusMessage(`Uploading ${calculatedTotalChunks} chunks...`);

      // Step 2: Upload chunks sequentially
      for (let i = currentChunk; i < calculatedTotalChunks; i++) {
        // Check if paused
        while (isPaused) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);
        const chunkBlob = selectedFile.slice(start, end);

        setStatusMessage(`Uploading chunk ${i + 1}/${calculatedTotalChunks} (${Math.round((end / fileSize) * 100)}%)`);
        setCurrentChunk(i);

        await uploadChunkWithRetry(sessionUploadId, i, chunkBlob);

        const progress = ((i + 1) / calculatedTotalChunks) * 70; // 70% for upload, 30% for processing
        setUploadProgress(Math.round(progress));
      }

      // Step 3: Complete upload and trigger HLS conversion
      setUploadStage('processing');
      setStatusMessage('Processing video on server... This may take several minutes. You will receive a notification when completed.');
      setUploadProgress(75);

      const completeResponse = await CompleteChunkedUploadApi(sessionUploadId, formatDuration(videoDuration));

      setUploadProgress(100);
      setUploadStage('completed');
      setStatusMessage('Upload completed! Video is being processed. Check notifications for updates.');

      toast({
        title: 'Upload Completed',
        description: 'Video is being processed. You will receive a notification when ready.',
      });

      // Cleanup and notify parent
      setTimeout(() => {
        resetForm();
        onUploadSuccess?.();
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadStage('error');
      setStatusMessage('Upload failed');

      toast({
        title: 'Upload failed',
        description: error.message || 'An error occurred during upload',
        variant: 'destructive',
      });
    }
  };

  /**
   * Pause upload
   */
  const handlePause = () => {
    setIsPaused(true);
    setStatusMessage('Upload paused');
  };

  /**
   * Resume upload
   */
  const handleResume = () => {
    setIsPaused(false);
    setStatusMessage('Resuming upload...');
  };

  /**
   * Cancel upload
   */
  const handleCancel = async () => {
    abortControllerRef.current?.abort();

    if (uploadId) {
      try {
        await CancelUploadApi(uploadId);
      } catch (error) {
        console.error('Failed to cancel upload:', error);
      }
    }

    resetForm();
    onClose();
  };

  /**
   * Reset form state
   */
  const resetForm = () => {
    setEpisodeNumber('');
    setEpisodeName('');
    setSelectedFile(null);
    setVideoDuration(0);
    setUploadStage('idle');
    setUploadProgress(0);
    setStatusMessage('');
    setIsPaused(false);
    setUploadId('');
    setCurrentChunk(0);
    setTotalChunks(0);
    abortControllerRef.current = null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && uploadStage === 'idle' && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Episode (Production - Chunked HLS)</DialogTitle>
          <DialogDescription>{animeName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Episode Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Episode Number *</Label>
              <Input
                type="number"
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(e.target.value)}
                disabled={uploadStage !== 'idle'}
              />
            </div>
            <div className="space-y-2">
              <Label>Episode Name *</Label>
              <Input
                value={episodeName}
                onChange={(e) => setEpisodeName(e.target.value)}
                disabled={uploadStage !== 'idle'}
              />
            </div>
          </div>

          {/* File Selection */}
          <div className="space-y-2">
            <Label>Video File *</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploadStage !== 'idle'}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadStage !== 'idle'}
            >
              <Upload className="h-4 w-4 mr-2" />
              {selectedFile ? 'Change Video' : 'Select Video'}
            </Button>

            {selectedFile && (
              <div className="p-3 bg-muted rounded-md space-y-1">
                <div className="text-sm font-medium">{selectedFile.name}</div>
                <div className="text-xs text-muted-foreground">
                  Size: {formatFileSize(selectedFile.size)} | Duration: {Math.floor(videoDuration / 60)}:
                  {(videoDuration % 60).toString().padStart(2, '0')}
                </div>
              </div>
            )}
          </div>

          {/* Progress Display */}
          {uploadStage !== 'idle' && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{statusMessage}</div>
                  {uploadStage === 'uploading' && totalChunks > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Chunk {currentChunk + 1} of {totalChunks}
                    </div>
                  )}
                </div>
                <div className="text-2xl font-bold">{uploadProgress}%</div>
              </div>

              <Progress value={uploadProgress} className="h-2" />

              {/* Stage indicator */}
              <div className="flex items-center gap-2 text-xs">
                {uploadStage === 'uploading' && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                )}
                {uploadStage === 'processing' && (
                  <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
                )}
                {uploadStage === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                {uploadStage === 'error' && <XCircle className="h-3 w-3 text-red-500" />}
                <span className="capitalize">{uploadStage}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          {uploadStage === 'idle' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || !episodeNumber || !episodeName}>
                Start Upload
              </Button>
            </>
          )}

          {uploadStage === 'uploading' && !isPaused && (
            <>
              <Button variant="outline" onClick={handlePause}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button variant="destructive" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          )}

          {uploadStage === 'uploading' && isPaused && (
            <>
              <Button onClick={handleResume}>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
              <Button variant="destructive" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          )}

          {uploadStage === 'processing' && (
            <Button disabled>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </Button>
          )}

          {(uploadStage === 'completed' || uploadStage === 'error') && (
            <Button onClick={() => resetForm()}>Close</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
