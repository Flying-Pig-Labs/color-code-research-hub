# Monitoring Dashboard Components

This directory contains React components for integrating monitoring functionality into the Color Code Research Hub, specifically designed to enhance the RESEARCH/Runs tab with real-time Claude Flow monitoring capabilities.

## 🚀 Quick Integration

### 1. Basic Usage in RunsDashboard

```typescript
import React from 'react';
import { 
  MetricsPanel, 
  AgentGrid, 
  TaskTimeline, 
  AlertsPanel,
  useMonitoringAPI 
} from '@/components/monitoring';

const EnhancedRunsDashboard = () => {
  // Existing Claude Flow client integration
  const { data: monitoringData, loading, error } = useMonitoringAPI(
    import.meta.env.VITE_API_BASE_URL,
    'your-api-key'
  );

  return (
    <div className="space-y-6 p-4">
      {/* Existing connection status */}
      <ConnectionStatusCard />
      
      {/* NEW: Monitoring Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsPanel metrics={monitoringData?.metrics} />
        <AgentGrid agents={monitoringData?.agents} />
        <TaskTimeline tasks={monitoringData?.tasks} />
        <AlertsPanel 
          alerts={monitoringData?.alerts}
          onAcknowledge={handleAlertAcknowledge}
        />
      </div>
      
      {/* Existing task submission and logs */}
      <TaskSubmissionCard />
      <SwarmMonitorLog />
    </div>
  );
};
```

### 2. Add to claudeFlowClient Service

```typescript
// src/services/claudeFlowClient.ts
export const claudeFlowClient = {
  // ... existing methods
  
  // NEW: Monitoring endpoints
  async getDashboardData() {
    return this.request('/api/dashboard');
  },
  
  async getAgents() {
    return this.request('/api/agents');
  },
  
  async getMetrics() {
    return this.request('/api/metrics');
  },
  
  async getAlerts() {
    return this.request('/api/alerts');
  },
  
  async acknowledgeAlert(alertId: string) {
    return this.request(`/api/alerts/${alertId}/acknowledge`, { method: 'POST' });
  }
};
```

## 📦 Available Components

### MetricsPanel
Real-time system metrics with trend visualization.

```typescript
<MetricsPanel metrics={systemMetrics} />
```

**Features:**
- CPU, Memory, Active Agents, Running Tasks display
- Trend charts with recharts integration
- Threshold indicators with color-coded badges
- Responsive grid layout

### AgentGrid
Visual representation of active Claude Flow agents.

```typescript
<AgentGrid agents={activeAgents} />
```

**Features:**
- Agent status indicators (active, idle, error, offline)
- Agent type icons (coder, researcher, tester, etc.)
- Current task display
- Performance metrics per agent
- Responsive card layout

### TaskTimeline
Task execution progress and timeline.

```typescript
<TaskTimeline tasks={runningTasks} />
```

**Features:**
- Task status tracking (pending, running, completed, failed)
- Progress bars with percentage
- Duration tracking
- Hierarchical subtask support
- Priority indicators

### AlertsPanel
Active alerts and notifications management.

```typescript
<AlertsPanel 
  alerts={alerts}
  onAcknowledge={handleAcknowledge}
/>
```

**Features:**
- Active vs acknowledged alerts separation
- Priority-based sorting
- Alert type indicators (error, warning, info)
- One-click acknowledgment
- Scrollable alert history

### PerformanceChart
Historical performance trends visualization.

```typescript
<PerformanceChart 
  data={performanceData}
  timeRange="1h"
  showLegend={true}
/>
```

**Features:**
- CPU and Memory usage trends
- Throughput and response time charts
- Configurable time ranges
- Interactive tooltips
- Dual-axis chart support

## 🔌 Hooks

### useMonitoringAPI
Fetches monitoring data with automatic polling and retry logic.

```typescript
const { data, error, loading, refetch } = useMonitoringAPI(
  apiUrl,
  apiKey,
  {
    pollingInterval: 5000,
    retryAttempts: 3,
    enabled: true
  }
);
```

### useSSE
Server-Sent Events for real-time updates.

```typescript
const { data, status } = useSSE(
  `${apiUrl}/api/stream`,
  apiKey,
  {
    reconnectAttempts: 5,
    enabled: true
  }
);
```

## 🎨 Theming

All components use the existing shadcn/ui theme system:

- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Badge` with variants: `default`, `secondary`, `destructive`, `outline`
- `Button` with consistent styling
- `Progress` bars with primary color
- `ScrollArea` for content overflow

### Color Scheme
- **Primary**: Blue theme (`hsl(var(--primary))`)
- **Success**: Green (`text-green-500`)
- **Warning**: Yellow (`text-yellow-500`)  
- **Error**: Red (`text-red-500`, `text-destructive`)
- **Muted**: Gray (`text-muted-foreground`)

## 📊 Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Claude Flow   │────▶│  Monitoring API  │────▶│   React UI      │
│   Swarm Engine  │     │  (REST + SSE)    │     │   Components    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         │                       ▼                         │
         │              ┌──────────────────┐               │
         └─────────────▶│  useMonitoringAPI │◀──────────────┘
                        │     Hook          │
                        └──────────────────┘
```

## 🚀 Performance Optimizations

1. **Polling Strategy**
   - Dashboard data: 5 seconds
   - Detailed data: 10 seconds
   - Metrics with trends: 5 seconds

2. **Data Transformation**
   - API responses cached in hook
   - Minimal re-renders with React.memo potential
   - Trend data limited to last 10 points

3. **Error Handling**
   - Exponential backoff for retries
   - Graceful degradation on API failures
   - Individual component error boundaries

## 🔧 Configuration

### Environment Variables
```bash
VITE_API_BASE_URL=https://your-api-gateway.amazonaws.com/production
VITE_MONITORING_API_KEY=your-api-key  # Optional: if different from main API
```

### API Endpoints Expected
```
GET /api/dashboard     - Aggregated dashboard data
GET /api/agents        - Active agents list
GET /api/tasks         - Task status and progress
GET /api/alerts        - Active and recent alerts
GET /api/metrics       - Detailed system metrics
GET /api/stream        - SSE endpoint for real-time updates
POST /api/alerts/{id}/acknowledge - Acknowledge alert
```

## 🧪 Testing

```bash
# Test individual components
npm test -- MetricsPanel
npm test -- AgentGrid
npm test -- TaskTimeline
npm test -- AlertsPanel

# Test hooks
npm test -- useMonitoringAPI
npm test -- useSSE
```

## 📝 Development Notes

1. **Component Structure**: Each component is self-contained with proper TypeScript interfaces
2. **Error Boundaries**: Consider wrapping in error boundaries for production
3. **Accessibility**: All components include proper ARIA labels and keyboard navigation
4. **Responsive Design**: Components adapt to different screen sizes
5. **Performance**: Use React.memo for components with frequent updates

## 🔄 Integration Checklist

- [ ] Install recharts: `npm install recharts`
- [ ] Copy monitoring components to `/src/components/monitoring/`
- [ ] Update claudeFlowClient with monitoring endpoints
- [ ] Add monitoring components to RunsDashboard
- [ ] Configure environment variables
- [ ] Test API connectivity
- [ ] Verify real-time updates
- [ ] Test responsive design
- [ ] Add error boundaries
- [ ] Performance testing

This monitoring system provides comprehensive visibility into Claude Flow swarm operations while maintaining consistency with the existing Color Code Research Hub design system.