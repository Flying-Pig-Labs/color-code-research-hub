# EC2 Integration Summary - What You Need to Do

## 🎯 The Smart Approach

Instead of waiting for EC2 to complete (which can take 5+ minutes), we:
1. Generate a 5-char tracking ID locally (e.g., `a3x9k`)
2. Pass it to EC2 with the research request
3. Show it in your existing table with a refresh button
4. Poll GitHub directly for `ci-black-a3x9k-20240120`
5. Display the GitHub link when found

## 📝 Implementation Checklist

### 1. **Add New Files** ✅
- [x] `src/utils/idGenerator.ts` - Generates tracking IDs
- [x] `src/services/githubService.ts` - Polls GitHub for repos
- [x] `src/components/ResearchRequestTableEnhanced.tsx` - Table with refresh buttons

### 2. **Update Backend** (Minimal Change)
Add to your existing `backend/server.js`:
```javascript
// Import at top
import { addEC2ProxyEndpoint } from './server-ec2-proxy.js';

// After your existing endpoints
addEC2ProxyEndpoint(app);
```

### 3. **Update Your Forms**
In each form component (Red/Black/White), modify `handleLaunchSwarm`:
```typescript
// Generate tracking ID
const repoId = generateRepoId();

// Add to submission
if (import.meta.env.VITE_EC2_WEBHOOK_URL) {
  // Submit to EC2 endpoint with repoId
  await fetch('/api/ec2/analyze', {
    method: 'POST',
    body: JSON.stringify({ teamType, formData, repoId })
  });
}
```

### 4. **Environment Configuration**
Create `.env.local`:
```env
# Your existing config
VITE_API_BASE_URL=http://localhost:3001

# Add EC2 config
VITE_EC2_WEBHOOK_URL=http://YOUR-EC2-IP
VITE_GITHUB_ORG=your-github-org
VITE_GITHUB_TOKEN=ghp_xxxxx  # Optional for private repos
```

Create `backend/.env`:
```env
EC2_WEBHOOK_URL=http://YOUR-EC2-IP
CLIENT_COMPANY_NAME=YourClient
```

### 5. **Update EC2 Script** (One Small Change)
SSH to your EC2 and edit `remote-swarm-executor.sh`:
```bash
# Find the repo name generation section and add:
REPO_ID=$(echo "$config_json" | jq -r '.repoId // empty')
if [ -n "$REPO_ID" ]; then
    REPO_NAME="ci-${TEAM_TYPE}-${REPO_ID}-$(date +%Y%m%d)"
fi
```

## 🚀 Quick Start

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your EC2 IP and GitHub org

# 3. Start both servers
npm run dev              # Frontend on :3000
cd backend && npm start  # Backend on :3001
```

## 🧪 Testing Flow

1. **Submit a form** → See "Tracking ID: a3x9k" in toast
2. **Check table** → See new row with ID and "Not yet" GitHub status
3. **Wait 30-60 seconds** → Let EC2 process
4. **Click refresh button** → Polls GitHub for the repo
5. **See GitHub link** → Click to view research results

## 💡 Key Benefits

- **No blocking** - Submit multiple requests without waiting
- **Direct GitHub polling** - More reliable than webhooks
- **Simple tracking** - 5-char IDs are easy to share
- **Minimal changes** - Works with your existing code
- **No EC2 changes needed** - Just one small script update

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| "EC2 not configured" | Check `EC2_WEBHOOK_URL` in backend/.env |
| Can't find repo | Check `VITE_GITHUB_ORG` matches EC2's GitHub org |
| "Not yet" forever | SSH to EC2 and check logs: `sudo journalctl -u claude-flow-webhook -f` |
| No tracking ID | Make sure you're importing `generateRepoId` in your form |

## 📁 Files Changed/Added

**New Files:**
- `src/utils/idGenerator.ts`
- `src/services/githubService.ts`
- `src/components/ResearchRequestTableEnhanced.tsx`
- `backend/server-ec2-proxy.js`

**Modified Files:**
- `backend/server.js` (add EC2 proxy)
- Form components (add repoId generation)
- `.env.local` (add EC2/GitHub config)

**EC2 Change:**
- `remote-swarm-executor.sh` (use repoId for naming)

That's it! The system will now track your EC2 research jobs and let you poll GitHub for results. 🎉