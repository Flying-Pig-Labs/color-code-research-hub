# PLAN Tab Component Specifications

## Component Hierarchy

```
App.tsx
└── MainLayout.tsx (new)
    ├── TabNavigation.tsx (new)
    └── TabContent.tsx (new)
        ├── ResearchTab.tsx (existing teams)
        ├── PlanTab.tsx (new)
        │   ├── RepoSelector.tsx
        │   ├── RepoDetails.tsx
        │   ├── GenerationWizard.tsx
        │   │   ├── ParseProduct.tsx (from agent-team-composer)
        │   │   ├── LifecyclePhases.tsx (from agent-team-composer)
        │   │   ├── EpicIssueView.tsx (from agent-team-composer)
        │   │   └── ReviewSubmit.tsx (from agent-team-composer)
        │   ├── ProgressTracker.tsx
        │   └── ResultsView.tsx
        └── BuildTab.tsx (future)
```

## Detailed Component Specifications

### 1. MainLayout.tsx
```typescript
interface MainLayoutProps {
  children: React.ReactNode;
}

// Features:
// - Contains header with app title
// - Tab navigation bar
// - Active tab content area
// - Maintains tab state in URL params
```

### 2. TabNavigation.tsx
```typescript
interface TabNavigationProps {
  activeTab: 'research' | 'plan' | 'build';
  onTabChange: (tab: string) => void;
}

// Features:
// - Three tabs: RESEARCH, PLAN, BUILD
// - Visual indicator for active tab
// - Smooth transitions between tabs
// - Mobile responsive
```

### 3. PlanTab.tsx
```typescript
interface PlanTabProps {
  githubToken?: string;
}

interface PlanTabState {
  selectedRepo: Repository | null;
  generationJob: Job | null;
  results: GenerationResults | null;
  step: WizardStep;
}

// Features:
// - Main container for PLAN functionality
// - Manages workflow state
// - Handles API calls
// - Progress tracking
```

### 4. RepoSelector.tsx
```typescript
interface RepoSelectorProps {
  onSelectRepo: (repo: Repository) => void;
  selectedRepo?: Repository;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  updated_at: string;
  has_readme: boolean;
}

// Features:
// - Fetch repos from GitHub API
// - Search/filter functionality
// - Sort by: updated, stars, name
// - Grid/list view toggle
// - Pagination
// - Loading states
```

### 5. RepoDetails.tsx
```typescript
interface RepoDetailsProps {
  repo: Repository;
  onAnalyze: () => void;
}

// Features:
// - Display repo metadata
// - Fetch and show README preview
// - "Analyze Repository" CTA button
// - Show last analysis date if exists
```

### 6. GenerationWizard.tsx
```typescript
interface GenerationWizardProps {
  repo: Repository;
  readmeContent: string;
  onComplete: (results: GenerationResults) => void;
  onCancel: () => void;
}

// Features:
// - Wrapper for agent-team-composer components
// - Step management
// - Progress persistence
// - Error recovery
```

### 7. ProgressTracker.tsx
```typescript
interface ProgressTrackerProps {
  jobId: string;
  onComplete: (results: any) => void;
  onError: (error: Error) => void;
}

interface ProgressUpdate {
  state: string;
  progress: number;
  message: string;
  timestamp: Date;
}

// Features:
// - WebSocket connection for real-time updates
// - Progress bar with percentage
// - Step-by-step status messages
// - Estimated time remaining
// - Cancel operation button
```

### 8. ResultsView.tsx
```typescript
interface ResultsViewProps {
  results: GenerationResults;
  repo: Repository;
  onExport: (format: 'json' | 'markdown') => void;
  onPushToGitHub: () => void;
}

interface GenerationResults {
  summary: ProjectSummary;
  phases: Phase[];
  epics: Epic[];
  issues: Issue[];
  metadata: {
    generatedAt: Date;
    duration: number;
    aiModel: string;
  };
}

// Features:
// - Summary statistics
// - Expandable phase/epic/issue tree
// - Export options
// - Push to GitHub button
// - Share results link
```

## State Management

### Using React Query for API calls:
```typescript
// Hooks
useGitHubRepos(token: string)
useRepoReadme(owner: string, repo: string)
useGenerationJob(jobId: string)
useGenerationResults(jobId: string)
```

