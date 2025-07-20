# Setup Guide: Connecting to EC2 Backend

This guide explains how to configure the Research Labs application to communicate with an EC2 backend instance.

## Prerequisites

- Node.js and npm installed
- Access to an EC2 instance running the backend API
- EC2 instance security group configured to allow traffic on port 3000

## Quick Start

1. **Clone the repository** (if you haven't already)
   ```bash
   git clone [repository-url]
   cd color-code-research-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit .env.local with your EC2 instance details
   nano .env.local
   ```

4. **Update the EC2 IP address** in `.env.local`:
   ```env
   VITE_API_BASE_URL=http://YOUR_EC2_IP:3000
   VITE_API_KEY=your-api-key-here
   VITE_WEBHOOK_URL=optional-webhook-url
   ```

5. **Start the application**
   ```bash
   npm start
   ```

## Available Scripts

### Development
- `npm start` - Start the development server (uses .env.local configuration)
- `npm run start:local` - Force local backend (http://localhost:3001)
- `npm run start:ec2` - Use EC2 backend from .env.local

### Production
- `npm run build` - Build for production
- `npm run build:ec2` - Build with specific EC2 IP (replace in package.json)

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | EC2 backend URL | `http://52.123.456.789:3000` |
| `VITE_API_KEY` | API authentication key | `your-secret-key` |
| `VITE_WEBHOOK_URL` | Optional webhook endpoint | `https://your-webhook.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_PORT` | Local dev server port | `3000` |
| `VITE_ENABLE_HEALTH_CHECK` | Show connection status | `true` |
| `VITE_API_TIMEOUT` | Request timeout (ms) | `300000` |
| `VITE_POLL_INTERVAL` | Status polling interval (ms) | `2000` |

## Connection Status Indicators

The application displays a connection status indicator in the header:

- 🟢 **Green** - Successfully connected to EC2
- 🟡 **Yellow** - Running locally (no backend)
- 🔴 **Red** - EC2 connection failed

## Troubleshooting

### Connection Failed

If you see a red connection indicator:

1. **Check EC2 instance is running**
   ```bash
   # SSH into your EC2 instance
   ssh ec2-user@YOUR_EC2_IP
   
   # Check if the backend is running
   sudo systemctl status your-backend-service
   ```

2. **Verify security group settings**
   - Ensure port 3000 is open for inbound traffic
   - Check that your IP is whitelisted (if using IP restrictions)

3. **Test direct API access**
   ```bash
   # Test the health endpoint
   curl http://YOUR_EC2_IP:3000/health
   ```

### CORS Errors

If you encounter CORS errors:

1. Ensure the backend is configured to accept requests from your frontend origin
2. The backend should include these headers:
   ```
   Access-Control-Allow-Origin: http://localhost:3000
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, X-API-Key
   ```

### API Key Issues

If you receive authentication errors:

1. Verify the API key in `.env.local` matches the backend configuration
2. Ensure the `X-API-Key` header is being sent with requests

## API Endpoints

The application uses these endpoints:

- `GET /health` - Health check
- `GET /teams` - Get available team types
- `GET /teams/{teamType}/fields` - Get form fields for a team
- `POST /research/submit` - Submit research request
- `GET /research/status/{jobId}` - Check job status
- `GET /research/results/{jobId}` - Get research results

## Security Considerations

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use HTTPS in production** - Update `VITE_API_BASE_URL` to use `https://`
3. **Rotate API keys regularly** - Update both frontend and backend
4. **Implement rate limiting** - The frontend includes basic rate limiting

## Local Development

For local development without EC2:

1. Run your backend locally on port 3001
2. Use: `npm run start:local`
3. The proxy configuration will forward `/api` requests to `localhost:3001`

## Production Deployment

1. Update `.env.local` with production EC2 details
2. Build the application: `npm run build`
3. Deploy the `dist` folder to your hosting service
4. Ensure environment variables are set in your hosting platform

## Support

If you encounter issues:

1. Check the browser console for detailed error messages
2. Verify all environment variables are correctly set
3. Ensure the EC2 instance is accessible from your network
4. Check the application logs for more information