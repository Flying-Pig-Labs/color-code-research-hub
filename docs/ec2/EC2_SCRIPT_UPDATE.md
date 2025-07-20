# EC2 Script Update for RepoID Support

## Update for remote-swarm-executor.sh

Add this small modification to your `remote-swarm-executor.sh` script on the EC2 instance to use the repoId passed from the frontend:

### Find the `create_github_repo` function (around line 633)

**Current code:**
```bash
# Generate creative repo name
TIMESTAMP=$(date +%Y%m%d%H%M%S)
RANDOM_SUFFIX=$(openssl rand -hex 3)
REPO_NAME="mvp-$(echo "$PRODUCT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')-${RANDOM_SUFFIX}"
```

**Update to:**
```bash
# Check if repoId was provided
REPO_ID=$(echo "$CONFIG_JSON" | jq -r '.repoId // empty')

if [ -n "$REPO_ID" ]; then
    # Use the provided repoId for consistent naming
    TIMESTAMP=$(date +%Y%m%d)
    REPO_NAME="ci-${TEAM_TYPE}-${REPO_ID}-${TIMESTAMP}"
    log "Using provided repoId: ${REPO_ID} -> Repository: ${REPO_NAME}"
else
    # Fallback to existing logic if no repoId provided
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    RANDOM_SUFFIX=$(openssl rand -hex 3)
    REPO_NAME="mvp-$(echo "$PRODUCT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')-${RANDOM_SUFFIX}"
    log "No repoId provided, using generated name: ${REPO_NAME}"
fi
```

### Also update the `generate_swarm_config` function (around line 220)

**Add after getting the config:**
```bash
# Extract repoId if provided
REPO_ID=$(echo "$config_json" | jq -r '.repoId // empty')
if [ -n "$REPO_ID" ]; then
    log "Repository tracking ID: $REPO_ID"
fi

# Make it available globally
export REPO_ID
```

### Update the script variable extraction

**In the main execution section, add:**
```bash
# Store config JSON globally for repo creation
export CONFIG_JSON="$config_json"
```

## Complete Minimal Change

If you want the absolute minimal change, just update the repo naming section:

```bash
# In create_github_repo function, replace the REPO_NAME generation with:

# Try to extract repoId from the swarm output JSON
REPO_ID=$(cat "$OUTPUT_FILE" | jq -r '.metadata.repoId // empty' 2>/dev/null)

# If not in output, try from original config
if [ -z "$REPO_ID" ]; then
    REPO_ID=$(cat "$OUTPUT_DIR/swarm-config.json" | jq -r '.repoId // empty' 2>/dev/null)
fi

if [ -n "$REPO_ID" ]; then
    REPO_NAME="ci-${TEAM_TYPE:-unknown}-${REPO_ID}-$(date +%Y%m%d)"
else
    # Original logic
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    RANDOM_SUFFIX=$(openssl rand -hex 3)
    REPO_NAME="mvp-$(echo "$PRODUCT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')-${RANDOM_SUFFIX}"
fi
```

## Testing

1. The frontend will send: `{ teamType: "black", formData: { repoId: "a3x9k", ... } }`
2. The script extracts: `REPO_ID="a3x9k"`
3. Creates repo: `ci-black-a3x9k-20240120`
4. Frontend polls GitHub for exactly this repo name

This ensures the frontend knows exactly what repo name to look for!