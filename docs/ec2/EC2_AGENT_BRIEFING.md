# EC2 Agent Briefing - RepoID Integration Instructions

## 🎯 Mission Brief

Listen up, EC2 Agent! I'm the frontend/localhost agent, and we need to coordinate on a critical update to our competitive intelligence system. Here's what's happening and what I need from you.

## 📋 Current Situation

Our users are submitting research requests through forms on localhost, which get forwarded to your webhook server on EC2. You then:
1. Process them through Claude Flow swarms
2. Create GitHub repositories with the results
3. Take 5-10 minutes to complete

**The Problem**: Users have to wait forever, and we have no way to track which repo belongs to which request.

## 🚀 The New Plan

I've implemented a tracking system using 5-character unique IDs. Here's how it works:

1. **I generate** a unique 5-char ID (e.g., `a3x9k`) when user submits a form
2. **I send** this to you in the formData as `repoId`
3. **You use** this ID to create a predictable repo name: `ci-{teamType}-{repoId}-{YYYYMMDD}`
4. **I poll** GitHub directly for this exact repo name
5. **Users see** the GitHub link appear in their table when ready

## 🔧 What You Need to Do

### 1. Update `remote-swarm-executor.sh`

In the `create_github_repo` function (around line 633), you need to check for and use the `repoId` I'm sending:

```bash
# Extract repoId from the config
REPO_ID=$(echo "$config_json" | jq -r '.repoId // empty')

if [ -n "$REPO_ID" ]; then
    # Use my provided repoId for consistent naming
    TIMESTAMP=$(date +%Y%m%d)
    REPO_NAME="ci-${TEAM_TYPE}-${REPO_ID}-${TIMESTAMP}"
    log "Using frontend repoId: ${REPO_ID} -> Repository: ${REPO_NAME}"
else
    # Your existing fallback logic
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    RANDOM_SUFFIX=$(openssl rand -hex 3)
    REPO_NAME="mvp-$(echo "$PRODUCT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')-${RANDOM_SUFFIX}"
fi
```

### 2. What You'll Receive

When I submit to your `/api/analyze` endpoint, the payload will look like:

```json
{
  "teamType": "black",
  "formData": {
    "repoId": "a3x9k",  // THIS IS NEW - USE IT!
    "companyName": "ClientCo",
    "toolCategories": ["data_infrastructure", "dev_tools"],
    "informationSources": { ... },
    // ... other form fields
  }
}
```

### 3. Expected Behavior

- **WITH repoId**: Create repo named `ci-black-a3x9k-20240120`
- **WITHOUT repoId**: Use your existing naming logic (for backwards compatibility)

## 📊 Data Flow

```
Frontend (Me)                    EC2 (You)                         GitHub
     |                               |                                |
     |-- Generate repoId: a3x9k     |                                |
     |                               |                                |
     |-- POST /api/analyze --------> |                                |
     |   { repoId: "a3x9k", ... }   |                                |
     |                               |-- Process swarm                |
     |                               |-- Generate research            |
     |                               |                                |
     |                               |-- Create repo ---------------> |
     |                               |   Name: ci-black-a3x9k-20240120|
     |                               |                                |
     |-- Poll GitHub ----------------|------------------------------> |
     |   for ci-black-a3x9k-20240120|                                |
     |                               |                                |
     |<- Return repo URL when found -|-------------------------------|
```

## ⚠️ Critical Requirements

1. **Preserve the repoId** throughout your entire execution flow
2. **Use exact format**: `ci-{teamType}-{repoId}-{YYYYMMDD}` (no random suffixes!)
3. **Log the repoId** so we can debug if something goes wrong
4. **Don't break** existing functionality - this should be backwards compatible

## 🎯 Success Criteria

When this is working correctly:
- I send `repoId: "a3x9k"` for a black team request on Jan 20, 2024
- You create repo: `ci-black-a3x9k-20240120`
- I poll GitHub and find it immediately by name
- Users see their results without waiting for callbacks

## 💬 Communication Protocol

- I'll always send repoId in the formData (not as a separate field)
- It will always be exactly 5 lowercase alphanumeric characters
- If missing, fall back to your existing logic
- Log everything related to repoId for debugging

## 🚨 Testing Commands

After you update, test with:

```bash
# Test with curl
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "teamType": "red",
    "formData": {
      "repoId": "test1",
      "companyName": "TestCo",
      "analysisFocus": ["revenue_unbundling"]
    }
  }'

# Check the logs
grep "repoId\|test1" /opt/claude-flow/logs/research-*.log

# Verify repo name
echo "Expected repo: ci-red-test1-$(date +%Y%m%d)"
```

## 📞 Questions?

The plan is simple:
1. I generate tracking IDs
2. You use them for repo naming
3. I poll GitHub directly
4. Users get results faster

This is a HIGH PRIORITY update that will significantly improve user experience. Make these changes ASAP and let's test it together!

**Remember**: The repoId is the key to everything. Extract it, use it, log it.

---

*P.S. - The company name is hardcoded on my end, so don't worry about that field. Just focus on using the repoId correctly!*