# Form Update Example - Adding EC2 Integration

Here's how to update your existing forms to use the EC2 integration with GitHub polling:

## Example: Updating BlackResearchSwarmForm.tsx

```typescript
// Add these imports
import { generateRepoId, getExpectedRepoName } from "@/utils/idGenerator";
import { toast } from "sonner";

// In your component, modify the handleLaunchSwarm function:

const handleLaunchSwarm = async () => {
  // Generate unique repo ID for tracking
  const repoId = generateRepoId();
  const expectedRepoName = getExpectedRepoName('black', repoId);
  
  const researchData = {
    toolCategories,
    informationSources,
    implementationComplexity,
    teamSizeConstraint,
    techStackPreference,
    costComparisonBaseline,
    customCostThreshold: costComparisonBaseline === "custom_threshold" ? parseFloat(customCostThreshold) : undefined,
    evidenceThreshold: evidenceThreshold[0],
    existingTools,
    timeToMarket,
  };

  setIsSubmitting(true);

  try {
    // Check if EC2 is configured
    const useEC2 = import.meta.env.VITE_EC2_WEBHOOK_URL;
    
    if (useEC2) {
      // Submit to EC2 endpoint
      const response = await fetch('/api/ec2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamType: 'black',
          formData: researchData,
          repoId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit to EC2');
      }
      
      const { jobId } = await response.json();
      
      // Store in localStorage with repoId
      const existingTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
      const newTask = {
        id: jobId,
        repoId, // Important: Store the repoId for GitHub polling
        team: 'black',
        vendorName: existingTools.join(', ') || 'Various Tools',
        createdAt: new Date().toISOString(),
        status: 'submitted',
        customizations: researchData,
        githubStatus: 'pending'
      };
      
      existingTasks.push(newTask);
      localStorage.setItem('researchTasks', JSON.stringify(existingTasks));
      
      // Trigger table update
      window.dispatchEvent(new Event('taskAdded'));
      
      toast.success('Research submitted to EC2!', {
        description: `Tracking ID: ${repoId}. Check the table below for GitHub repo status.`
      });
      
    } else {
      // Fallback to existing local behavior
      const { jobId } = await apiService.submitResearch({
        teamType: 'black',
        fields: researchData,
      });
      
      // ... existing local handling code ...
    }
    
    setOpen(false);
    handleReset();
    
  } catch (error) {
    console.error('Submission error:', error);
    showApiError(error as ApiError);
  } finally {
    setIsSubmitting(false);
  }
};
```

## Environment Setup

Add these to your `.env.local`:

```env
# EC2 Configuration
VITE_EC2_WEBHOOK_URL=http://YOUR-EC2-IP
VITE_GITHUB_ORG=your-github-org
VITE_GITHUB_TOKEN=ghp_xxxxx  # Optional, for private repos
```

Add these to your `backend/.env`:

```env
# EC2 Proxy Configuration
EC2_WEBHOOK_URL=http://YOUR-EC2-IP
CLIENT_COMPANY_NAME=YourClientName
WEBHOOK_SECRET=optional-webhook-secret
```

## Using the Enhanced Table

Replace the import in your page components:

```typescript
// Before:
import ResearchRequestTable from "@/components/ResearchRequestTable";

// After:
import ResearchRequestTable from "@/components/ResearchRequestTableEnhanced";
```

## Testing the Flow

1. **Submit a form** - Note the 5-character tracking ID shown in the toast
2. **Check the table** - You'll see the new request with the tracking ID
3. **Click refresh** - After ~30-60 seconds, click the refresh button
4. **View on GitHub** - Once found, click the GitHub icon to view the repo

## Key Points

- The `repoId` is generated locally and passed to EC2
- EC2 uses it to create a predictable repo name: `ci-{team}-{repoId}-{date}`
- The table polls GitHub directly, no need to wait for EC2 callback
- Works alongside your existing localStorage-based system