# DigitalOcean Droplet Setup Instructions

## Step 1: Connect to Droplet

```bash
ssh root@165.22.56.26
# Password: AniversitY2104@L
```

## Step 2: Upload files to Droplet

From your local machine (Windows PowerShell):

```powershell
# Upload setup files
scp install.sh root@165.22.56.26:/root/
scp api_server.py root@165.22.56.26:/root/
scp .env.example root@165.22.56.26:/root/.env
scp ffmpeg-api.service root@165.22.56.26:/root/
```

## Step 3: Install dependencies on Droplet

```bash
cd /root
chmod +x install.sh
bash install.sh
```

## Step 4: Setup API server

```bash
# Copy files to /opt/ffmpeg-api
cp api_server.py /opt/ffmpeg-api/
cp .env /opt/ffmpeg-api/

# Edit .env and add your SECRET_KEY
nano /opt/ffmpeg-api/.env
# Replace <YOUR_SECRET_KEY_HERE> with actual secret key

# Copy systemd service
cp ffmpeg-api.service /etc/systemd/system/

# Enable and start service
systemctl daemon-reload
systemctl enable ffmpeg-api
systemctl start ffmpeg-api

# Check status
systemctl status ffmpeg-api
```

## Step 5: Test API

```bash
curl http://localhost:5000/health
# Should return: {"status":"ok","service":"ffmpeg-api"}
```

## Step 6: Open firewall (if needed)

```bash
ufw allow 5000/tcp
ufw reload
```

## Logs

View logs:
```bash
journalctl -u ffmpeg-api -f
```

## Restart service

```bash
systemctl restart ffmpeg-api
```
