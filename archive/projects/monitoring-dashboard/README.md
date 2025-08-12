# Claude Flow Monitoring Dashboard 🚀

A comprehensive monitoring solution for Claude Flow's remote execution system that provides real-time tracking and analytics without requiring WebSocket infrastructure.

## 🌟 Features

- **Real-time Monitoring**: Track swarm executions, agent status, and task progress
- **Multiple Communication Modes**: HTTP polling, Server-Sent Events (SSE), and long polling
- **RESTful API**: Easy integration with any frontend framework or external service
- **Dashboard UI**: React-based interface with live updates and visualizations
- **Performance Metrics**: CPU, memory, and execution time tracking
- **Alert System**: Configurable alerts for failures and threshold breaches
- **Historical Data**: Query past executions and analyze trends
- **Secure**: API key authentication and rate limiting
- **Scalable**: Supports multiple concurrent dashboards

## 📋 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- SQLite (default) or Redis
- Docker (optional)

### Installation

```bash
# 1. Navigate to the monitoring dashboard directory
cd monitoring-dashboard

# 2. Run the setup script
./scripts/setup.sh

# 3. Configure environment variables
cp config/.env.example .env
# Edit .env with your settings

# 4. Start the monitoring service
npm start

# 5. Access the dashboard
open http://localhost:3001
```

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Claude Flow    │────▶│  Monitoring API  │────▶│   Dashboard UI  │
│  Swarm Engine   │     │  (Express/SSE)   │     │     (React)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         │                       ▼                         │
         │              ┌──────────────────┐               │
         └─────────────▶│   Data Store     │◀──────────────┘
                        │ (SQLite/Redis)   │
                        └──────────────────┘
```

## 🔌 API Endpoints

### Core Monitoring Endpoints

| Endpoint | Method | Description | Example |
|----------|--------|-------------|---------|
| `/api/metrics` | GET | Get current performance metrics | `curl -H "X-API-Key: YOUR_KEY" http://localhost:3001/api/metrics` |
| `/api/agents` | GET | List active agents | `curl -H "X-API-Key: YOUR_KEY" http://localhost:3001/api/agents` |
| `/api/tasks` | GET | Get task status and progress | `curl -H "X-API-Key: YOUR_KEY" http://localhost:3001/api/tasks` |
| `/api/alerts` | GET | Retrieve active alerts | `curl -H "X-API-Key: YOUR_KEY" http://localhost:3001/api/alerts` |
| `/api/dashboard` | GET | Get aggregated dashboard data | `curl -H "X-API-Key: YOUR_KEY" http://localhost:3001/api/dashboard` |

### Real-time Endpoints

| Endpoint | Method | Description | Example |
|----------|--------|-------------|---------|
| `/api/stream` | GET | Server-Sent Events stream | `curl -H "X-API-Key: YOUR_KEY" http://localhost:3001/api/stream` |
| `/api/poll` | GET | Long polling endpoint | `curl -H "X-API-Key: YOUR_KEY" http://localhost:3001/api/poll?timeout=30000` |

### Historical Data

| Endpoint | Method | Description | Example |
|----------|--------|-------------|---------|
| `/api/metrics/history` | GET | Get historical metrics | `curl -H "X-API-Key: YOUR_KEY" http://localhost:3001/api/metrics/history?from=2024-01-01&to=2024-01-31` |
| `/api/tasks/completed` | GET | Get completed tasks | `curl -H "X-API-Key: YOUR_KEY" http://localhost:3001/api/tasks/completed?limit=100` |

## 🎯 Integration Examples

### Basic HTTP Polling

```javascript
// Simple polling client
const API_KEY = 'your-api-key';
const API_URL = 'http://localhost:3001/api';

async function pollDashboard() {
  try {
    const response = await fetch(`${API_URL}/dashboard`, {
      headers: { 'X-API-Key': API_KEY }
    });
    const data = await response.json();
    updateUI(data);
  } catch (error) {
    console.error('Polling error:', error);
  }
}

// Poll every 5 seconds
setInterval(pollDashboard, 5000);
```

### Server-Sent Events (SSE)

