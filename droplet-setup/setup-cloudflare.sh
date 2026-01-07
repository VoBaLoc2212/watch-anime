#!/bin/bash
# Setup HTTPS with Cloudflare Tunnel (no domain required)

set -e

echo "=== Installing Cloudflare Tunnel ==="

# Add cloudflare repo
mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null

# Add repository
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared focal main' | tee /etc/apt/sources.list.d/cloudflared.list

# Install
apt-get update
apt-get install -y cloudflared

echo "=== Cloudflared installed ==="
echo ""
echo "Next steps:"
echo "1. Login to Cloudflare: cloudflared tunnel login"
echo "2. Create tunnel: cloudflared tunnel create ffmpeg-api"
echo "3. Configure tunnel: cloudflared tunnel route dns ffmpeg-api ffmpeg-api.yourdomain.com"
echo "4. Run tunnel: cloudflared tunnel run ffmpeg-api"
echo ""
echo "You will get a FREE HTTPS URL like: https://ffmpeg-api-xxx.trycloudflare.com"
