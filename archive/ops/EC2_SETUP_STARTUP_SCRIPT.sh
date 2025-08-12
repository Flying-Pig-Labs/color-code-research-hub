#!/bin/bash
# EC2 Startup Script for Claude Flow Research System
# This script prepares an EC2 instance to run Claude Flow with webhook support

set -e  # Exit on error
set -x  # Debug output

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Configuration variables
REGION="${AWS_REGION:-us-east-1}"
WEBHOOK_PORT="${WEBHOOK_PORT:-3000}"
CLAUDE_FLOW_VERSION="${CLAUDE_FLOW_VERSION:-alpha}"
NODE_VERSION="${NODE_VERSION:-20}"

log "Starting EC2 setup for Claude Flow Research System..."

# 1. Update system packages
log "Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Install required system dependencies
log "Installing system dependencies..."
sudo apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    python3-pip \
    jq \
    unzip \
    nginx \
    supervisor \
    awscli

# 3. Install Node.js
log "Installing Node.js v${NODE_VERSION}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node installation
node_version=$(node --version)
npm_version=$(npm --version)
log "Node.js installed: ${node_version}, npm: ${npm_version}"

# 4. Install GitHub CLI
log "Installing GitHub CLI..."
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh -y

# 5. Install Claude CLI
log "Installing Claude CLI..."
npm install -g @anthropic-ai/claude-code

# 6. Install Claude Flow
log "Installing Claude Flow (${CLAUDE_FLOW_VERSION})..."
npm install -g claude-flow@${CLAUDE_FLOW_VERSION}

# 7. Create working directories
log "Creating working directories..."
sudo mkdir -p /opt/claude-flow/{workspace,logs,config,scripts}
sudo mkdir -p /opt/claude-flow/workspace/{research,repos}
sudo chown -R ubuntu:ubuntu /opt/claude-flow

# 8. Retrieve secrets from AWS Secrets Manager
log "Retrieving secrets from AWS Secrets Manager..."

