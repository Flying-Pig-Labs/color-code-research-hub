# 🦈 Shark Swarm Frontend Implementation Guide

## Overview
The Shark Swarm Leaderboard is a dynamic ranking system that showcases the top-performing business ideas from GitHub issues that have been reviewed by our AI "shark" investors. Your frontend at https://oceanstudio.io/shark-swarmer will consume the backend API to display these rankings and enable users to instantly create new repositories from winning ideas.

## Core Features

### 1. Leaderboard Display
- **Top 10 Ranking**: Display ideas sorted by Shark Score (highest first)
- **Visual Hierarchy**: 
  - 🥇 Gold medal and highlight for #1
  - 🥈 Silver medal for #2
  - 🥉 Bronze medal for #3
  - Regular display for #4-10
- **Score Color Coding**:
  - Green (80-100): Hot deals
  - Blue (60-79): Strong interest
  - Yellow (40-59): Mixed reception
  - Orange (20-39): Limited interest
  - Red (0-19): No deal

### 2. BUILD Functionality
Each idea should have a prominent BUILD button that:
- **On Click**: Creates a new repository in `ocean-studio-apps` organization
- **Loading State**: Shows spinner/progress while building
- **Success**: Opens new repo in new tab, shows success animation
- **Error**: Shows error message with retry option
- **Post-Build**: Adds "🏗️ built" label to original issue

### 3. Auto-Refresh
- Poll the leaderboard endpoint every 30 seconds
- Show subtle refresh indicator
- Preserve user interactions during refresh
- Smooth transitions when rankings change

## API Integration

### Base Configuration
```javascript
const API_BASE_URL = 'https://9y4n7ifoql.execute-api.us-east-1.amazonaws.com/prod';

// Fetch leaderboard
async function fetchLeaderboard() {
  const response = await fetch(`${API_BASE_URL}/leaderboard`);
  const data = await response.json();
  return data.ideas; // Array of top 10 ideas
}

// Build repository
async function buildRepository(idea) {
  const response = await fetch(`${API_BASE_URL}/build`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repository: idea.repository,
      issue_number: idea.issue_number,
      title: idea.title,
      score: idea.score,
      investment_display: idea.investment_display,
      rank: idea.rank,
      medal: idea.medal
    })
  });
  
  const result = await response.json();
  if (result.success) {
    window.open(result.repo_url, '_blank');
  }
  return result;
}
```

## UI/UX Recommendations

### Layout Structure
```
┌─────────────────────────────────────────────────────┐
│  🦈 SHARK SWARM LEADERBOARD                          │
│  "Where the best ideas rise to the surface"          │
│                                                       │
│  [Refresh] [Filter: All/This Week/This Month]        │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🥇 #1 | Score: 94/100                       │    │
│  │ AI Healthcare Platform                      │    │
│  │ "Revolutionary diagnostic AI reducing..."    │    │
│  │ 💰 $2.5M | 5/5 Sharks | [BUILD] [VIEW]     │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🥈 #2 | Score: 87/100                       │    │
│  │ Quantum Crypto SaaS                         │    │
│  │ "Next-gen encryption platform using..."      │    │
│  │ 💰 $1.8M | 4/5 Sharks | [BUILD] [VIEW]     │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Interactive Elements

#### BUILD Button States
```css
/* Default */
.build-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  transition: all 0.3s;
}

/* Hover */
.build-button:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

/* Loading */
.build-button.loading {
  opacity: 0.7;
  cursor: not-allowed;
  animation: pulse 2s infinite;
}

/* Success */
.build-button.success {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  animation: success-flash 0.5s;
}

/* Error */
.build-button.error {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  animation: shake 0.5s;
}
```

### Animation Suggestions

#### Rank Changes
When rankings update, animate position changes:
```javascript
// Smooth transition for rank changes
.idea-card {
  transition: transform 0.5s ease-in-out;
}

// New entry animation
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

#### Score Display
Use circular progress indicators or animated bars:
```javascript
// Circular progress for scores
function renderScoreCircle(score) {
  const percentage = score;
  const color = getScoreColor(score);
  
  return `
    <svg class="score-circle" viewBox="0 0 36 36">
      <path class="circle-bg"
        d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.831
          a 15.9155 15.9155 0 0 1 0 -31.831"
      />
      <path class="circle"
        stroke="${color}"
        stroke-dasharray="${percentage}, 100"
        d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.831
          a 15.9155 15.9155 0 0 1 0 -31.831"
      />
      <text x="18" y="20.35" class="percentage">${score}</text>
    </svg>
  `;
}
```

## Data Display Guidelines

### Title & Description
- **Title**: Show full title (truncate at 100 chars if needed)
- **Description**: Show first 50-75 words with "..." if truncated
- **Expandable**: Click to show full description in modal/dropdown

### Investment Display
- Format large numbers: $2.5M, $500K, $10K
- Use green color for amounts
- Show alongside confidence indicators

