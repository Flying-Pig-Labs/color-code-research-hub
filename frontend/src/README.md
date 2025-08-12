# 🎨 Frontend Documentation - Color Code Research Hub

> **Complete documentation for the React frontend application**

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Component Documentation](#component-documentation)
- [State Management](#state-management)
- [Routing](#routing)
- [API Integration](#api-integration)
- [Styling System](#styling-system)
- [Development Guide](#development-guide)
- [Testing](#testing)
- [Build & Deployment](#build--deployment)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Overview

The Color Code Research Hub frontend is a modern React application built with TypeScript and Vite. It provides an intuitive interface for AI-powered project planning, research team management, and Claude Flow integration.

### Technology Stack

- **Framework**: React 19.1.0
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 7.0.5
- **Styling**: Tailwind CSS + shadcn/ui
- **Routing**: React Router v7
- **State**: React hooks (useState, useContext)
- **HTTP Client**: Native fetch API
- **Forms**: Controlled components
- **Notifications**: Toast system

## Architecture

```
Frontend Architecture
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Router                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   ResearchLandingPage │  │     PlanLandingPage │  │ │
│  │  │     (/)     │  │   (/plan)   │  │ (/claude)   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────┴───────────────────────────┐  │
│  │                    Components                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │ TeamForms   │  │ PlanWorkflow│  │ ClaudeFlow  │  │  │
│  │  │ Red/Black/  │  │ Components  │  │ Components  │  │  │
│  │  │ White       │  │             │  │             │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────┴───────────────────────────┐  │
│  │                    Services                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   API       │  │   GitHub    │  │ ClaudeFlow  │  │  │
│  │  │  Service    │  │   Service   │  │  Service    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── components/              # React components
│   ├── claude-flow/        # Claude Flow UI components
│   │   ├── ClaudeFlowInterface.tsx
│   │   ├── ExecutionList.tsx
│   │   ├── ExecutionDetails.tsx
│   │   └── SwarmVisualization.tsx
│   │
│   ├── forms/              # Research team forms
│   │   ├── BlackTeamForm.tsx
│   │   ├── RedTeamForm.tsx
│   │   └── WhiteTeamForm.tsx
│   │
│   ├── plan/               # Plan generation components
│   │   ├── PlanTab.tsx
│   │   ├── PlanWorkflow.tsx
│   │   ├── EnhancedPlanWorkflow.tsx
│   │   └── PlanGenerationProgress.tsx
│   │
│   ├── ui/                 # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   └── toast.tsx
│   │
│   └── workflow/           # Workflow components
│       ├── ParseProduct.tsx
│       ├── LifecyclePhases.tsx
│       ├── EpicIssueView.tsx
│       └── ReviewSubmit.tsx
│
├── hooks/                  # Custom React hooks
│   ├── use-toast.ts
│   ├── use-async.ts
│   ├── use-polling.ts
│   └── use-debounce.ts
│
├── lib/                    # Utilities and helpers
│   ├── utils.ts           # General utilities
│   ├── cn.ts              # className helper
│   └── constants.ts       # App constants
│
├── pages/                  # Page components
│   ├── ResearchLandingPage.tsx
│   ├── PlanLandingPage.tsx
│   └── ClaudeFlowPage.tsx
│
├── services/              # API services
│   ├── api.ts            # Base API client
│   ├── github.ts         # GitHub integration
│   ├── planGeneration.ts # Plan generation
│   └── claudeFlow.ts     # Claude Flow
│
├── types/                 # TypeScript definitions
│   ├── index.ts          # Shared types
│   ├── api.ts            # API types
│   └── components.ts     # Component types
│
├── App.tsx               # Root component
├── main.tsx             # App entry point
├── index.css            # Global styles
└── vite-env.d.ts        # Vite types
```

## Component Documentation

### Core Components

#### App.tsx
The root component that sets up routing and global providers.

```tsx
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ResearchLandingPage />} />
        <Route path="/plan/*" element={<PlanRoutes />} />
        <Route path="/claude-flow" element={<ClaudeFlowPage />} />
      </Routes>
      <Toaster />
    </Router>
  );
}
```

### Plan Generation Components

#### PlanWorkflow.tsx

Main plan generation workflow component. Handles the multi-step process of generating project plans.

**Props**:
```typescript
interface PlanWorkflowProps {
  repository: string;
  readme: string;
  onComplete: (plan: Plan) => void;
}
```

**Key Features**:
- Multi-step form workflow
- Progress tracking
- Real-time validation
- Error handling

#### EnhancedPlanWorkflow.tsx

Async version that uses the full CLI logic with 50-90 LLM calls.

**Features**:
- Long-running job support (15+ minutes)
- Real-time progress updates
- Stage-by-stage tracking
- Automatic polling

**Usage**:
```tsx
<EnhancedPlanWorkflow
  repository={selectedRepo}
  readme={readmeContent}
  onComplete={(plan) => {
    console.log('Plan generated:', plan);
  }}
/>
```

#### PlanGenerationProgress.tsx

Progress tracking component for async operations.

**Props**:
```typescript
interface ProgressProps {
  jobId: string;
  onComplete: (results: PlanResults) => void;
  onError: (error: Error) => void;
}
```

**Polling Implementation**:
```typescript
const useJobPolling = (jobId: string) => {
  const [status, setStatus] = useState<JobStatus>(null);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/plan/async/status/${jobId}`);
      const data = await response.json();
      
      setStatus(data);
      
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(interval);
  }, [jobId]);
  
  return status;
};
```

### Research Team Forms

#### RedTeamForm.tsx

Form for market disruption research requests.

**Key Fields**:
- Target company
- Analysis focus areas
- Market scope
- Timeline and investment

#### BlackTeamForm.tsx

Form for internal tool replacement research.

**Key Fields**:
- Tool categories
- Implementation complexity
- Tech stack preferences
- Resource constraints

#### WhiteTeamForm.tsx

Form for whitespace opportunity discovery.

**Key Fields**:
- Opportunity types
- Customer segments
- Business models
- Risk tolerance

### Claude Flow Components

#### ClaudeFlowInterface.tsx

Main interface for Claude Flow swarm execution.

**Features**:
- Command input
- Execution monitoring
- Log streaming
- Result visualization

#### ExecutionList.tsx

Lists all Claude Flow executions with filtering and sorting.

#### ExecutionDetails.tsx

Detailed view of a single execution with logs and metrics.

### UI Components (shadcn/ui)

Pre-built accessible components following design system:

- **Button**: Various styles (default, destructive, outline, ghost)
- **Card**: Container with header, content, footer
- **Dialog**: Modal dialogs with backdrop
- **Input**: Form inputs with validation states
- **Select**: Dropdown selection
- **Tabs**: Tab navigation
- **Toast**: Notification system

## State Management

### Local State Pattern

Components use React hooks for state management:

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);
const [data, setData] = useState<Data | null>(null);
```

### Context Pattern (Planned)

For shared state across components:

```typescript
const PlanContext = createContext<PlanContextType | null>(null);

export const PlanProvider: React.FC = ({ children }) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  
  return (
    <PlanContext.Provider value={{ plan, setPlan }}>
      {children}
    </PlanContext.Provider>
  );
};
```

### Custom Hooks

#### useAsync

Handles async operations with loading and error states:

```typescript
const { data, loading, error, execute } = useAsync(async () => {
  const response = await fetch('/api/data');
  return response.json();
});
```

#### usePolling

Polls an endpoint at regular intervals:

```typescript
const { data, stop } = usePolling('/api/status', {
  interval: 3000,
  until: (data) => data.status === 'completed'
});
```

## Routing

### Route Structure

```typescript
<Routes>
  {/* Landing Pages */}
  <Route path="/" element={<ResearchLandingPage />} />
  
  {/* Plan Generation */}
  <Route path="/plan" element={<PlanLandingPage />} />
  <Route path="/plan/select" element={<PlanTab />} />
  <Route path="/plan/generate" element={<PlanWorkflow />} />
  <Route path="/plan/async" element={<EnhancedPlanWorkflow />} />
  
  {/* Claude Flow */}
  <Route path="/claude-flow" element={<ClaudeFlowPage />} />
  <Route path="/claude-flow/execution/:id" element={<ExecutionDetails />} />
  
  {/* Research Teams */}
  <Route path="/research/red" element={<RedTeamForm />} />
  <Route path="/research/black" element={<BlackTeamForm />} />
  <Route path="/research/white" element={<WhiteTeamForm />} />
</Routes>
```

### Navigation

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Programmatic navigation
navigate('/plan/generate', { state: { repository } });
```

## API Integration

### Base API Client

```typescript
// services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  }
};
```

### Service Modules

#### Plan Generation Service

```typescript
// services/planGeneration.ts
export const planGenerationService = {
  async startAsync(params: PlanParams) {
    return api.post('/api/plan/async/start', params);
  },
  
  async getStatus(jobId: string) {
    return api.get(`/api/plan/async/status/${jobId}`);
  },
  
  async generateCLI(params: PlanParams) {
    return api.post('/api/plan/generate-cli-plan', params);
  }
};
```

#### GitHub Service

```typescript
// services/github.ts
export const githubService = {
  async listRepos(owner: string) {
    return api.get(`/api/github/repos/${owner}`);
  },
  
  async getReadme(owner: string, repo: string) {
    return api.get(`/api/github/repos/${owner}/${repo}/readme`);
  }
};
```

## Styling System

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

### Component Styling Pattern

```tsx
// Using cn() utility for conditional classes
import { cn } from "@/lib/utils";

<Button
  className={cn(
    "px-4 py-2",
    isActive && "bg-primary text-white",
    disabled && "opacity-50 cursor-not-allowed"
  )}
>
  Click me
</Button>
```

### CSS Variables

```css
/* index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode variables */
}
```

## Development Guide

### Environment Setup

1. **Clone and Install**:
```bash
git clone <repo>
cd color-code-research-hub
npm install
```

2. **Environment Variables**:
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3001
VITE_PORT=3000
```

3. **Start Development**:
```bash
npm run dev
```

### Code Standards

#### TypeScript

```typescript
// ✅ Good: Explicit types
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}

const Component: React.FC<Props> = ({ title, onSubmit }) => {
  // Component logic
};

// ❌ Bad: Implicit any
const Component = ({ title, onSubmit }) => {
  // Missing types
};
```

#### Component Structure

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types
interface ComponentProps {
  // Props definition
}

// 3. Component
export const Component: React.FC<ComponentProps> = (props) => {
  // 4. State
  const [state, setState] = useState();
  
  // 5. Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // 6. Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### Development Tools

#### VS Code Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript React code snippets

#### Browser Extensions
- React Developer Tools
- Network Inspector

## Testing

### Unit Testing (Planned)

```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

test('Button calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Integration Testing

```typescript
// API integration test
test('fetches plan status', async () => {
  const mockResponse = { status: 'COMPLETED' };
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })
  );
  
  const status = await planService.getStatus('job-123');
  expect(status).toEqual(mockResponse);
});
```

### E2E Testing (Planned)

```typescript
// Cypress test example
describe('Plan Generation', () => {
  it('generates a plan successfully', () => {
    cy.visit('/plan');
    cy.get('[data-testid="repo-select"]').select('my-repo');
    cy.get('[data-testid="generate-btn"]').click();
    cy.contains('Plan generated successfully');
  });
});
```

## Build & Deployment

### Development Build

```bash
npm run dev
# Starts Vite dev server at http://localhost:3000
```

### Production Build

```bash
npm run build
# Creates optimized build in dist/
```

### Build Analysis

```bash
npm run build -- --analyze
# Analyzes bundle size
```

### Deployment

#### AWS Amplify (Automatic)

1. Push to main branch
2. Amplify detects changes
3. Runs build process
4. Deploys to production

#### Manual Deployment

```bash
# Build locally
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-bucket --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Environment Variables

