# Cloudflare Tunnel Setup Guide

## Quick Setup (Recommended - No Account Needed)

### 1. Upload script to Droplet

```powershell
# From Windows
cd d:\Studying\watch-anime\droplet-setup
scp setup-cloudflare-quick.sh root@165.22.56.26:/root/
```

### 2. Run setup on Droplet

```bash
ssh root@165.22.56.26

chmod +x setup-cloudflare-quick.sh
bash setup-cloudflare-quick.sh
```

### 3. Get your HTTPS URL

```bash
# View logs to get your URL
journalctl -u cloudflared-tunnel -f
```

Look for line like:
```
INF +--------------------------------------------------------------------------------------------+
INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
INF |  https://abc-def-ghi.trycloudflare.com                                                     |
INF +--------------------------------------------------------------------------------------------+
```

Copy URL: `https://abc-def-ghi.trycloudflare.com`

### 4. Update Backend

Edit `d:\Studying\watch-anime\backend\appsettings.json`:

```json
"Droplet": {
  "ApiUrl": "https://abc-def-ghi.trycloudflare.com",
  "TimeoutSeconds": 3600
}
```

Edit `d:\Studying\watch-anime\backend\appsettings.development.json` (same change).

### 5. Test

```bash
# Test from Droplet
curl https://abc-def-ghi.trycloudflare.com/health

# Should return: {"status":"ok","service":"ffmpeg-api"}
```

## Commands

```bash
# View tunnel status
systemctl status cloudflared-tunnel

# View logs
journalctl -u cloudflared-tunnel -f

# Restart tunnel
systemctl restart cloudflared-tunnel

# Stop tunnel
systemctl stop cloudflared-tunnel
```

## Notes

- **URL is random** and changes if tunnel restarts
- **Free forever** - no Cloudflare account needed
- **HTTPS automatic** - SSL handled by Cloudflare
- **Performance**: Slight latency (traffic goes through Cloudflare edge)

## For Production (Stable URL)

If you need a stable URL that doesn't change:

1. Create Cloudflare account (free)
2. Add domain to Cloudflare
3. Run: `cloudflared tunnel login`
4. Run: `cloudflared tunnel create ffmpeg-api`
5. Configure DNS: `cloudflared tunnel route dns ffmpeg-api ffmpeg.yourdomain.com`

This gives you: `https://ffmpeg.yourdomain.com` (permanent)
