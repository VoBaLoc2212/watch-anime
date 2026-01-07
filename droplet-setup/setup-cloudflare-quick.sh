#!/bin/bash
# Quick setup Cloudflare Tunnel for HTTPS (No login required)

set -e

echo "=== Installing Cloudflare Tunnel ==="

# Download and install cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared-linux-amd64.deb
rm cloudflared-linux-amd64.deb

echo "=== Creating tunnel config ==="
mkdir -p /etc/cloudflared

cat > /etc/cloudflared/config.yml << 'EOF'
tunnel: quick
credentials-file: /etc/cloudflared/cert.json

ingress:
  - service: http://127.0.0.1:5000
EOF

echo "=== Creating systemd service ==="
cat > /etc/systemd/system/cloudflared-tunnel.service << 'EOF'
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/cloudflared tunnel --no-autoupdate run --url http://127.0.0.1:5000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable cloudflared-tunnel
systemctl start cloudflared-tunnel

echo ""
echo "=== Cloudflare Tunnel is starting... ==="
echo "Wait 10 seconds for tunnel to establish..."
sleep 10

echo ""
echo "=== Getting tunnel URL ==="
journalctl -u cloudflared-tunnel -n 50 | grep -i "trycloudflare.com" || echo "Checking logs..."

echo ""
echo "=== Setup complete! ==="
echo ""
echo "To get your HTTPS URL, run:"
echo "  journalctl -u cloudflared-tunnel -f | grep trycloudflare"
echo ""
echo "You will see a URL like: https://xxx-xxx-xxx.trycloudflare.com"
echo "Use this URL in your backend appsettings.json"
