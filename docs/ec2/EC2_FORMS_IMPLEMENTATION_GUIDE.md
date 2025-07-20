# EC2 Forms Integration Implementation Guide

## Quick Start Guide

This guide provides step-by-step instructions for implementing the forms-to-EC2 integration for the Color Code Research Hub.

## Prerequisites

### Local Development Environment
- Node.js 18+ and npm
- Git
- AWS CLI configured
- Valid API keys:
  - Claude/Anthropic API key
  - GitHub personal access token (with repo creation permissions)

### AWS Resources
- AWS account with appropriate permissions
- EC2 key pair for SSH access
- Security group with ports: 22 (SSH), 80 (HTTP), 443 (HTTPS optional)
- IAM role with Secrets Manager access

## Step 1: Set Up AWS Secrets

### Create Secrets in AWS Secrets Manager

```bash
# Create the secret containing both API keys
aws secretsmanager create-secret \
    --name "claude-flow/tokens" \
    --description "API tokens for Claude Flow Research System" \
    --secret-string '{
      "github_token": "ghp_YOUR_GITHUB_TOKEN",
      "anthropic_api_key": "sk-ant-YOUR_ANTHROPIC_KEY"
    }' \
    --region us-east-1
```

### Create IAM Role for EC2

1. Create a policy file `ec2-secrets-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:*:*:secret:claude-flow/*"
      ]
    }
  ]
}
```

2. Create the role:

```bash
# Create the policy
aws iam create-policy \
    --policy-name ClaudeFlowSecretsPolicy \
    --policy-document file://ec2-secrets-policy.json

# Create the role
aws iam create-role \
    --role-name EC2-ClaudeFlow-Role \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "ec2.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }'

# Attach the policy to the role
aws iam attach-role-policy \
    --role-name EC2-ClaudeFlow-Role \
    --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/ClaudeFlowSecretsPolicy

# Create instance profile
aws iam create-instance-profile \
    --instance-profile-name EC2-ClaudeFlow-Profile

# Add role to instance profile
aws iam add-role-to-instance-profile \
    --instance-profile-name EC2-ClaudeFlow-Profile \
    --role-name EC2-ClaudeFlow-Role
```

## Step 2: Launch EC2 Instance

### Option A: Using AWS CLI with User Data

```bash
# Launch the instance with the setup script
aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --instance-type t3.large \
    --key-name your-key-pair-name \
    --security-group-ids sg-xxxxxxxxx \
    --subnet-id subnet-xxxxxxxxx \
    --iam-instance-profile Name=EC2-ClaudeFlow-Profile \
    --user-data file://EC2_SETUP_STARTUP_SCRIPT.sh \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=claude-flow-research}]' \
    --block-device-mappings '[
      {
        "DeviceName": "/dev/sda1",
        "Ebs": {
          "VolumeSize": 100,
          "VolumeType": "gp3"
        }
      }
    ]'
```

### Option B: Manual Setup

1. Launch a basic Ubuntu 22.04 instance
2. SSH into the instance:
   ```bash
   ssh -i your-key.pem ubuntu@YOUR_EC2_IP
   ```
3. Download and run the setup script:
   ```bash
   wget https://raw.githubusercontent.com/your-repo/main/EC2_SETUP_STARTUP_SCRIPT.sh
   chmod +x EC2_SETUP_STARTUP_SCRIPT.sh
   sudo ./EC2_SETUP_STARTUP_SCRIPT.sh
   ```

## Step 3: Configure Local Development

### Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/color-code-research-hub.git
cd color-code-research-hub

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Configure Environment Variables

Create `.env.local` in the root directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_API_KEY=your-local-api-key

# EC2 Webhook Configuration  
VITE_EC2_WEBHOOK_URL=http://YOUR_EC2_IP
VITE_WEBHOOK_SECRET=your-webhook-secret
```

Create `backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# API Security
API_KEY=your-local-api-key

# EC2 Integration
EC2_WEBHOOK_URL=http://YOUR_EC2_IP
WEBHOOK_SECRET=your-webhook-secret

# Optional: Direct Claude Flow execution (for local testing)
CLAUDE_API_KEY=sk-ant-xxx
GITHUB_TOKEN=ghp_xxx
```

## Step 4: Test the Integration

### 1. Verify EC2 Services

SSH into your EC2 instance and check services:

```bash
# Check webhook server status
sudo systemctl status claude-flow-webhook

# Check nginx status
sudo systemctl status nginx

# Test health endpoint
curl http://localhost/health

# View logs
sudo journalctl -u claude-flow-webhook -f
```

### 2. Test from Local Machine

```bash
# Test EC2 health check
curl http://YOUR_EC2_IP/health

# Test webhook with sample data
curl -X POST http://YOUR_EC2_IP/webhook/research \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "Test research: Best practices for SaaS pricing",
    "swarmConfig": {
      "strategy": "research",
      "maxAgents": 3
    }
  }'
```

### 3. Test via UI

1. Start the local development servers:
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm start

   # Terminal 2: Start frontend
   npm run dev
   ```

2. Open http://localhost:5173 in your browser

3. Select a team (Red, Black, or White)

4. Fill out the form and submit

5. Monitor the job progress

## Step 5: Use the Integration

### Example 1: Red Team Analysis