```yaml
Production (Amplify Console):
  VITE_API_BASE_URL: https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production
  
Staging:
  VITE_API_BASE_URL: https://staging-api.example.com
  
Development:
  VITE_API_BASE_URL: http://localhost:3001
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy load heavy components
const ClaudeFlowInterface = lazy(() => import('./components/claude-flow/ClaudeFlowInterface'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <ClaudeFlowInterface />
</Suspense>
```

### Memoization

```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize components
const MemoizedComponent = React.memo(Component);
```

### Image Optimization

```typescript
// Use optimized formats
<img 
  src="/image.webp"
  srcSet="/image@2x.webp 2x"
  alt="Description"
  loading="lazy"
/>
```

### Bundle Optimization

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select'],
        },
      },
    },
  },
};
```

## Troubleshooting

### Common Issues

#### 1. API Connection Errors

**Problem**: "Failed to fetch" errors

**Solution**:
```typescript
// Check environment variable
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);

// Ensure CORS is handled
const response = await fetch(url, {
  mode: 'cors',
  credentials: 'include',
});
```

#### 2. Build Failures

**Problem**: TypeScript errors during build

**Solution**:
```bash
# Check types
npm run typecheck

# Fix type errors
npm run typecheck -- --noEmit
```

#### 3. Styling Issues

**Problem**: Tailwind classes not applying

**Solution**:
```bash
# Ensure content paths are correct
# tailwind.config.js
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
]
```

#### 4. State Management Issues

**Problem**: Components not updating

**Solution**:
```typescript
// Ensure state is immutable
setState(prev => ({
  ...prev,
  newField: value
}));