```javascript
// Real-time updates via SSE
const eventSource = new EventSource(
  `http://localhost:3001/api/stream?apiKey=${API_KEY}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleRealtimeUpdate(data);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  // Implement reconnection logic
};
```

### Python Integration

```python
import requests
import json
from sseclient import SSEClient

# REST API example
def get_dashboard_data():
    headers = {'X-API-Key': 'your-api-key'}
    response = requests.get('http://localhost:3001/api/dashboard', headers=headers)
    return response.json()

# SSE example
def stream_updates():
    headers = {'X-API-Key': 'your-api-key'}
    messages = SSEClient('http://localhost:3001/api/stream', headers=headers)
    for msg in messages:
        data = json.loads(msg.data)
        process_update(data)
```

## 🐳 Docker Deployment

```bash
# Build the Docker image
docker build -t claude-flow-monitoring .

# Run with environment file
docker run -d \
  --name claude-flow-monitor \
  -p 3001:3001 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  claude-flow-monitoring

# Using Docker Compose
docker-compose up -d
```

## ⚙️ Configuration

### Environment Variables

```bash
# Core Settings
MONITORING_PORT=3001              # API server port
API_KEY=your-secure-key          # API authentication key

# Database
DB_TYPE=sqlite                   # sqlite or redis
DB_PATH=./data/monitoring.db     # SQLite database path
DB_RETENTION_DAYS=30             # Data retention period

# Performance
CACHE_TTL=60                     # Cache time-to-live in seconds
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window
RATE_LIMIT_WINDOW=15             # Rate limit window in minutes

# Alerts
ALERT_THRESHOLD_CPU=80           # CPU usage alert threshold (%)
ALERT_THRESHOLD_MEMORY=85        # Memory usage alert threshold (%)
```

### Advanced Configuration

See `config/.env.example` for all available configuration options.

## 📊 Dashboard Features

### Main Dashboard
- **Overview Panel**: System health at a glance
- **Agent Grid**: Visual representation of active agents
- **Task Timeline**: Real-time task execution flow
- **Performance Charts**: CPU, memory, and throughput graphs
- **Alert Center**: Active alerts and notifications

### Analytics
- **Execution History**: Browse past swarm executions
- **Performance Trends**: Analyze system performance over time
- **Agent Utilization**: Track agent efficiency
- **Error Analysis**: Identify common failure patterns

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run load tests
npm run test:load

# Run all tests with coverage
npm run test:coverage
```

## 🚀 Production Deployment

### Security Checklist
- [ ] Generate strong API keys
- [ ] Configure HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up monitoring alerts
- [ ] Enable audit logging

### Performance Optimization
- Enable response compression
- Configure caching headers
- Use CDN for static assets
- Set up database indexing
- Implement data aggregation
- Configure connection pooling

### High Availability
- Deploy multiple API instances
- Use load balancer (nginx/HAProxy)
- Set up database replication
- Implement health checks
- Configure automatic failover

## 📚 API Reference

Full API documentation is available in `docs/api-reference/`. 

Key response formats:

```json
// Metrics Response
{
  "timestamp": "2024-01-01T12:00:00Z",
  "metrics": {
    "cpu": 45.2,
    "memory": 62.8,
    "activeAgents": 5,
    "runningTasks": 12,
    "completedTasks": 145
  }
}

// Agent Status Response
{
  "agents": [
    {
      "id": "agent-123",
      "type": "coder",
      "status": "active",
      "currentTask": "task-456",
      "lastHeartbeat": "2024-01-01T12:00:00Z"
    }
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**API Connection Failed**
- Check if the service is running: `npm run status`
- Verify API key is correct
- Check firewall settings

**High Memory Usage**
- Adjust data retention: `DB_RETENTION_DAYS=7`
- Enable data aggregation
- Increase cache TTL

**SSE Connection Drops**
- Check proxy timeout settings
- Implement reconnection logic
- Use polling as fallback

### Getting Help

- Check the [Implementation Plan](./IMPLEMENTATION_PLAN.md) for detailed setup
- Review logs in `./logs/monitoring.log`
- Open an issue on GitHub
- Contact support@claudeflow.ai

## 🎉 Acknowledgments

Built with ❤️ for the Claude Flow community.