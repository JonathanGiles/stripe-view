# Docker Deployment Guide

## Quick Start

1. **Create a config directory with your config.json:**

```bash
mkdir config
cp config.json config/
```

2. **Create a .env file for authentication:**

```bash
cp .env.example .env
# Edit .env with your desired username/password
```

3. **Build and run with Docker Compose:**

```bash
docker-compose up -d
```

4. **Access the dashboard:**

Open http://localhost:3000 and login with your credentials from .env

## Configuration

### Directory Structure

```
stripe-view/
├── docker-compose.yml
├── Dockerfile
├── .env                 # Your environment variables
└── config/              # Your config files (volume mounted)
    ├── config.json      # API credentials
    └── view.json        # Saved preferences (auto-created)
```

### Environment Variables

Create a `.env` file:

```env
# HTTP Basic Authentication
BASIC_AUTH_USER=your-username
BASIC_AUTH_PASS=your-secure-password

# Optional: Custom port
# PORT=3000
```

**Note:** If you don't set `BASIC_AUTH_USER` and `BASIC_AUTH_PASS`, the dashboard will be **publicly accessible without authentication**.

### config.json

Place your Stripe/PayPal API credentials in `config/config.json`:

```json
{
  "projects": [
    {
      "id": "project1",
      "name": "My Business",
      "website": "https://example.com",
      "stripe": {
        "apiKey": "rk_live_...",
        "enabled": true
      },
      "paypal": {
        "enabled": true,
        "classicApi": {
          "username": "paypal_api1.example.com",
          "password": "...",
          "signature": "..."
        }
      }
    }
  ],
  "pollingIntervalSeconds": 60
}
```

## Docker Commands

### Build the image

```bash
docker-compose build
```

### Start the service

```bash
docker-compose up -d
```

### View logs

```bash
docker-compose logs -f
```

### Stop the service

```bash
docker-compose down
```

### Restart the service

```bash
docker-compose restart
```

### Update to latest code

```bash
git pull
docker-compose build
docker-compose up -d
```

## Docker Run (without docker-compose)

If you prefer `docker run`:

```bash
# Build
docker build -t stripe-view .

# Run
docker run -d \
  --name stripe-view \
  -p 3000:3000 \
  -e BASIC_AUTH_USER=admin \
  -e BASIC_AUTH_PASS=changeme \
  -v $(pwd)/config:/config \
  --restart unless-stopped \
  stripe-view
```

## Production Deployment

### Reverse Proxy with Nginx

Example nginx config for HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name dashboard.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Security Best Practices

1. **Use strong passwords** in your .env file
2. **Enable HTTPS** with a reverse proxy (nginx, Caddy, Traefik)
3. **Restrict network access** using firewall rules
4. **Keep backups** of your config directory
5. **Regular updates** - pull latest code and rebuild

### Home Server Deployment

For your use case (brother accessing from mobile):

1. Deploy with docker-compose on your home server
2. Set up port forwarding (port 3000) on your router
3. Use Dynamic DNS (e.g., DuckDNS) for consistent access
4. Add HTTPS with Let's Encrypt (use Caddy for easy HTTPS)

Example with Caddy:

```bash
# Install Caddy
docker run -d \
  --name caddy \
  -p 80:80 \
  -p 443:443 \
  -v caddy_data:/data \
  -v caddy_config:/config \
  -v $(pwd)/Caddyfile:/etc/caddy/Caddyfile \
  caddy:latest
```

Caddyfile:
```
dashboard.yourdomain.com {
    reverse_proxy stripe-view:3000
}
```

## Troubleshooting

### Can't connect to dashboard

```bash
# Check if container is running
docker ps

# Check logs
docker-compose logs

# Verify port is listening
curl http://localhost:3000/api/status
```

### Authentication not working

Check your .env file and rebuild:

```bash
docker-compose down
docker-compose up -d
```

### Config not loading

Ensure your config directory is mounted correctly:

```bash
docker-compose exec stripe-view ls -la /config
```

### Permission issues

If running as non-root user:

```bash
chmod 755 config
chmod 644 config/config.json
```

## Mobile Access

To access from your brother's phone:

1. **Find your server's local IP:**
   ```bash
   # On Linux/Mac
   hostname -I
   
   # On Windows
   ipconfig
   ```

2. **Access from mobile on same network:**
   ```
   http://192.168.1.x:3000
   ```

3. **For remote access (outside your network):**
   - Set up port forwarding on your router (port 3000 → server IP)
   - Use Dynamic DNS for consistent address
   - Strongly recommended: Add HTTPS with reverse proxy

## Backup

Backup your config directory regularly:

```bash
# Create backup
tar -czf stripe-view-backup-$(date +%Y%m%d).tar.gz config/

# Restore from backup
tar -xzf stripe-view-backup-YYYYMMDD.tar.gz
```

## Support

For issues or questions, check the main README.md or open an issue on GitHub.