### Labels
- Display GitHub labels as colored badges
- Highlight special labels: "👑 king", "🏗️ built", "shark ready 🦈"

### Timestamps
- Show relative time: "2 hours ago", "3 days ago"
- Tooltip with exact timestamp on hover

## Error Handling

### Network Errors
```javascript
try {
  const ideas = await fetchLeaderboard();
  renderLeaderboard(ideas);
} catch (error) {
  showError({
    title: 'Connection Error',
    message: 'Unable to load leaderboard. Please try again.',
    action: {
      label: 'Retry',
      onClick: () => fetchLeaderboard()
    }
  });
}
```

### Build Failures
```javascript
const result = await buildRepository(idea);
if (!result.success) {
  showNotification({
    type: 'error',
    title: 'Build Failed',
    message: result.error || 'Unable to create repository',
    duration: 5000
  });
}
```

## Performance Optimizations

### Caching Strategy
```javascript
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

async function getCachedLeaderboard() {
  const cached = cache.get('leaderboard');
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const fresh = await fetchLeaderboard();
  cache.set('leaderboard', {
    data: fresh,
    timestamp: Date.now()
  });
  
  return fresh;
}
```

### Debounce BUILD Clicks
```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedBuild = debounce(buildRepository, 1000);
```

## Accessibility

### ARIA Labels
```html
<button 
  aria-label="Build repository from idea"
  aria-busy={isBuilding}
  aria-disabled={isBuilding}
>
  {isBuilding ? 'Building...' : 'BUILD'}
</button>
```

### Keyboard Navigation
- Tab through ideas
- Enter/Space to trigger BUILD
- Escape to close modals

### Screen Reader Support
```html
<div role="list" aria-label="Top 10 shark-reviewed ideas">
  <article role="listitem" aria-label={`Rank ${idea.rank}: ${idea.title}`}>
    <!-- Idea content -->
  </article>
</div>
```

## Testing Data

For development, you can use this test endpoint:
```bash
# Get current leaderboard (may be empty initially)
curl https://9y4n7ifoql.execute-api.us-east-1.amazonaws.com/prod/leaderboard

# Test BUILD endpoint (use actual data from leaderboard)
curl -X POST https://9y4n7ifoql.execute-api.us-east-1.amazonaws.com/prod/build \
  -H "Content-Type: application/json" \
  -d '{
    "repository": "ocean-studio-repos/test-repo",
    "issue_number": 1,
    "title": "Test Idea",
    "score": 85,
    "investment_display": "$1M",
    "rank": 1,
    "medal": "🥇"
  }'
```

## Mobile Responsiveness

### Breakpoints
- Desktop: > 1024px (full table view)
- Tablet: 768px - 1024px (condensed cards)
- Mobile: < 768px (stacked cards)

### Mobile Layout
```css
@media (max-width: 768px) {
  .idea-card {
    display: block;
    margin: 10px;
    padding: 15px;
  }
  
  .build-button {
    width: 100%;
    margin-top: 10px;
  }
  
  .score-display {
    display: inline-block;
    margin-right: 10px;
  }
}
```

## Analytics Tracking

Consider tracking these events:
- Leaderboard views
- BUILD button clicks
- Successful builds
- Failed builds
- Time spent on page
- Idea expansions
- External link clicks to GitHub

## Security Considerations

1. **CORS**: API supports CORS, no proxy needed
2. **Rate Limiting**: BUILD endpoint limited to 10 req/min
3. **Input Validation**: Sanitize all displayed content
4. **XSS Prevention**: Escape HTML in descriptions
5. **Error Messages**: Don't expose sensitive details

## Future Enhancements to Plan For

1. **Filtering & Sorting**
   - By repository
   - By date range
   - By score threshold
   - By investment amount

2. **Search**
   - Full-text search across titles and descriptions

3. **Historical Data**
   - Score trends over time
   - Investment history graphs

4. **Social Features**
   - Share buttons
   - Comments/reactions
   - User voting

5. **Real-time Updates**
   - WebSocket for live score updates
   - Notification badges for new entries

## Questions for Frontend Dev

Before starting implementation, consider:

1. **Framework**: React, Vue, Angular, or vanilla JS?
2. **Styling**: Tailwind, Material-UI, custom CSS?
3. **State Management**: Redux, Context API, Zustand?
4. **Data Fetching**: Axios, Fetch API, React Query?
5. **Build Tools**: Vite, Webpack, Next.js?
6. **Testing**: Jest, Cypress, Playwright?
7. **Deployment**: Vercel, Netlify, AWS Amplify?

## Contact & Support

For API issues or questions:
- Check CloudWatch logs for API errors
- Test endpoints using provided curl commands
- API documentation: See API_SPECIFICATION.md
- Backend code: /lambdas/leaderboard/handler.py

---

The backend is fully deployed and operational. The API is ready for frontend integration at https://oceanstudio.io/shark-swarmer!