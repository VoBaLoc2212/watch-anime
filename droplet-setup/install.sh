#!/bin/bash

# DigitalOcean Droplet FFmpeg API Setup Script
# Run this on your Ubuntu Droplet: bash install.sh

set -e

echo "=== Installing FFmpeg and dependencies ==="
apt-get update
apt-get install -y ffmpeg python3 python3-pip python3-venv

echo "=== Creating app directory ==="
mkdir -p /opt/ffmpeg-api
cd /opt/ffmpeg-api

echo "=== Creating Python virtual environment ==="
python3 -m venv venv
source venv/bin/activate

echo "=== Installing Python packages ==="
pip install flask azure-storage-blob gunicorn

echo "=== Setup complete! ==="
echo "Next steps:"
echo "1. Copy api_server.py to /opt/ffmpeg-api/"
echo "2. Copy .env to /opt/ffmpeg-api/"
echo "3. Run: systemctl enable ffmpeg-api"
echo "4. Run: systemctl start ffmpeg-api"
