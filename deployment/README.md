# Stripe View - Portainer Deployment Guide

## Quick Start

### 1. Initial Setup (on your Linux server)

```bash
cd /path/to/stripe-view/deployment
./manage.sh
# Choose option 1 for initial setup
```

This will:
- Create the `data/` directory
- Set up authentication credentials (.env)
- Guide you through creating config.json

### 2. Build Docker Image

```bash
./manage.sh
# Choose option 2 to build the image
```

### 3. Deploy in Portainer

**Before uploading**, edit `deployment/docker-compose.yml` and change:
```yaml
volumes:
  - ./data:/config
```
to use the absolute path on your server:
```yaml
volumes:
  - /full/path/to/stripe-view/deployment/data:/config
```

Then in Portainer:

1. Go to **Stacks** → **Add Stack**
2. Name it `stripe-view`
3. **Upload** your edited `docker-compose.yml`
4. **Upload** your `.env` file (or set environment variables manually)
5. Click **Deploy the stack**

## Management Script Options

Run `./manage.sh` and choose from:

1. **Initial setup** - First time configuration
2. **Build Docker image** - Build/rebuild the image
3. **Pull latest code** - Update from Git
4. **Push image to registry** - Upload to Docker registry (optional)
5. **Create Portainer stack file** - Generate stack configuration
6. **View deployment info** - Show current status
7. **View container logs** - Check logs (local only)
8. **Cleanup old images** - Remove unused images
9. **Exit**

## Typical Workflow

### Initial Deployment
```bash
cd /path/to/stripe-view/deployment
./manage.sh
# 1 - Initial setup
# 2 - Build Docker image
# 5 - Create Portainer stack file
# Then deploy in Portainer
```

### Updating to Latest Version
```bash
cd /path/to/stripe-view/deployment
./manage.sh
# 3 - Pull latest code
# 2 - Build Docker image
# Then restart stack in Portainer
```

## Directory Structure

```
stripe-view/
├── deployment/           # Everything for deployment
│   ├── manage.sh        # Interactive management script
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── .env            # Your credentials (created by setup)
│   ├── .gitignore
│   └── data/           # Persistent data (created by setup)
│       ├── config.json # Your Stripe API keys
│       └── view.json   # Saved preferences (auto-created)
├── src/                # Application code
├── Dockerfile
└── package.json
```

## Configuration Files

### data/config.json
Your Stripe API configuration:

```json
{
  "projects": [
    {
      "id": "my-project",
      "name": "My Business",
      "website": "https://example.com",
      "stripe": {
        "apiKey": "rk_live_...",
        "enabled": true
      }
    }
  ],
  "pollingIntervalSeconds": 60
}
```

### .env
Authentication credentials (created by setup script):

```bash
BASIC_AUTH_USER=your-username
BASIC_AUTH_PASS=your-password
PORT=3000
```

## Accessing the Dashboard

Once deployed:
- **Local**: http://your-server-ip:3000
- **With reverse proxy**: https://stripe.yourdomain.com

You'll be prompted for the username/password you set during setup.

## Troubleshooting

### Container won't start
```bash
# Check logs in Portainer or run locally:
cd /path/to/stripe-view/deployment
./manage.sh
# Choose option 7 - View container logs
```

### Config not loading
1. Check volume path in Portainer stack matches your server path
2. Verify `data/config.json` exists and has correct permissions
3. Check container logs for errors

### Authentication not working
1. Verify environment variables are set in Portainer
2. Check `.env` file has correct credentials
3. Try redeploying the stack

### Need to rebuild after code changes
```bash
./manage.sh
# Option 3 - Pull latest code
# Option 2 - Build Docker image
# Then restart in Portainer (Containers → stripe-view → Restart)
```

## Advanced: Using a Docker Registry

If you want to push images to a registry (for remote Portainer instances):

```bash
./manage.sh
# Option 4 - Push image to registry
# Enter your registry URL (e.g., docker.io/yourusername)
```

Then update your Portainer stack to use the registry image:
```yaml
image: docker.io/yourusername/stripe-view:latest
```

## Security Notes

- Change default credentials immediately
- Use a reverse proxy (nginx/Caddy) with HTTPS in production
- Keep your `data/config.json` secure (contains API keys)
- The `.env` file is gitignored by default
- Consider using Portainer's secrets for sensitive values

## Backup

To backup your configuration:

```bash
cd /path/to/stripe-view/deployment
tar -czf stripe-view-backup-$(date +%Y%m%d).tar.gz data/ .env
```

To restore:

```bash
tar -xzf stripe-view-backup-YYYYMMDD.tar.gz
```
