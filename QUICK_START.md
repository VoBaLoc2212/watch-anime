# 🚀 Quick Start Guide - HLS Video Streaming

## Installation (5 minutes)

### 1. Install hls.js (Frontend)
```bash
cd frontend
npm install hls.js@latest
```

### 2. Install FFmpeg (Backend Server)
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Windows (Chocolatey - Run as Admin)
choco install ffmpeg

# macOS (Homebrew)
brew install ffmpeg

# Verify
ffmpeg -version
```

### 3. Configure Azure Blob Storage
```bash
# Azure Portal OR Azure CLI
az storage container create \
  --name media \
  --public-access blob \
  --account-name YOUR_ACCOUNT

# Enable CORS
az storage cors add \
  --services b \
  --methods GET HEAD \
  --origins "*" \
  --allowed-headers "*" \
  --account-name YOUR_ACCOUNT
```

Add to `appsettings.json`:
```json
{
  "BlobAzure": {
    "ConnectionStringStorage": "YOUR_CONNECTION_STRING",
    "ContainerName": "media"
  }
}
```

---

## Usage Examples

### Upload Episode (Admin Page)
```tsx
import ChunkedVideoUploadDialog from '@/components/ChunkedVideoUploadDialog';

<ChunkedVideoUploadDialog
  open={true}
  onClose={() => setOpen(false)}
  animeSlug="naruto-shippuden"
  animeName="Naruto Shippuden"
  onUploadSuccess={() => alert('Done!')}
/>
```

### Play Episode (Watch Page)
```tsx
import HLSVideoPlayer from '@/components/HLSVideoPlayer';

<HLSVideoPlayer
  src="https://account.blob.core.windows.net/media/anime/naruto/ep1/master.m3u8"
  autoPlay={false}
  className="w-full aspect-video"
/>
```

---

## API Endpoints

### 1. Start Upload
```bash
POST /api/ChunkedUpload/initiate-chunked-upload
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "fileName": "episode1.mp4",
  "totalSize": 524288000,
  "totalChunks": 100,
  "animeSlug": "naruto",
  "episodeNumber": 1,
  "episodeName": "Pilot"
}

# Response:
{
  "uploadId": "abc-123",
  "chunkSize": 5242880,
  "totalChunks": 100
}
```

### 2. Upload Chunks (Loop)
```bash
POST /api/ChunkedUpload/upload-chunk
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN

UploadId: abc-123
ChunkIndex: 0
ChunkData: <binary>

# Response:
{
  "success": true,
  "chunkIndex": 0,
  "message": "Chunk 1/100 uploaded"
}
```

### 3. Complete Upload
```bash
POST /api/ChunkedUpload/complete-chunked-upload
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "uploadId": "abc-123",
  "duration": "00:24:30"
}

# Response:
{
  "success": true,
  "hlsMasterUrl": "https://.../master.m3u8",
  "episodeId": 123
}
```

---

## Testing

### Manual Test (cURL)
```bash
# 1. Initiate
curl -X POST https://localhost:7001/api/ChunkedUpload/initiate-chunked-upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.mp4",
    "totalSize": 10485760,
    "totalChunks": 2,
    "animeSlug": "test-anime",
    "episodeNumber": 1,
    "episodeName": "Test Episode"
  }'

# 2. Upload chunk
curl -X POST https://localhost:7001/api/ChunkedUpload/upload-chunk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "UploadId=abc-123" \
  -F "ChunkIndex=0" \
  -F "ChunkData=@chunk0.bin"

# 3. Complete
curl -X POST https://localhost:7001/api/ChunkedUpload/complete-chunked-upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "uploadId": "abc-123",
    "duration": "00:05:30"
  }'
```

---

## File Structure

### Backend Output
```
TempUploads/
└── {upload-id}/
    ├── chunk_0000
    ├── chunk_0001
    ├── ...
    └── assembled.mp4

{upload-id}_hls/
├── master.m3u8
├── v0/
│   ├── playlist.m3u8
│   └── seg000.ts, seg001.ts, ...
├── v1/
│   └── ...
└── v2/
    └── ...
```

### Azure Blob Structure
```
media/
└── anime/
    └── {anime-slug}/
        └── ep{number}/
            ├── master.m3u8
            ├── v0/ (360p)
            ├── v1/ (720p)
            └── v2/ (1080p)
```

---

## Performance Tips

### Faster FFmpeg (Production)
```csharp
// Use faster preset (less compression, faster)
-preset fast

// Or use hardware acceleration
-hwaccel cuda  // NVIDIA GPU
-hwaccel qsv   // Intel Quick Sync
```

### Optimize Upload Speed
```tsx
// Increase chunk size (default 5MB)
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

// Parallel chunk uploads (careful with server load)
await Promise.all([
  uploadChunk(0),
  uploadChunk(1),
  uploadChunk(2)
]);
```

### Reduce Storage Costs
```csharp
// Delete source video after HLS conversion
File.Delete(assembledVideoPath);

// Use Azure cool storage for old episodes
// (Via Azure Portal: Set access tier to "Cool")
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| FFmpeg not found | Add to PATH or use full path: `/usr/bin/ffmpeg` |
| CORS error | Enable CORS on Azure Storage (see above) |
| 413 Payload Too Large | Increase `MaxRequestBodySize` in Program.cs |
| Slow conversion | Use `-preset fast` or hardware acceleration |
| Out of memory | Reduce chunk size or add more RAM |
| HLS won't play | Check blob access level (must be Public Blob) |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `ChunkedUploadController.cs` | Upload API endpoints |
| `HLSConversionService.cs` | FFmpeg video processing |
| `ChunkedVideoUploadDialog.tsx` | Upload UI component |
| `HLSVideoPlayer.tsx` | Video player component |
| `ChunkedUploadAPI.tsx` | API client functions |

---

## Production Checklist

- [ ] FFmpeg installed (`ffmpeg -version`)
- [ ] Azure Blob connection string configured
- [ ] Container created with public access
- [ ] CORS enabled on Azure Storage
- [ ] Test 100MB video upload
- [ ] Test 1GB video upload
- [ ] Test playback on Chrome
- [ ] Test playback on Safari/iOS
- [ ] Test pause/resume upload
- [ ] Verify quality switching works
- [ ] Set up monitoring/logging
- [ ] Configure CDN (optional, recommended)

---

## Support

**Documentation:**
- Detailed Guide: `PRODUCTION_HLS_GUIDE.md`
- Full Summary: `HLS_IMPLEMENTATION_SUMMARY.md`

**Common Commands:**
```bash
# Check FFmpeg
ffmpeg -version

# Test HLS playback
ffplay https://your-blob.blob.core.windows.net/media/.../master.m3u8

# View FFmpeg progress
tail -f /var/log/ffmpeg.log

# Check temp uploads
ls -lh TempUploads/

# Azure Blob list
az storage blob list --container-name media --account-name youraccount
```

**Need Help?**
1. Check error logs in Application Insights
2. Verify Azure Blob connection string
3. Test FFmpeg manually: `ffmpeg -i input.mp4 output.m3u8`
4. Check browser console for HLS errors
5. Verify CORS settings on Azure

---

**🎉 You're ready to go! Start with a small test video first.**