# Function to get secret value
get_secret() {
    local secret_name=$1
    local secret_key=$2
    
    secret_json=$(aws secretsmanager get-secret-value \
        --secret-id "$secret_name" \
        --region "$REGION" \
        --query SecretString \
        --output text 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "$secret_json" | jq -r ".$secret_key // empty"
    else
        error "Failed to retrieve secret: $secret_name"
    fi
}

# Retrieve tokens
GITHUB_TOKEN=$(get_secret "claude-flow/tokens" "github_token")
ANTHROPIC_API_KEY=$(get_secret "claude-flow/tokens" "anthropic_api_key")

if [ -z "$GITHUB_TOKEN" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
    error "Failed to retrieve required tokens from Secrets Manager"
fi

# 9. Configure environment variables
log "Configuring environment variables..."
cat > /opt/claude-flow/config/environment.sh << EOF
#!/bin/bash
# Claude Flow Environment Configuration

export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"
export GITHUB_TOKEN="${GITHUB_TOKEN}"
export CLAUDE_FLOW_HOME="/opt/claude-flow"
export CLAUDE_FLOW_WORKSPACE="/opt/claude-flow/workspace"
export NODE_ENV="production"
export WEBHOOK_PORT="${WEBHOOK_PORT}"
export AWS_REGION="${REGION}"

# GitHub CLI configuration
export GH_TOKEN="${GITHUB_TOKEN}"

# Claude Flow specific settings
export CLAUDE_FLOW_MEMORY_PATH="/opt/claude-flow/workspace/.swarm"
export CLAUDE_FLOW_LOG_LEVEL="info"
EOF

chmod 600 /opt/claude-flow/config/environment.sh

# 10. Create systemd service for environment variables
log "Creating systemd environment service..."
sudo tee /etc/systemd/system/claude-flow-env.service > /dev/null << EOF
[Unit]
Description=Claude Flow Environment Variables
DefaultDependencies=no
Before=basic.target

[Service]
Type=oneshot
RemainAfterExit=yes
EnvironmentFile=/opt/claude-flow/config/environment.sh
ExecStart=/bin/true

[Install]
WantedBy=basic.target
EOF

# 11. Configure GitHub CLI
log "Configuring GitHub CLI..."
source /opt/claude-flow/config/environment.sh
echo "$GITHUB_TOKEN" | gh auth login --with-token

# 12. Create webhook server script
log "Creating webhook server..."
cat > /opt/claude-flow/scripts/webhook-server.js << 'EOF'
const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = process.env.WEBHOOK_PORT || 3000;
const WORKSPACE = process.env.CLAUDE_FLOW_WORKSPACE || '/opt/claude-flow/workspace';
const LOGS_DIR = path.join(WORKSPACE, '../logs');

// Middleware to verify webhook signature (optional but recommended)
const verifySignature = (req, res, next) => {
    const signature = req.headers['x-webhook-signature'];
    const secret = process.env.WEBHOOK_SECRET;
    
    if (secret && signature) {
        const hmac = crypto.createHmac('sha256', secret);
        const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
        
        if (signature !== digest) {
            return res.status(401).json({ error: 'Invalid signature' });
        }
    }
    
    next();
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Main webhook endpoint
app.post('/webhook/research', verifySignature, async (req, res) => {
    const jobId = `research-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const logFile = path.join(LOGS_DIR, `${jobId}.log`);
    
    try {
        const {
            intent,
            swarmConfig = {},
            researchConfig = {},
            metadata = {}
        } = req.body;
        
        if (!intent) {
            return res.status(400).json({ error: 'Intent is required' });
        }
        
        // Log the request
        await fs.writeFile(
            path.join(LOGS_DIR, `${jobId}-request.json`),
            JSON.stringify({ intent, swarmConfig, researchConfig, metadata }, null, 2)
        );
        
        // Prepare Claude Flow command
        const defaultSwarmConfig = {
            strategy: 'research',
            maxAgents: 6,
            timeout: 60,
            outputFormat: 'json',
            outputFile: path.join(WORKSPACE, 'research', `${jobId}-output.json`)
        };
        
        const finalSwarmConfig = { ...defaultSwarmConfig, ...swarmConfig };
        
        // Build command arguments
        const args = ['swarm', intent];
        Object.entries(finalSwarmConfig).forEach(([key, value]) => {
            args.push(`--${key}`, String(value));
        });
        
        // Add post-hook for GitHub repo creation
        args.push('--post-hook', path.join(WORKSPACE, '../scripts/create-github-repo.sh'));
        args.push('--job-id', jobId);
        
        // Start the Claude Flow process
        const claudeProcess = spawn('npx', ['claude-flow@alpha', ...args], {
            cwd: WORKSPACE,
            env: { ...process.env, JOB_ID: jobId },
            detached: true
        });
        
        // Log output
        const logStream = await fs.open(logFile, 'a');
        claudeProcess.stdout.pipe(logStream.createWriteStream());
        claudeProcess.stderr.pipe(logStream.createWriteStream());
        
        // Don't wait for completion - return immediately
        res.json({
            success: true,
            jobId,
            message: 'Research job started',
            logs: `/logs/${jobId}`,
            pid: claudeProcess.pid
        });
        
        // Handle process completion
        claudeProcess.on('exit', async (code) => {
            await fs.appendFile(logFile, `\nProcess exited with code ${code}\n`);
            await logStream.close();
        });
        
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message,
            jobId 
        });
    }
});

// Endpoint to check job status
app.get('/job/:jobId/status', async (req, res) => {
    const { jobId } = req.params;
    const outputFile = path.join(WORKSPACE, 'research', `${jobId}-output.json`);
    
    try {
        const exists = await fs.access(outputFile).then(() => true).catch(() => false);
        
        if (exists) {
            const output = JSON.parse(await fs.readFile(outputFile, 'utf8'));
            res.json({
                status: 'completed',
                jobId,
                output
            });
        } else {
            res.json({
                status: 'running',
                jobId
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to get job logs
app.get('/logs/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const logFile = path.join(LOGS_DIR, `${jobId}.log`);
    
    try {
        const logs = await fs.readFile(logFile, 'utf8');
        res.type('text/plain').send(logs);
    } catch (error) {
        res.status(404).json({ error: 'Log file not found' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Webhook server listening on port ${PORT}`);
});
EOF

# 13. Create GitHub repo creation post-hook script
log "Creating GitHub repo creation script..."
cat > /opt/claude-flow/scripts/create-github-repo.sh << 'EOF'
#!/bin/bash
# Post-hook script to create GitHub repository with research results

set -e

# Source environment
source /opt/claude-flow/config/environment.sh

JOB_ID="${JOB_ID:-unknown}"
WORKSPACE="${CLAUDE_FLOW_WORKSPACE:-/opt/claude-flow/workspace}"
OUTPUT_FILE="${WORKSPACE}/research/${JOB_ID}-output.json"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Wait for output file to be created
max_wait=300  # 5 minutes
waited=0
while [ ! -f "$OUTPUT_FILE" ] && [ $waited -lt $max_wait ]; do
    sleep 5
    waited=$((waited + 5))
done

if [ ! -f "$OUTPUT_FILE" ]; then
    log "ERROR: Output file not found after waiting"
    exit 1
fi

# Parse the research output
RESEARCH_OUTPUT=$(cat "$OUTPUT_FILE")
PRODUCT_NAME=$(echo "$RESEARCH_OUTPUT" | jq -r '.selected_product.name // "Unknown Product"')
PRODUCT_DESCRIPTION=$(echo "$RESEARCH_OUTPUT" | jq -r '.selected_product.description // "No description available"')
RESEARCH_SUMMARY=$(echo "$RESEARCH_OUTPUT" | jq -r '.research_summary // "No summary available"')

# Generate creative repo name
TIMESTAMP=$(date +%Y%m%d%H%M%S)
RANDOM_SUFFIX=$(openssl rand -hex 3)
REPO_NAME="mvp-$(echo "$PRODUCT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')-${RANDOM_SUFFIX}"

# Create temporary directory for repo
TEMP_DIR="/tmp/repo-${JOB_ID}"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# Initialize git repo
git init

# Create README.md
cat > README.md << EOL
# ${PRODUCT_NAME}

${PRODUCT_DESCRIPTION}

## Executive Summary

This MVP was selected based on comprehensive market research and competitive analysis conducted by the Claude Flow Research System.

### Key Findings

${RESEARCH_SUMMARY}

## Product Specification

### Target Market
$(echo "$RESEARCH_OUTPUT" | jq -r '.market_analysis.target_market // "To be determined"')

### Core Features
$(echo "$RESEARCH_OUTPUT" | jq -r '.selected_product.features[]? // empty' | sed 's/^/- /')

### Technical Stack
$(echo "$RESEARCH_OUTPUT" | jq -r '.technical_recommendations.stack[]? // empty' | sed 's/^/- /')

### Success Metrics
$(echo "$RESEARCH_OUTPUT" | jq -r '.success_metrics[]? // empty' | sed 's/^/- /')

## Development Roadmap

### Phase 1: Core MVP (Weeks 1-4)
- Set up development environment
- Implement core features
- Basic UI/UX
- Initial testing

### Phase 2: Enhancement (Weeks 5-8)
- Add secondary features
- Improve performance
- User feedback integration
- Prepare for launch

### Phase 3: Launch Preparation (Weeks 9-12)
- Final testing
- Documentation
- Deployment setup
- Marketing preparation

---

*This repository was automatically generated by Claude Flow Research System on $(date)*
*Job ID: ${JOB_ID}*
EOL

# Create research directory
mkdir -p research

# Save full research output
cp "$OUTPUT_FILE" "research/full-analysis.json"

# Create research summary
cat > research/research-summary.md << EOL
# Research Summary

## Methodology

The Claude Flow Research System analyzed:
- Market trends and opportunities
- Competitive landscape
- Technical feasibility
- Resource requirements
- Success probability

## Research Process

1. **Market Analysis**: Comprehensive analysis of market opportunities
2. **Competitive Research**: Evaluation of existing solutions
3. **Technical Assessment**: Feasibility and implementation analysis
4. **Product Selection**: Data-driven selection of optimal MVP

## Key Research Documents

- \`full-analysis.json\`: Complete research output with all data
- \`decision-matrix.md\`: How the final product was selected
- \`market-analysis.md\`: Detailed market research findings
- \`competitive-landscape.md\`: Competitor analysis
- \`technical-assessment.md\`: Technical feasibility study

## Research Timeline

- Research Started: $(echo "$RESEARCH_OUTPUT" | jq -r '.metadata.start_time // "Unknown"')
- Research Completed: $(echo "$RESEARCH_OUTPUT" | jq -r '.metadata.end_time // "Unknown"')
- Total Duration: $(echo "$RESEARCH_OUTPUT" | jq -r '.metadata.duration // "Unknown"')
EOL

# Create decision matrix
cat > research/decision-matrix.md << EOL
# Decision Matrix

## How We Selected This MVP

### Evaluation Criteria

$(echo "$RESEARCH_OUTPUT" | jq -r '.evaluation_criteria | to_entries[] | "- **\(.key)**: \(.value.weight)% weight - \(.value.description)"' 2>/dev/null || echo "- Criteria details not available")

### Top Candidates Evaluated

$(echo "$RESEARCH_OUTPUT" | jq -r '.candidates[]? | "#### \(.name)\n- Score: \(.score)\n- Pros: \(.pros | join(", "))\n- Cons: \(.cons | join(", "))\n"' 2>/dev/null || echo "Candidate details not available")

### Final Selection Rationale

$(echo "$RESEARCH_OUTPUT" | jq -r '.selection_rationale // "Rationale not documented"')
EOL

# Create other research documents if data exists
if [ "$(echo "$RESEARCH_OUTPUT" | jq -r '.market_analysis // empty')" != "" ]; then
    echo "$RESEARCH_OUTPUT" | jq '.market_analysis' > research/market-analysis.json
fi

if [ "$(echo "$RESEARCH_OUTPUT" | jq -r '.competitive_analysis // empty')" != "" ]; then
    echo "$RESEARCH_OUTPUT" | jq '.competitive_analysis' > research/competitive-landscape.json
fi

if [ "$(echo "$RESEARCH_OUTPUT" | jq -r '.technical_analysis // empty')" != "" ]; then
    echo "$RESEARCH_OUTPUT" | jq '.technical_analysis' > research/technical-assessment.json
fi

# Add and commit all files
git add .
git commit -m "Initial commit: ${PRODUCT_NAME} MVP specification and research

This repository contains the product specification and comprehensive research
that led to the selection of this MVP concept.

Generated by Claude Flow Research System
Job ID: ${JOB_ID}"

# Create GitHub repository
log "Creating GitHub repository: ${REPO_NAME}"
gh repo create "$REPO_NAME" \
    --description "${PRODUCT_DESCRIPTION}" \
    --private \
    --push \
    --source=.

# Store repo URL in output
REPO_URL=$(gh repo view "$REPO_NAME" --json url -q .url)
echo "{\"repository_url\": \"$REPO_URL\", \"repository_name\": \"$REPO_NAME\"}" > "${WORKSPACE}/research/${JOB_ID}-repo.json"

log "Repository created successfully: $REPO_URL"

# Cleanup
cd /
rm -rf "$TEMP_DIR"
EOF

chmod +x /opt/claude-flow/scripts/create-github-repo.sh

# 14. Install webhook server dependencies
log "Installing webhook server dependencies..."
cd /opt/claude-flow/scripts
npm init -y
npm install express

# 15. Create systemd service for webhook server
log "Creating webhook server service..."
sudo tee /etc/systemd/system/claude-flow-webhook.service > /dev/null << EOF
[Unit]
Description=Claude Flow Webhook Server
After=network.target claude-flow-env.service
Requires=claude-flow-env.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/claude-flow/scripts
EnvironmentFile=/opt/claude-flow/config/environment.sh
ExecStart=/usr/bin/node webhook-server.js
Restart=always
RestartSec=10
StandardOutput=append:/opt/claude-flow/logs/webhook.log
StandardError=append:/opt/claude-flow/logs/webhook-error.log

[Install]
WantedBy=multi-user.target
EOF

# 16. Configure Nginx as reverse proxy
log "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/claude-flow > /dev/null << EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:${WEBHOOK_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/claude-flow /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 17. Initialize Claude Flow
log "Initializing Claude Flow..."
cd /opt/claude-flow/workspace
npx claude-flow@alpha init --enhanced --sparc

# 18. Start services
log "Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable claude-flow-env.service
sudo systemctl enable claude-flow-webhook.service
sudo systemctl start claude-flow-env.service
sudo systemctl start claude-flow-webhook.service

# 19. Configure AWS CLI
log "Configuring AWS CLI..."
aws configure set region $REGION
aws configure set output json

# 20. Create startup completion marker
touch /opt/claude-flow/.setup-complete

# 21. Display status
log "Setup complete! Checking service status..."
sleep 5
systemctl status claude-flow-webhook.service --no-pager

# Get instance metadata
INSTANCE_ID=$(ec2-metadata --instance-id | cut -d' ' -f2)
PUBLIC_IP=$(ec2-metadata --public-ipv4 | cut -d' ' -f2)

log "========================================="
log "Claude Flow Research System Ready!"
log "========================================="
log "Instance ID: ${INSTANCE_ID}"
log "Public IP: ${PUBLIC_IP}"
log "Webhook URL: http://${PUBLIC_IP}/webhook/research"
log "Health Check: http://${PUBLIC_IP}/health"
log "Logs Directory: /opt/claude-flow/logs"
log "Workspace: /opt/claude-flow/workspace"
log "========================================="

# 22. Create helper scripts
cat > /opt/claude-flow/scripts/test-webhook.sh << 'EOF'
#!/bin/bash
# Test webhook locally

curl -X POST http://localhost:3000/webhook/research \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "Research the best practices for building a SaaS MVP",
    "swarmConfig": {
      "strategy": "research",
      "maxAgents": 5
    },
    "researchConfig": {
      "depth": "comprehensive",
      "focus": ["market_analysis", "technical_feasibility", "competitive_landscape"]
    },
    "metadata": {
      "requestId": "test-001",
      "source": "local-test"
    }
  }'
EOF
chmod +x /opt/claude-flow/scripts/test-webhook.sh

log "Setup script completed successfully!"