# Claude Flow Monitoring Dashboard - Amplify Integration Guide

This directory contains the React components for integrating the Claude Flow monitoring dashboard into your existing Amplify application.

## 📋 Prerequisites

- Existing Amplify React application
- Monitoring API deployed on EC2 (see [EC2 README](../ec2/README.md))
- Tab/route already created in your Amplify app for monitoring

## 🚀 Quick Integration

### 1. Copy Components to Your Amplify App

```bash
# From your Amplify app root directory
cp -r path/to/monitoring-dashboard/amplify/src/components/Monitoring src/components/

# Install required dependencies
npm install axios recharts
```

### 2. Add Environment Variables

Add to your Amplify environment variables:

```bash
# In Amplify Console > App settings > Environment variables
REACT_APP_MONITORING_API_URL=https://your-ec2-monitoring-api.com/api
REACT_APP_MONITORING_API_KEY=your-secure-api-key
```

### 3. Integrate into Your Existing Tab

```tsx
// In your existing monitoring tab component
import { MonitoringDashboard } from './components/Monitoring/MonitoringDashboard';

function MonitoringTab() {
  const apiUrl = process.env.REACT_APP_MONITORING_API_URL;
  const apiKey = process.env.REACT_APP_MONITORING_API_KEY;

  if (!apiUrl || !apiKey) {
    return <div>Monitoring configuration missing</div>;
  }

  return (
    <MonitoringDashboard 
      apiUrl={apiUrl}
      apiKey={apiKey}
    />
  );
}

export default MonitoringTab;
```

## 🎨 Component Structure

```
src/components/Monitoring/
├── MonitoringDashboard.tsx    # Main dashboard component
├── MetricsPanel.tsx           # System metrics display
├── AgentGrid.tsx              # Agent status grid
├── TaskTimeline.tsx           # Task execution timeline
├── AlertsPanel.tsx            # Active alerts
├── hooks/
│   ├── useMonitoringAPI.ts    # HTTP polling hook
│   └── useSSE.ts              # Server-sent events hook
├── types/
│   └── monitoring.types.ts    # TypeScript definitions
└── MonitoringDashboard.css    # Styles
```

## 🔧 Configuration Options

### MonitoringDashboard Props

```tsx
interface MonitoringDashboardProps {
  apiUrl: string;           // Base URL for monitoring API
  apiKey: string;           // API authentication key
  theme?: 'light' | 'dark'; // Optional theme
  refreshInterval?: number; // Polling interval in ms (default: 5000)
  enableSSE?: boolean;      // Enable real-time updates (default: true)
  compactView?: boolean;    // Compact view for smaller screens
}
```

### Usage Examples

#### Basic Integration
```tsx
<MonitoringDashboard 
  apiUrl={apiUrl}
  apiKey={apiKey}
/>
```

#### Custom Configuration
```tsx
<MonitoringDashboard 
  apiUrl={apiUrl}
  apiKey={apiKey}
  theme="dark"
  refreshInterval={10000}
  compactView={isMobile}
/>
```

#### With Error Handling
```tsx
function MonitoringTab() {
  const [error, setError] = useState(null);

  return (
    <ErrorBoundary 
      fallback={<div>Monitoring temporarily unavailable</div>}
      onError={setError}
    >
      <MonitoringDashboard 
        apiUrl={apiUrl}
        apiKey={apiKey}
      />
      {error && <div className="error-banner">{error.message}</div>}
    </ErrorBoundary>
  );
}
```

## 💅 Styling

### Using Your App's Theme

```css
/* In your app's CSS, override monitoring styles */
.monitoring-dashboard {
  --monitoring-primary: var(--your-app-primary);
  --monitoring-background: var(--your-app-background);
  --monitoring-text: var(--your-app-text);
  --monitoring-border: var(--your-app-border);
}
```

### Responsive Design

The dashboard is responsive by default. For custom breakpoints:

```css
/* Tablet view */
@media (max-width: 768px) {
  .monitoring-dashboard .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* Mobile view */
@media (max-width: 480px) {
  .monitoring-dashboard {
    padding: 10px;
  }
  
  .monitoring-dashboard .metrics-panel {
    flex-direction: column;
  }
}
```

## 🔌 Advanced Integration

### Custom Data Fetching

```tsx
import { useMonitoringAPI } from './components/Monitoring/hooks/useMonitoringAPI';

function CustomMonitoringView() {
  const { data, error, loading, refetch } = useMonitoringAPI(
    apiUrl,
    apiKey,
    { pollingInterval: 10000 }
  );

  // Custom rendering logic
  return (
    <div>
      {loading && <Spinner />}
      {error && <ErrorMessage error={error} onRetry={refetch} />}
      {data && <CustomVisualization data={data} />}
    </div>
  );
}
```

### SSE Integration Only

