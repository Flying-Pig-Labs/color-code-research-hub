# 🤖 Claude Flow Components

> **React components for Claude Flow swarm orchestration interface**

## Overview

This directory contains all UI components for interacting with the Claude Flow AI swarm orchestration system. These components provide a comprehensive interface for executing swarm commands, monitoring progress, and visualizing results.

## Components

### ClaudeFlowInterface.tsx

Main interface for Claude Flow interaction.

**Features:**
- Command input with syntax highlighting
- Strategy selection (research, development, analysis)
- Agent configuration
- Execution control
- Result display

**Usage:**
```tsx
<ClaudeFlowInterface
  onExecutionStart={(id) => console.log('Started:', id)}
  onExecutionComplete={(result) => console.log('Result:', result)}
  defaultCommand="sparc 'Your task here'"
/>
```

### ExecutionList.tsx

Displays a list of Claude Flow executions with filtering and sorting.

**Features:**
- Real-time status updates
- Filter by status (running, completed, failed)
- Sort by date, duration, or agent count
- Quick actions (view details, download logs)

**Usage:**
```tsx
<ExecutionList
  limit={20}
  autoRefresh={true}
  onExecutionSelect={(execution) => navigateToDetails(execution.id)}
/>
```

### ExecutionDetails.tsx

Detailed view of a single execution.

**Features:**
- Real-time log streaming
- Agent activity visualization
- Progress tracking
- Result display
- Performance metrics

**Usage:**
```tsx
<ExecutionDetails
  executionId="exec-1753631657732"
  showLogs={true}
  logTailSize={100}
/>
```

### SwarmVisualization.tsx

Visual representation of swarm topology and agent interactions.

**Features:**
- Interactive node graph
- Real-time agent status
- Task flow visualization
- Performance indicators
- Zoom and pan controls

**Usage:**
```tsx
<SwarmVisualization
  topology="hierarchical"
  agents={agentList}
  connections={taskFlows}
  interactive={true}
/>
```

## Component Architecture

```
ClaudeFlowInterface (Container)
    ├── CommandInput
    │   ├── SyntaxHighlighter
    │   └── AutoComplete
    ├── ConfigPanel
    │   ├── StrategySelector
    │   ├── AgentConfig
    │   └── AdvancedOptions
    ├── ExecutionControl
    │   ├── StartButton
    │   ├── StopButton
    │   └── ProgressBar
    └── ResultsPanel
        ├── Summary
        ├── Artifacts
        └── Actions

ExecutionMonitor (Real-time)
    ├── StatusIndicator
    ├── LogStream
    │   └── LogEntry
    ├── AgentActivity
    │   └── AgentCard
    └── MetricsPanel
        ├── PerformanceChart
        └── ResourceUsage
```

## State Management

### Local State
Components use React hooks for local state management:

```tsx
const [execution, setExecution] = useState<Execution | null>(null);
const [logs, setLogs] = useState<LogEntry[]>([]);
const [isPolling, setIsPolling] = useState(false);
```

### Real-time Updates
WebSocket connections for live data:

```tsx
useEffect(() => {
  const ws = new WebSocket(`${WS_URL}/execution/${executionId}`);
  
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    handleExecutionUpdate(update);
  };
  
  return () => ws.close();
}, [executionId]);
```

### API Integration
Service layer for Claude Flow API:

```tsx
import { claudeFlowService } from '@/services/claudeFlow';

const startExecution = async (command: string, options: ExecutionOptions) => {
  const result = await claudeFlowService.execute(command, options);
  setExecution(result);
  startPolling(result.executionId);
};
```

## Styling

Components use Tailwind CSS with custom Claude Flow theme:

```css
/* Claude Flow specific styles */
.claude-flow-command {
  @apply font-mono bg-gray-900 text-green-400 p-4 rounded-lg;
}

.agent-node {
  @apply bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center;
}

.execution-running {
  @apply border-l-4 border-yellow-500 animate-pulse;
}

.execution-completed {
  @apply border-l-4 border-green-500;
}
```

## Testing

### Unit Tests
```tsx
// ClaudeFlowInterface.test.tsx
describe('ClaudeFlowInterface', () => {
  it('should execute command on submit', async () => {
    const onStart = jest.fn();
    const { getByRole } = render(
      <ClaudeFlowInterface onExecutionStart={onStart} />
    );
    
    fireEvent.click(getByRole('button', { name: 'Execute' }));
    
    await waitFor(() => {
      expect(onStart).toHaveBeenCalled();
    });
  });
});
```

### Integration Tests
```tsx
// ExecutionFlow.test.tsx
describe('Execution Flow', () => {
  it('should complete full execution cycle', async () => {
    // Test command input → execution → monitoring → results
  });
});
```

## Performance Considerations

1. **Log Streaming**: Virtualized list for large log files
2. **Polling Optimization**: Adaptive polling intervals
3. **Memory Management**: Cleanup old execution data
4. **Lazy Loading**: Load execution details on demand

## Future Enhancements

- [ ] Voice command input
- [ ] Execution templates/presets
- [ ] Collaborative execution mode
- [ ] Advanced visualization options
- [ ] Export execution reports
- [ ] Execution comparison tool

## Related Documentation

- [Claude Flow Integration](../../../docs/features/CLAUDE_FLOW_INTEGRATION.md)
- [API Documentation](../../../docs/API_DOCUMENTATION.md#claude-flow-apis)
- [Component Guidelines](../README.md#component-guidelines)

---

> 💡 **Development Tip**: Use the ExecutionSimulator in development mode to test UI without running actual swarms.