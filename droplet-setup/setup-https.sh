#!/bin/bash
# Setup HTTPS for Droplet API with Nginx + Let's Encrypt

set -e

echo "=== Installing Nginx and Certbot ==="
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

echo "=== Creating Nginx config ==="
cat > /etc/nginx/sites-available/ffmpeg-api << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_HERE;  # Change this to your domain

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for large video uploads
        proxy_connect_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_read_timeout 3600s;
        client_max_body_size 2G;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/ffmpeg-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx

echo "=== Nginx installed ==="
echo ""
echo "Next steps:"
echo "1. Point your domain DNS A record to: 165.22.56.26"
echo "2. Wait for DNS propagation (5-30 minutes)"
echo "3. Run: certbot --nginx -d YOUR_DOMAIN"
echo "4. Certbot will auto-configure HTTPS"