```tsx
import { useSSE } from './components/Monitoring/hooks/useSSE';

function RealtimeAlerts() {
  const { data, status } = useSSE(`${apiUrl}/stream`, apiKey);

  useEffect(() => {
    if (data?.alerts) {
      // Handle real-time alerts
      showNotification(data.alerts);
    }
  }, [data]);

  return <div>Status: {status}</div>;
}
```

### State Management Integration

```tsx
// If using Redux/Context
import { useDispatch } from 'react-redux';
import { updateMonitoringData } from './store/monitoringSlice';

function MonitoringContainer() {
  const dispatch = useDispatch();
  const { data } = useMonitoringAPI(apiUrl, apiKey);

  useEffect(() => {
    if (data) {
      dispatch(updateMonitoringData(data));
    }
  }, [data, dispatch]);

  return <MonitoringDashboard apiUrl={apiUrl} apiKey={apiKey} />;
}
```

## 📱 Amplify Build Settings

Update your `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
  customHeaders:
    - pattern: '**/*'
      headers:
        - key: 'X-Frame-Options'
          value: 'SAMEORIGIN'
        - key: 'X-Content-Type-Options'
          value: 'nosniff'
```

## 🔒 Security Considerations

### 1. API Key Management

Never commit API keys. Use Amplify environment variables:

```tsx
// Good ✅
const apiKey = process.env.REACT_APP_MONITORING_API_KEY;

// Bad ❌
const apiKey = 'hardcoded-api-key';
```

### 2. Content Security Policy

Add to your app's CSP:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               connect-src 'self' https://your-monitoring-api.com; 
               img-src 'self' data:;">
```

### 3. CORS Configuration

Ensure your EC2 monitoring API allows your Amplify domain:

```bash
# In EC2 .env
CORS_ORIGIN=https://your-app.amplifyapp.com
```

## 🚀 Performance Optimization

### 1. Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const MonitoringDashboard = lazy(() => 
  import('./components/Monitoring/MonitoringDashboard')
);

function MonitoringTab() {
  return (
    <Suspense fallback={<div>Loading monitoring...</div>}>
      <MonitoringDashboard apiUrl={apiUrl} apiKey={apiKey} />
    </Suspense>
  );
}
```

### 2. Memoization

```tsx
import { memo, useMemo } from 'react';

const MemoizedMetricsPanel = memo(MetricsPanel);

function Dashboard({ data }) {
  const metrics = useMemo(() => 
    processMetrics(data.metrics), 
    [data.metrics]
  );
  
  return <MemoizedMetricsPanel metrics={metrics} />;
}
```

### 3. Request Deduplication

The monitoring hooks already implement deduplication, but for custom requests:

```tsx
const cache = new Map();

async function fetchWithCache(url, options) {
  const key = `${url}-${JSON.stringify(options)}`;
  
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < 5000) { // 5 second cache
      return data;
    }
  }
  
  const data = await fetch(url, options).then(r => r.json());
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

## 🎨 UI Customization Examples

### Custom Metric Cards

```tsx
// Create custom metric visualization
function CustomMetricCard({ metric }) {
  return (
    <div className="custom-metric-card">
      <h3>{metric.name}</h3>
      <div className="metric-value">{metric.value}</div>
      <TrendChart data={metric.history} />
    </div>
  );
}
```

### Agent Status Badges

```tsx
// Custom agent status display
function AgentBadge({ agent }) {
  const statusColor = {
    active: 'green',
    idle: 'yellow',
    error: 'red'
  }[agent.status];
  
  return (
    <div className={`agent-badge ${statusColor}`}>
      <span className="agent-type">{agent.type}</span>
      <span className="agent-status">{agent.status}</span>
    </div>
  );
}
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check EC2 API CORS configuration
   - Verify Amplify domain is whitelisted
   - Try using proxy in development

2. **SSE Connection Drops**
   - Check Amplify timeout settings
   - Implement reconnection logic (already included)
   - Fall back to polling if needed

3. **Authentication Failures**
   - Verify API key in environment variables
   - Check API key format and headers
   - Ensure API key hasn't expired

### Debug Mode

Enable debug logging:

```tsx
// In your app initialization
if (process.env.NODE_ENV === 'development') {
  window.MONITORING_DEBUG = true;
}
```

## 📚 Additional Resources

- [Amplify Environment Variables](https://docs.amplify.aws/guides/environment-variables/)
- [React Performance Optimization](https://react.dev/reference/react)
- [SSE Browser Compatibility](https://caniuse.com/eventsource)

## 🔗 Next Steps

1. Test the integration in your development environment
2. Configure production API endpoints
3. Set up error tracking (e.g., Sentry)
4. Add custom visualizations as needed
5. Implement user preferences storage

For backend setup, see the [EC2 Deployment Guide](../ec2/README.md).