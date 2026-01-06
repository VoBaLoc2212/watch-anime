# Production-Ready HLS Video Streaming System

## Architecture Overview

This system implements a complete video streaming solution using **HLS (HTTP Live Streaming)** with **adaptive bitrate streaming** for optimal user experience across different network conditions and devices.

### Tech Stack
- **Frontend**: React + TypeScript + hls.js
- **Backend**: ASP.NET Core 8.0
- **Video Processing**: FFmpeg
- **Storage**: Azure Blob Storage
- **Streaming Format**: HLS (.m3u8 + .ts segments)

---

## System Flow

### 1. Upload Flow (Frontend → Backend)

```
User selects video (300MB-1GB)
    ↓
Frontend splits into 5MB chunks
    ↓
Upload chunks sequentially with retry logic
    ↓
Backend assembles chunks into single video
    ↓
FFmpeg converts to HLS (3 quality levels)
    ↓
Upload HLS files to Azure Blob Storage
    ↓
Create Episode record with master.m3u8 URL
```

### 2. Playback Flow (User → CDN)

```
User opens episode page
    ↓
HLS player fetches master.m3u8 from Azure Blob
    ↓
Player selects appropriate quality based on bandwidth
    ↓
Stream .ts segments progressively
    ↓
Adaptive quality switching during playback
```

---

## API Endpoints

### ChunkedUpload Controller

#### 1. Initiate Upload
**POST** `/api/ChunkedUpload/initiate-chunked-upload`

Request:
```json
{
  "fileName": "episode1.mp4",
  "totalSize": 524288000,
  "totalChunks": 100,
  "animeSlug": "naruto-shippuden",
  "episodeNumber": 1,
  "episodeName": "Homecoming"
}
```

Response:
```json
{
  "uploadId": "guid-string",
  "chunkSize": 5242880,
  "totalChunks": 100
}
```

#### 2. Upload Chunk
**POST** `/api/ChunkedUpload/upload-chunk`

Form Data:
- `UploadId`: string
- `ChunkIndex`: number
- `ChunkData`: binary file

Response:
```json
{
  "success": true,
  "chunkIndex": 0,
  "message": "Chunk 1/100 uploaded"
}
```

#### 3. Complete Upload
**POST** `/api/ChunkedUpload/complete-chunked-upload`

Request:
```json
{
  "uploadId": "guid-string",
  "duration": "00:24:30"
}
```

Response:
```json
{
  "success": true,
  "message": "Upload and conversion completed successfully",
  "hlsMasterUrl": "https://account.blob.core.windows.net/media/anime/naruto/ep1/master.m3u8",
  "episodeId": 123
}
```

---

## FFmpeg Conversion Details

### Quality Variants

| Variant | Resolution | Video Bitrate | Audio Bitrate | H.264 Profile |
|---------|-----------|---------------|---------------|---------------|
| 360p    | 640x360   | 600kbps       | 96kbps        | baseline      |
| 720p    | 1280x720  | 1800kbps      | 128kbps       | main          |
| 1080p   | 1920x1080 | 3500kbps      | 128kbps       | high          |

### Segment Configuration
- **Segment Duration**: 6 seconds
- **Container**: MPEG-TS (.ts)
- **Video Codec**: H.264 (libx264)
- **Audio Codec**: AAC
- **Pixel Format**: yuv420p (maximum compatibility)
- **Preset**: medium (balanced speed/quality)

### FFmpeg Command Structure
```bash
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]split=3[v1][v2][v3]; \
    [v1]scale=w=640:h=360[v360]; \
    [v2]scale=w=1280:h=720[v720]; \
    [v3]scale=w=1920:h=1080[v1080]" \
  # 360p output
  -map "[v360]" -map 0:a:0 \
  -c:v:0 libx264 -preset medium -crf 23 -maxrate 600k -bufsize 1200k \
  -c:a:0 aac -b:a:0 96k -ar 48000 \
  -pix_fmt yuv420p -profile:v:0 baseline -level 3.0 \
  -hls_time 6 -hls_list_size 0 \
  -hls_segment_filename "v0/seg%03d.ts" \
  -f hls "v0/playlist.m3u8" \
  # ... (similar for 720p and 1080p)
```

---

## Azure Blob Storage Structure

### Directory Layout
```
media/
└── anime/
    └── {anime-slug}/
        └── ep{number}/
            ├── master.m3u8          # Master playlist
            ├── v0/                  # 360p variant
            │   ├── playlist.m3u8
            │   ├── seg000.ts
            │   ├── seg001.ts
            │   └── ...
            ├── v1/                  # 720p variant
            │   ├── playlist.m3u8
            │   └── ...
            └── v2/                  # 1080p variant
                ├── playlist.m3u8
                └── ...
```

### Blob Configuration
- **Container**: `media`
- **Access Level**: Public Blob (read-only)
- **Content-Type**: 
  - `.m3u8` → `application/vnd.apple.mpegurl`
  - `.ts` → `video/mp2t`
- **Cache-Control**: `public, max-age=31536000` (1 year for segments)

---

## Frontend Implementation

### 1. Chunked Upload Component

**File**: `ChunkedVideoUploadDialog.tsx`

Features:
- ✅ 5MB chunk size
- ✅ Sequential upload with retry (3 attempts)
- ✅ Pause/Resume support
- ✅ Progress tracking (chunk-level and overall)
- ✅ Automatic duration extraction
- ✅ Error handling with user feedback

Usage:
```tsx
<ChunkedVideoUploadDialog
  open={isOpen}
  onClose={handleClose}
  animeSlug="naruto-shippuden"
  animeName="Naruto Shippuden"
  onUploadSuccess={handleSuccess}
/>
```