### Local State with useReducer:
```typescript
interface PlanTabState {
  step: 'SELECT_REPO' | 'ANALYZE' | 'GENERATE' | 'REVIEW' | 'COMPLETE';
  selectedRepo: Repository | null;
  readmeContent: string | null;
  generationJob: Job | null;
  results: GenerationResults | null;
  error: Error | null;
}

type PlanTabAction = 
  | { type: 'SELECT_REPO'; repo: Repository }
  | { type: 'SET_README'; content: string }
  | { type: 'START_GENERATION'; jobId: string }
  | { type: 'UPDATE_PROGRESS'; progress: ProgressUpdate }
  | { type: 'SET_RESULTS'; results: GenerationResults }
  | { type: 'SET_ERROR'; error: Error }
  | { type: 'RESET' };
```

## API Integration

### GitHub API Calls:
```typescript
// List repositories
GET https://api.github.com/user/repos
Headers: { Authorization: `token ${GITHUB_TOKEN}` }

// Get repository details
GET https://api.github.com/repos/:owner/:repo

// Get README
GET https://api.github.com/repos/:owner/:repo/readme
```

### Backend API Calls:
```typescript
// Start generation job
POST /api/agent-composer/generate
Body: {
  repo: Repository,
  readmeContent: string,
  options: GenerationOptions
}
Response: { jobId: string }

// Check job status
GET /api/agent-composer/status/:jobId
Response: { 
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress: number,
  message: string
}

// Get results
GET /api/agent-composer/results/:jobId
Response: GenerationResults
```

### WebSocket for Progress:
```typescript
// Connect to progress updates
const ws = new WebSocket(`${WS_URL}/progress/${jobId}`);

ws.onmessage = (event) => {
  const update: ProgressUpdate = JSON.parse(event.data);
  // Update UI with progress
};
```

## Styling Guidelines

### Use existing Tailwind classes and shadcn/ui components:
```tsx
// Card layouts
<Card className="p-6">
  <CardHeader>
    <CardTitle>Repository Selection</CardTitle>
    <CardDescription>Choose a repository to analyze</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Consistent spacing
<div className="space-y-4">
  {/* Vertically spaced items */}
</div>

// Loading states
<Skeleton className="h-32 w-full" />

// Error states
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>{error.message}</AlertDescription>
</Alert>
```

## Mobile Responsiveness

### Breakpoint handling:
```tsx
// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Repository cards */}
</div>

// Tab navigation
<TabsList className="grid w-full grid-cols-3">
  {/* Tabs stretch on mobile */}
</TabsList>

// Drawer for mobile wizard
<Sheet open={isWizardOpen} onOpenChange={setIsWizardOpen}>
  <SheetContent side="bottom" className="h-[90vh]">
    <GenerationWizard />
  </SheetContent>
</Sheet>
```

## Error Handling

### Graceful degradation:
```typescript
// Network errors
try {
  const repos = await fetchRepos();
} catch (error) {
  if (error.status === 401) {
    showAuthError("GitHub token expired");
  } else if (!navigator.onLine) {
    showOfflineMessage();
  } else {
    showGenericError(error);
  }
}

// Generation failures
const retryGeneration = async (jobId: string, attempt = 1) => {
  try {
    await generatePlan(jobId);
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await delay(RETRY_DELAY * attempt);
      return retryGeneration(jobId, attempt + 1);
    }
    throw error;
  }
};
```

## Performance Optimization

### Lazy loading:
```typescript
// Code split the wizard components
const GenerationWizard = lazy(() => import('./GenerationWizard'));

// Virtualize long lists
import { VirtualList } from '@tanstack/react-virtual';

// Debounce search
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  []
);
```

### Caching:
```typescript
// React Query cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Local storage for drafts
const saveDraft = (data: Partial<GenerationResults>) => {
  localStorage.setItem(`draft-${repoId}`, JSON.stringify(data));
};
```

## Testing Strategy

### Component tests:
```typescript
// RepoSelector.test.tsx
describe('RepoSelector', () => {
  it('displays repositories from API', async () => {
    // Mock API response
    // Render component
    // Assert repos displayed
  });
  
  it('filters repositories by search term', () => {
    // Type in search
    // Assert filtered results
  });
});
```

### Integration tests:
```typescript
// PlanTab.integration.test.tsx
describe('Plan Tab Integration', () => {
  it('completes full workflow from repo selection to results', async () => {
    // Select repo
    // Start generation
    // Mock WebSocket updates
    // Assert final results
  });
});
```

## Accessibility

### ARIA labels and keyboard navigation:
```tsx
<button
  aria-label="Select repository"
  onKeyDown={handleKeyDown}
  tabIndex={0}
>
  {repo.name}
</button>

// Focus management
useEffect(() => {
  if (step === 'COMPLETE') {
    resultsRef.current?.focus();
  }
}, [step]);
```

This component architecture provides a solid foundation for integrating the Agent Team Composer functionality into the Color Code Research Hub while maintaining consistency with the existing application structure and design patterns.