// Use key prop for list items
items.map(item => (
  <Item key={item.id} {...item} />
))
```

### Debug Mode

Enable debug logging:

```typescript
// Add to main.tsx
if (import.meta.env.DEV) {
  window.DEBUG = true;
}

// Use in components
if (window.DEBUG) {
  console.log('Debug info:', data);
}
```

### Performance Profiling

```typescript
// Use React Profiler
import { Profiler } from 'react';

<Profiler id="PlanWorkflow" onRender={onRenderCallback}>
  <PlanWorkflow />
</Profiler>
```

## Best Practices

1. **Component Organization**
   - One component per file
   - Co-locate related components
   - Use index.ts for exports

2. **State Management**
   - Keep state close to where it's used
   - Lift state only when necessary
   - Use custom hooks for complex logic

3. **Performance**
   - Lazy load large components
   - Memoize expensive operations
   - Optimize re-renders

4. **Accessibility**
   - Use semantic HTML
   - Add ARIA labels
   - Test with screen readers

5. **Error Handling**
   - Use error boundaries
   - Show user-friendly messages
   - Log errors for debugging

## Related Documentation

- [API Documentation](../docs/API_DOCUMENTATION.md) - Backend API reference
- [Architecture Overview](../docs/ARCHITECTURE.md) - System architecture
- [Deployment Guide](../docs/deployment/FRONTEND_DEPLOYMENT.md) - Deployment details
- [Component Library](https://ui.shadcn.com/) - shadcn/ui documentation

---

> 💡 **Development Tip**: Use React DevTools Profiler to identify performance bottlenecks in your components.