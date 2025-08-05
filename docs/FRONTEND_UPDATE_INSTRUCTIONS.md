# Frontend Update Instructions for User-Based S3 Structure

## Overview

The S3 storage has been migrated from a flat structure to a user-based organization. The frontend needs updates to handle user context and new S3 paths.

## Required Frontend Changes

### 1. Add User Context to All API Calls

Currently, the frontend doesn't send user information. We need to add user context to every API request.

#### Option A: Add User Header (Recommended for Now)
```typescript
// src/services/api-client.ts or similar
const apiClient = {
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': 'fprior',  // TODO: Get from auth context
    'X-User-Email': 'fprior@oceanstudio.io'  // Optional
  }
};
```

#### Option B: Add User to Request Body
```typescript
// When calling research API
const response = await fetch(`${API_BASE_URL}/api/research`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...requestData,
    userId: 'fprior',  // Add user context
    scope: 'personal'  // or 'project'
  })
});
```

### 2. Update Research API Service

**File**: `src/services/researchApi.ts`

```typescript
// Add user context to all research requests
export const performResearch = async (
  content: string,
  metadata: ResearchMetadata,
  userId: string = 'fprior'  // TODO: Get from auth context
): Promise<ResearchResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/research`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId  // Add user header
    },
    body: JSON.stringify({
      content,
      metadata,
      // Add user context to body as well
      context: {
        userId,
        scope: 'personal',  // or 'project' based on UI selection
        projectId: metadata.projectId || null
      }
    })
  });
  
  return response.json();
};
```

### 3. Update Report Service

**File**: `src/services/reportService.ts` (if exists)

```typescript
export const generateReport = async (
  task: string,
  team: string,
  userId: string = 'fprior'
): Promise<ReportResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/reports/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId
    },
    body: JSON.stringify({
      task,
      team,
      context: {
        userId,
        scope: team ? 'team' : 'personal'
      }
    })
  });
  
  return response.json();
};
```

### 4. Add User Context Provider

Create a context to manage user information across the app:

**File**: `src/contexts/UserContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
  userId: string;
  userEmail: string;
  scope: 'personal' | 'project' | 'team';
  currentProject?: string;
  setScope: (scope: 'personal' | 'project' | 'team') => void;
  setCurrentProject: (projectId: string | undefined) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // TODO: Get actual user from auth system
  const [userId] = useState('fprior');
  const [userEmail] = useState('fprior@oceanstudio.io');
  const [scope, setScope] = useState<'personal' | 'project' | 'team'>('personal');
  const [currentProject, setCurrentProject] = useState<string | undefined>();

  return (
    <UserContext.Provider value={{
      userId,
      userEmail,
      scope,
      currentProject,
      setScope,
      setCurrentProject
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
```

### 5. Update App Root

**File**: `src/App.tsx` or `src/main.tsx`

```typescript
import { UserProvider } from './contexts/UserContext';

function App() {
  return (
    <UserProvider>
      {/* Your existing app components */}
    </UserProvider>
  );
}
```

### 6. Update Components to Use User Context

**Example**: Update research components

```typescript
import { useUser } from '../contexts/UserContext';

export const ResearchForm: React.FC = () => {
  const { userId, scope, currentProject } = useUser();
  
  const handleSubmit = async (formData: any) => {
    const response = await performResearch(
      formData.content,
      {
        ...formData.metadata,
        projectId: currentProject
      },
      userId
    );
    // Handle response
  };
  
  return (
    // Your form JSX
  );
};
```

### 7. Add Scope Selector UI

Add a UI element to let users choose between personal and project scope:

```typescript
export const ScopeSelector: React.FC = () => {
  const { scope, setScope, currentProject, setCurrentProject } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  
  useEffect(() => {
    // TODO: Fetch user's projects
    fetchUserProjects().then(setProjects);
  }, []);
  
  return (
    <div className="scope-selector">
      <select 
        value={scope} 
        onChange={(e) => setScope(e.target.value as any)}
      >
        <option value="personal">Personal Workspace</option>
        <option value="project">Project</option>
        <option value="team">Team</option>
      </select>
      
      {scope === 'project' && (
        <select 
          value={currentProject} 
          onChange={(e) => setCurrentProject(e.target.value)}
        >
          <option value="">Select a project...</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}
    </div>
  );
};
```

### 8. Update History/List Views

When displaying research history or report lists, show the scope:

```typescript
export const ResearchHistory: React.FC = () => {
  const { userId } = useUser();
  const [items, setItems] = useState<ResearchItem[]>([]);
  
  useEffect(() => {
    // Fetch with user context
    fetch(`${API_BASE_URL}/api/research/history`, {
      headers: {
        'X-User-Id': userId
      }
    })
    .then(res => res.json())
    .then(setItems);
  }, [userId]);
  
  return (
    <div className="research-history">
      {items.map(item => (
        <div key={item.id} className="history-item">
          <span className="scope-badge">
            {item.scope === 'personal' ? '👤' : '📁'} {item.scope}
          </span>
          <h3>{item.title}</h3>
          {item.projectId && <span className="project">{item.projectId}</span>}
        </div>
      ))}
    </div>
  );
};
```

## Environment Variables

Add these to your `.env` file:

```bash
# User Configuration (temporary until auth is implemented)
VITE_DEFAULT_USER_ID=fprior
VITE_DEFAULT_USER_EMAIL=fprior@oceanstudio.io
```

## Testing the Updates

1. **Test Personal Workspace**:
   - Set scope to "personal"
   - Create a research request
   - Verify it's stored under `/users/fprior/personal/`

2. **Test Project Scope**:
   - Set scope to "project"
   - Select a project
   - Create a research request
   - Verify it's stored under `/users/fprior/projects/{project-id}/`

3. **Test Headers**:
   - Open Network tab in browser
   - Make a request
   - Verify `X-User-Id` header is present

## Migration Checklist

- [ ] Add UserContext provider
- [ ] Update API client to include user headers
- [ ] Update researchApi.ts service
- [ ] Update report services
- [ ] Add scope selector UI
- [ ] Update history/list views
- [ ] Test personal workspace
- [ ] Test project scope
- [ ] Verify S3 paths are correct

## Future Enhancements

1. **Authentication Integration**:
   - Replace hardcoded userId with actual auth
   - Get user info from JWT token or session

2. **Project Management**:
   - Add UI to create/manage projects
   - Project collaboration features

3. **Team Features**:
   - Team selector
   - Team member management
   - Shared team projects

## API Response Changes

The API responses will now include user context:

```typescript
interface ResearchResponse {
  id: string;
  content: string;
  metadata: {
    userId: string;
    scope: 'personal' | 'project' | 'team';
    projectId?: string;
    teamId?: string;
    s3Path: string;  // New user-based path
    // ... other fields
  };
}
```

## Backward Compatibility

During the transition period:
1. Frontend sends user context in headers
2. Backend checks for user context
3. If missing, defaults to 'fprior' (temporary)
4. Old S3 paths still accessible (read-only)

## Questions?

Contact the backend team if you need:
- Different user IDs for testing
- Help with API integration
- Access to new S3 paths
- Project/team setup