### 2. HLS Video Player

**File**: `HLSVideoPlayer.tsx`

Features:
- ✅ Adaptive bitrate streaming (auto quality selection)
- ✅ Manual quality selection (360p/720p/1080p)
- ✅ Custom controls (play, pause, seek, volume)
- ✅ Fullscreen support
- ✅ Mobile-optimized
- ✅ Safari/iOS native HLS support
- ✅ Other browsers use hls.js

Usage:
```tsx
<HLSVideoPlayer
  src="https://account.blob.core.windows.net/media/anime/naruto/ep1/master.m3u8"
  poster="https://example.com/thumbnail.jpg"
  autoPlay={false}
  className="aspect-video"
/>
```

---

## Deployment Considerations

### 1. Backend Server Requirements
- **CPU**: Multi-core (FFmpeg is CPU-intensive)
- **RAM**: 4GB minimum (8GB+ recommended)
- **Disk**: Fast SSD for temp file storage
- **FFmpeg**: Install via apt/yum/choco
  ```bash
  # Ubuntu/Debian
  sudo apt update
  sudo apt install ffmpeg

  # Windows (Chocolatey)
  choco install ffmpeg
  ```

### 2. Azure Configuration
- **Storage Account**: Standard (HDD) is sufficient for streaming
- **CDN**: Enable Azure CDN for better global performance
- **CORS**: Enable if frontend is on different domain
  ```json
  {
    "CorsRules": [
      {
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposedHeaders": ["*"],
        "MaxAgeInSeconds": 3600
      }
    ]
  }
  ```

### 3. Production Optimizations

#### Backend
- Use **Redis** for upload session storage (replace in-memory dictionary)
- Implement **background jobs** (Hangfire/Azure Functions) for HLS conversion
- Add **webhook** to notify frontend when conversion completes
- Implement **rate limiting** on upload endpoints
- Use **Azure Blob SAS tokens** with short expiration

#### Frontend
- Implement **service worker** for offline caching
- Add **video thumbnail generation** during upload
- Use **IndexedDB** to cache chunks for resume after browser refresh
- Implement **bandwidth estimation** for initial quality selection
- Add **analytics** (watch time, quality switches, buffering events)

#### Infrastructure
- Deploy backend on **multiple instances** with load balancer
- Use **Azure Queue** for upload job processing
- Set up **monitoring** (Application Insights, log aggregation)
- Configure **auto-scaling** based on CPU/upload queue length

---

## Cost Optimization

### Estimated Monthly Costs (100 episodes, 500MB each, 10,000 views)

| Service | Usage | Cost (USD) |
|---------|-------|------------|
| Azure Blob Storage | 150GB (50GB raw + 100GB HLS) | $3.60 |
| Blob Transactions | 1M read operations | $0.44 |
| Bandwidth | 1.5TB egress | $120 |
| Backend VM | Standard_D2s_v3 (2 vCPU) | $70 |
| **Total** | | **~$195/month** |

### Cost Reduction Strategies
1. Use **Azure CDN** (reduces direct blob bandwidth)
2. Implement **lower bitrate** for mobile devices
3. Delete **source videos** after HLS conversion
4. Use **cool storage tier** for older episodes (rarely watched)

---

## Testing Checklist

### Upload Testing
- [ ] Upload small file (<100MB)
- [ ] Upload large file (>1GB)
- [ ] Test pause/resume functionality
- [ ] Simulate network interruption during upload
- [ ] Test concurrent uploads (multiple users)

### Playback Testing
- [ ] Test on Chrome (hls.js)
- [ ] Test on Safari (native HLS)
- [ ] Test on iOS Safari (native HLS)
- [ ] Test on Android Chrome (hls.js)
- [ ] Test quality switching (manual and auto)
- [ ] Test seek/scrubbing
- [ ] Test on slow network (3G simulation)

### Backend Testing
- [ ] FFmpeg conversion successful for various codecs
- [ ] All HLS files uploaded to Azure
- [ ] Episode record created correctly
- [ ] Temp files cleaned up after upload
- [ ] Expired sessions cleaned up (24h+ old)

---

## Troubleshooting

### FFmpeg not found
**Error**: `System.ComponentModel.Win32Exception: The system cannot find the file specified`

**Solution**: Install FFmpeg and add to PATH, or specify full path in code:
```csharp
private const string FFMPEG_PATH = "C:\\ffmpeg\\bin\\ffmpeg.exe";
```

### HLS playback not working
**Error**: CORS policy error or 403 Forbidden

**Solution**:
1. Check Azure Blob container access level (must be Public Blob)
2. Enable CORS on Azure Storage Account
3. Verify `.m3u8` and `.ts` files have correct Content-Type headers

### Slow HLS conversion
**Issue**: FFmpeg takes 5+ minutes for 24-minute episode

**Solutions**:
1. Use faster preset: `-preset fast` (lower quality) or `-preset veryfast`
2. Reduce number of variants (only 360p and 720p)
3. Use hardware acceleration: `-hwaccel cuda` (NVIDIA GPU) or `-hwaccel qsv` (Intel)

---

## License & Credits

- **hls.js**: Apache License 2.0 (https://github.com/video-dev/hls.js/)
- **FFmpeg**: LGPL/GPL (https://ffmpeg.org/)
- **Azure SDK**: MIT License

---

## Support

For issues or questions:
1. Check FFmpeg logs for conversion errors
2. Check Azure Storage logs for upload failures
3. Check browser console for HLS playback errors
4. Review Application Insights for backend errors

**Production Checklist**: Before go-live, ensure all items in Testing Checklist are completed.
