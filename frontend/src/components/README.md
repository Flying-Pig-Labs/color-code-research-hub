# 🧩 Components Directory

> **React components organized by feature and functionality**

## 📁 Directory Structure

```
components/
├── claude-flow/        # Claude Flow swarm orchestration UI
├── forms/              # Research team forms (Red, Black, White)
├── plan/               # Plan generation components
├── ui/                 # Reusable UI components (shadcn/ui)
└── workflow/           # Multi-step workflow components
```

## 📋 Component Categories

### 🤖 claude-flow/
Claude Flow integration components for AI swarm orchestration.

**Key Components:**
- `ClaudeFlowInterface.tsx` - Main command interface
- `ExecutionList.tsx` - List and filter executions
- `ExecutionDetails.tsx` - Detailed execution view with logs
- `SwarmVisualization.tsx` - Visual swarm topology

### 📝 forms/
Specialized forms for research team requests.

**Team Forms:**
- `RedTeamForm.tsx` - Market disruption research
- `BlackTeamForm.tsx` - Internal tool replacement
- `WhiteTeamForm.tsx` - Whitespace opportunity discovery

### 📊 plan/
Project plan generation and visualization components.

**Core Components:**
- `PlanTab.tsx` - Repository selection interface
- `PlanWorkflow.tsx` - Synchronous plan generation
- `EnhancedPlanWorkflow.tsx` - Async plan generation with progress
- `PlanGenerationProgress.tsx` - Real-time progress tracking

### 🎨 ui/
Reusable UI components from shadcn/ui library.

**Available Components:**
- `button.tsx` - Various button styles
- `card.tsx` - Container components
- `dialog.tsx` - Modal dialogs
- `input.tsx` - Form inputs
- `select.tsx` - Dropdown selections
- `tabs.tsx` - Tab navigation
- `toast.tsx` - Notifications

### 🔄 workflow/
Multi-step workflow components for plan generation.

**Workflow Steps:**
- `ParseProduct.tsx` - Step 1: Parse README
- `LifecyclePhases.tsx` - Step 2: Review phases
- `EpicIssueView.tsx` - Step 3: Review epics/issues
- `ReviewSubmit.tsx` - Step 4: Final review

## 🚀 Quick Start

### Using a Component

```tsx
import { Button } from '@/components/ui/button';
import { PlanWorkflow } from '@/components/plan/PlanWorkflow';

function MyComponent() {
  return (
    <div>
      <Button onClick={handleClick}>Generate Plan</Button>
      <PlanWorkflow 
        repository="owner/repo"
        readme={readmeContent}
        onComplete={handlePlanComplete}
      />
    </div>
  );
}
```

### Creating a New Component

1. Choose the appropriate directory based on functionality
2. Create component file with TypeScript: `ComponentName.tsx`
3. Export from index file if creating a new category
4. Add documentation in component file
5. Write tests in `__tests__/` directory

## 📐 Component Guidelines

### File Structure

```tsx
// ComponentName.tsx
import React from 'react';
import { ComponentProps } from './types';

/**
 * Brief description of what the component does
 * 
 * @example
 * <ComponentName prop="value" />
 */
export const ComponentName: React.FC<ComponentProps> = ({
  prop1,
  prop2,
  onAction
}) => {
  // Component implementation
  return <div>...</div>;
};
```

### Naming Conventions

- **Files**: PascalCase (e.g., `MyComponent.tsx`)
- **Components**: PascalCase (e.g., `MyComponent`)
- **Props interfaces**: `ComponentNameProps`
- **Directories**: kebab-case (e.g., `claude-flow`)

### Best Practices

1. **Single Responsibility**: Each component should do one thing well
2. **Props Interface**: Always define TypeScript interfaces
3. **Documentation**: Include JSDoc comments
4. **Accessibility**: Use semantic HTML and ARIA attributes
5. **Performance**: Use React.memo for expensive components
6. **Testing**: Write unit tests for all components

## 🔗 Related Documentation

- [Frontend Documentation](../README.md) - Main frontend docs
- [UI Component Library](https://ui.shadcn.com/) - shadcn/ui documentation
- [Component Patterns](../../docs/guides/COMPONENT_PATTERNS.md) - Best practices

---

> 💡 **Tip**: When creating new components, check existing ones first. We might already have what you need!