# Claude Flow Monitoring API - EC2 Deployment Guide

This directory contains the backend monitoring API that runs alongside Claude Flow on your EC2 instance.

## 📋 Prerequisites

- EC2 instance already running Claude Flow
- Node.js 18+ installed
- PM2 or systemd for process management
- Open port 3001 (or your chosen port) in security group
- SSL certificate (optional but recommended)

## 🚀 Quick Deployment

```bash
# 1. Copy this directory to your EC2 instance
scp -r ./ec2/* ubuntu@your-ec2-instance:/home/ubuntu/claude-flow-monitoring/

# 2. SSH into your EC2 instance
ssh ubuntu@your-ec2-instance

# 3. Navigate to the monitoring directory
cd /home/ubuntu/claude-flow-monitoring

# 4. Install dependencies
npm install

# 5. Configure environment
cp config/.env.example .env
nano .env  # Edit with your configuration

# 6. Build the TypeScript code
npm run build

# 7. Start with PM2 (recommended)
pm2 start dist/index.js --name claude-flow-monitoring
pm2 save
pm2 startup
```

## 🔧 Configuration

### Environment Variables

Edit `.env` file with your specific configuration:

```bash
# REQUIRED - Generate a secure API key
API_KEY=your-secure-api-key-here

# Port configuration
MONITORING_PORT=3001

# Claude Flow Integration
CLAUDE_FLOW_HOST=localhost
CLAUDE_FLOW_PORT=8080

# Database (uses SQLite by default)
DB_TYPE=sqlite
DB_PATH=/home/ubuntu/claude-flow-monitoring/data/monitoring.db

# CORS - Set to your Amplify domain
CORS_ORIGIN=https://your-amplify-app.amplifyapp.com

# Security
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW=15
```

### Integration with Existing Claude Flow

Add these lines to your Claude Flow configuration to enable monitoring:

```typescript
// In your Claude Flow initialization
import { MonitoringAdapter } from './monitoring/adapter';

const monitoring = new MonitoringAdapter({
  endpoint: 'http://localhost:3001',
  apiKey: process.env.MONITORING_API_KEY
});

// Attach to your swarm coordinator
swarmCoordinator.attachMonitoring(monitoring);
```

## 🔒 Security Setup

### 1. Security Group Configuration

Add these inbound rules to your EC2 security group:

```
Port 3001: Custom TCP - Source: Your Amplify App IP/CIDR
Port 3001: Custom TCP - Source: Your IP (for testing)
```

### 2. SSL Configuration (Recommended)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d monitoring.yourdomain.com

# Update .env with SSL paths
SSL_CERT=/etc/letsencrypt/live/monitoring.yourdomain.com/fullchain.pem
SSL_KEY=/etc/letsencrypt/live/monitoring.yourdomain.com/privkey.pem
```

### 3. Nginx Reverse Proxy (Optional)

```nginx
server {
    listen 443 ssl;
    server_name monitoring.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/monitoring.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monitoring.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # SSE specific
        proxy_set_header X-Accel-Buffering no;
        proxy_read_timeout 86400;
    }
}
```

## 🔧 Systemd Service Setup

Create `/etc/systemd/system/claude-flow-monitoring.service`:

```ini
[Unit]
Description=Claude Flow Monitoring API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/claude-flow-monitoring
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=claude-flow-monitoring
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable claude-flow-monitoring
sudo systemctl start claude-flow-monitoring
sudo systemctl status claude-flow-monitoring
```

## 📊 Monitoring the Monitor

### Health Check Endpoint

```bash
curl http://localhost:3001/health
```

### View Logs

```bash
# PM2
pm2 logs claude-flow-monitoring

# Systemd
sudo journalctl -u claude-flow-monitoring -f

# Application logs
tail -f /home/ubuntu/claude-flow-monitoring/logs/monitoring.log
```

### Performance Monitoring

```bash
# Check resource usage
pm2 monit

# View metrics
curl -H "X-API-Key: your-api-key" http://localhost:3001/api/metrics
```

## 🔄 Updates and Maintenance

### Updating the Service

```bash
# 1. Pull latest changes
git pull

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. Restart
pm2 restart claude-flow-monitoring
# or
sudo systemctl restart claude-flow-monitoring
```

### Database Maintenance

```bash
# Backup database
cp data/monitoring.db data/monitoring.db.backup

# Clean old data (older than 30 days)
npm run db:cleanup

# Optimize database
npm run db:optimize
```

## 🚨 Troubleshooting

### Service Won't Start

1. Check logs: `pm2 logs` or `journalctl -u claude-flow-monitoring`
2. Verify port availability: `sudo lsof -i :3001`
3. Check permissions: `ls -la /home/ubuntu/claude-flow-monitoring`
4. Validate config: `node dist/config/validate.js`

### Connection Issues from Amplify

1. Verify security group rules
2. Check CORS configuration in .env
3. Test with curl: `curl -H "X-API-Key: your-key" https://your-ec2-ip:3001/api/dashboard`
4. Check SSL certificate validity

### High Memory Usage

1. Adjust data retention: `DB_RETENTION_DAYS=7`
2. Enable data aggregation: `ENABLE_AGGREGATION=true`
3. Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=2048"`

### SSE Connection Drops

1. Check nginx timeout settings
2. Verify keepalive settings
3. Monitor network stability
4. Enable SSE heartbeat: `SSE_HEARTBEAT_INTERVAL=30000`

## 📁 Directory Structure

```
/home/ubuntu/claude-flow-monitoring/
├── dist/               # Compiled JavaScript
├── src/                # Source TypeScript files
├── config/             # Configuration files
├── data/               # SQLite database
├── logs/               # Application logs
├── scripts/            # Utility scripts
└── systemd/            # Systemd service files
```

## 🔗 API Endpoints Reference

All endpoints require `X-API-Key` header.

| Endpoint | Description | Example |
|----------|-------------|---------|
| GET /health | Health check | `curl http://localhost:3001/health` |
| GET /api/metrics | Current metrics | `curl -H "X-API-Key: KEY" http://localhost:3001/api/metrics` |
| GET /api/agents | Agent status | `curl -H "X-API-Key: KEY" http://localhost:3001/api/agents` |
| GET /api/tasks | Task status | `curl -H "X-API-Key: KEY" http://localhost:3001/api/tasks` |
| GET /api/dashboard | All dashboard data | `curl -H "X-API-Key: KEY" http://localhost:3001/api/dashboard` |
| GET /api/stream | SSE stream | EventSource connection |

## 🎯 Next Steps

1. Configure your Amplify frontend with the API endpoint
2. Set up monitoring alerts
3. Configure backup strategy
4. Enable CloudWatch integration
5. Set up API rate limiting based on your usage

For Amplify integration, see the [Amplify README](../amplify/README.md).