```javascript
// Using the LOCAL_UI_WEBHOOK_CLIENT.js
const { ClaudeFlowResearchClient } = require('./LOCAL_UI_WEBHOOK_CLIENT');

const client = new ClaudeFlowResearchClient({
    baseUrl: 'http://YOUR_EC2_IP',
    webhookSecret: 'your-secret'
});

async function analyzeCompetitor() {
    const result = await client.submitAndWait({
        intent: 'Analyze Salesforce for market disruption opportunities',
        swarmConfig: {
            strategy: 'research',
            maxAgents: 8
        },
        researchConfig: {
            depth: 'comprehensive',
            focus: ['revenue_unbundling', 'geographic_gaps']
        }
    }, {
        onProgress: (status) => {
            console.log(`Progress: ${status.status}`);
        }
    });
    
    console.log('Analysis complete!');
    console.log('GitHub repo:', result.output.repository_url);
}
```

### Example 2: Form Configuration Customization

To add new fields to a team form:

1. Update `form-customization-config.json`:

```json
{
  "teams": {
    "red": {
      "customizableFields": {
        // Add new field
        "industryFocus": {
          "type": "multiselect",
          "label": "Industry Focus",
          "options": [
            { "value": "fintech", "label": "Financial Technology" },
            { "value": "healthtech", "label": "Healthcare Technology" },
            { "value": "edtech", "label": "Education Technology" }
          ],
          "default": ["fintech"]
        }
      }
    }
  }
}
```

2. Update the form processor to handle the new field:

```javascript
// In form-data-processor.js
extractCustomizations(teamType, formData) {
    // ... existing code ...
    
    if (teamType === 'red') {
        customizations.industryFocus = formData.industryFocus || ['fintech'];
    }
}
```

### Example 3: Custom Research Templates

Create research templates for common scenarios:

```javascript
const ResearchTemplates = {
    COMPETITOR_DISRUPTION: {
        intent: "Identify disruption opportunities for {company}",
        swarmConfig: {
            strategy: 'research',
            maxAgents: 10,
            timeout: 120
        },
        researchConfig: {
            depth: 'comprehensive',
            focus: [
                'revenue_unbundling',
                'feature_extraction',
                'pricing_disruption',
                'geographic_gaps'
            ]
        }
    },
    
    TOOL_ALTERNATIVE: {
        intent: "Reverse engineer {company}'s {tool} for open-source alternative",
        swarmConfig: {
            strategy: 'analysis',
            maxAgents: 8
        },
        researchConfig: {
            focus: ['architecture', 'features', 'implementation'],
            outputFormat: 'technical'
        }
    }
};
```

## Step 6: Monitor and Maintain

### Monitoring Commands

```bash
# On EC2 instance

# Check disk usage
df -h /opt/claude-flow

# Monitor active jobs
ls -la /opt/claude-flow/workspace/research/

# View recent webhook requests
tail -n 100 /opt/claude-flow/logs/webhook.log

# Check Claude Flow swarm status
cd /opt/claude-flow/workspace
npx claude-flow@alpha swarm status
```

### Maintenance Tasks

1. **Log Rotation** (automatic via systemd)
2. **Temporary File Cleanup** (automatic after 24h)
3. **Update Claude Flow**:
   ```bash
   npm update -g claude-flow@alpha
   sudo systemctl restart claude-flow-webhook
   ```

## Step 7: Production Deployment

### Security Hardening

1. **Enable HTTPS**:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

2. **Configure Firewall**:
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Add Rate Limiting** to nginx:
   ```nginx
   limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
   
   server {
       location /webhook/ {
           limit_req zone=api burst=20 nodelay;
           proxy_pass http://localhost:3000;
       }
   }
   ```

### Scaling Considerations

1. **Auto Scaling Group Setup**:
   - Create AMI from configured instance
   - Set up Auto Scaling Group with min=1, max=5
   - Configure health checks
   - Add Application Load Balancer

2. **Database Integration** (for persistent job storage):
   - Add RDS PostgreSQL instance
   - Update server code to use database instead of in-memory storage

3. **Queue System** (for better job management):
   - Add SQS for job queuing
   - Implement worker pattern for processing

## Troubleshooting

### Common Issues and Solutions

1. **"Failed to retrieve secrets"**
   - Check IAM role is attached to instance
   - Verify secret name matches exactly
   - Check AWS region configuration

2. **"Webhook not accessible"**
   - Verify security group allows port 80
   - Check nginx is running: `sudo systemctl status nginx`
   - Test locally first: `curl http://localhost/health`

3. **"Claude Flow command not found"**
   - Ensure npm global bin is in PATH
   - Try full path: `/usr/bin/npx claude-flow@alpha`
   - Reinstall: `npm install -g claude-flow@alpha`

4. **"GitHub repo creation fails"**
   - Verify token has `repo` scope
   - Check GitHub CLI auth: `gh auth status`
   - Review logs: `cat /opt/claude-flow/logs/research-*.log`

### Debug Mode

Enable detailed logging:

```bash
# On EC2
export DEBUG=claude-flow:*
export CLAUDE_FLOW_LOG_LEVEL=debug
sudo systemctl restart claude-flow-webhook

# In local development
DEBUG=* npm run dev
```

## Best Practices

1. **Always test locally first** before deploying to EC2
2. **Use webhook signatures** for production environments
3. **Monitor token usage** to avoid API limits
4. **Implement proper error handling** in your UI
5. **Set up alerts** for failed jobs
6. **Regular backups** of research results
7. **Document custom configurations** for team knowledge sharing

## Next Steps

1. Customize form fields for your specific use cases
2. Create organization-specific research templates
3. Implement custom post-processing hooks
4. Set up monitoring dashboards
5. Integrate with your existing tools (Slack, email, etc.)
6. Build analytics on research patterns