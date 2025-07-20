# EC2 Infrastructure Setup for Claude Flow Research System

## Overview

This document provides complete setup instructions for running Claude Flow Research System on AWS EC2, including:
- EC2 instance configuration with Secrets Manager integration
- Webhook server for remote job triggering
- Automated GitHub repository creation with research results
- Local UI integration examples

## Prerequisites

### AWS Setup
1. AWS Account with appropriate permissions
2. AWS Secrets Manager containing:
   ```json
   {
     "github_token": "ghp_xxxxxxxxxxxx",
     "anthropic_api_key": "sk-ant-xxxxxxxxxxxx"
   }
   ```
3. EC2 key pair for SSH access
4. Security group with ports 22 (SSH), 80 (HTTP), and optionally 443 (HTTPS)

### Local Development
1. Node.js 18+ installed
2. npm or yarn package manager
3. Your local UI application

## Step 1: Create AWS Secrets

First, create the secrets in AWS Secrets Manager:

```bash
# Create the secret with both tokens
aws secretsmanager create-secret \
    --name "claude-flow/tokens" \
    --description "Claude Flow API tokens" \
    --secret-string '{
      "github_token": "YOUR_GITHUB_TOKEN",
      "anthropic_api_key": "YOUR_ANTHROPIC_API_KEY"
    }' \
    --region us-east-1
```

## Step 2: Launch EC2 Instance

### Using AWS CLI

```bash
# Launch instance with user data
aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \  # Ubuntu 22.04 LTS
    --instance-type t3.large \
    --key-name your-key-pair \
    --security-group-ids sg-xxxxxxxxx \
    --subnet-id subnet-xxxxxxxxx \
    --iam-instance-profile Name=EC2-SecretsManager-Role \
    --user-data file://EC2_SETUP_STARTUP_SCRIPT.sh \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=claude-flow-research}]' \
    --block-device-mappings '[
      {
        "DeviceName": "/dev/sda1",
        "Ebs": {
          "VolumeSize": 100,
          "VolumeType": "gp3",
          "DeleteOnTermination": true
        }
      }
    ]'
```

### IAM Instance Profile

Create an IAM role with the following policy:

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
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeTags"
      ],
      "Resource": "*"
    }
  ]
}
```

## Step 3: Manual Setup (If Not Using User Data)

SSH into the instance and run:

```bash
# Download and run the setup script
wget https://raw.githubusercontent.com/your-repo/claude-flow/main/EC2_SETUP_STARTUP_SCRIPT.sh
chmod +x EC2_SETUP_STARTUP_SCRIPT.sh
sudo ./EC2_SETUP_STARTUP_SCRIPT.sh
```

## Step 4: Configure Local UI Client

### Install the Client Library

```bash
npm install axios
# Copy LOCAL_UI_WEBHOOK_CLIENT.js to your project
```

### Basic Integration

```javascript
const { ClaudeFlowResearchClient } = require('./LOCAL_UI_WEBHOOK_CLIENT');

// Initialize client
const researchClient = new ClaudeFlowResearchClient({
    baseUrl: 'http://YOUR-EC2-PUBLIC-IP',
    webhookSecret: 'your-optional-secret'  // For signature verification
});

// Submit a research job
async function submitResearch() {
    try {
        const job = await researchClient.submitResearch({
            intent: 'Research the best practices for building a B2B SaaS MVP in 2024',
            swarmConfig: {
                strategy: 'research',
                maxAgents: 8,
                timeout: 90
            },
            researchConfig: {
                depth: 'comprehensive',
                focus: [
                    'market_analysis',
                    'competitive_landscape', 
                    'technical_architecture',
                    'mvp_features',
                    'go_to_market_strategy'
                ]
            },
            metadata: {
                userId: 'user-123',
                projectId: 'proj-456'
            }
        });
        
        console.log('Research job submitted:', job.jobId);
        
        // Wait for completion
        const result = await researchClient.waitForCompletion(job.jobId, {
            pollInterval: 5000,
            onProgress: (status) => {
                console.log(`Job ${status.jobId}: ${status.status}`);
            }
        });
        
        console.log('Research completed!');
        console.log('GitHub repo created:', result.output.repository_url);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}
```

### React Integration Example

```jsx
import React, { useState } from 'react';
import { ClaudeFlowResearchClient } from './services/claudeFlowClient';

const ResearchForm = () => {
    const [intent, setIntent] = useState('');
    const [status, setStatus] = useState('idle');
    const [result, setResult] = useState(null);
    
    const client = new ClaudeFlowResearchClient({
        baseUrl: process.env.REACT_APP_CLAUDE_FLOW_URL
    });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        
        try {
            const job = await client.submitResearch({
                intent,
                swarmConfig: {
                    strategy: 'research',
                    maxAgents: 6
                }
            });
            
            setStatus('processing');
            
            const completed = await client.waitForCompletion(job.jobId, {
                onProgress: (update) => {
                    setStatus(`${update.status} - ${update.jobId}`);
                }
            });
            
            setResult(completed);
            setStatus('completed');
            
        } catch (error) {
            setStatus('error');
            console.error(error);
        }
    };
    
    return (
        <div>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    placeholder="Enter your research intent..."
                    rows={4}
                    cols={50}
                />
                <button type="submit" disabled={status === 'processing'}>
                    Start Research
                </button>
            </form>
            
            <div>Status: {status}</div>
            
            {result && (
                <div>
                    <h3>Research Complete!</h3>
                    <a href={result.output.repository_url} target="_blank">
                        View GitHub Repository
                    </a>
                </div>
            )}
        </div>
    );
};
```

## Step 5: Webhook Server API Reference

### Endpoints

#### POST /webhook/research
Submit a new research job.

**Request Body:**
```json
{
    "intent": "Research intent description",
    "swarmConfig": {
        "strategy": "research",
        "maxAgents": 6,
        "timeout": 60,
        "parallel": true
    },
    "researchConfig": {
        "depth": "comprehensive",
        "focus": ["area1", "area2"],
        "outputFormat": "structured"
    },
    "metadata": {
        "any": "additional data"
    }
}
```

**Response:**
```json
{
    "success": true,
    "jobId": "research-1234567890-abc123",
    "message": "Research job started",
    "logs": "/logs/research-1234567890-abc123",
    "pid": 12345
}
```

#### GET /job/:jobId/status
Check job status.

**Response:**
```json
{
    "status": "completed",
    "jobId": "research-1234567890-abc123",
    "output": {
        "selected_product": { ... },
        "research_summary": "...",
        "repository_url": "https://github.com/user/mvp-project-abc123",
        "repository_name": "mvp-project-abc123"
    }
}
```

#### GET /logs/:jobId
Get job execution logs.

**Response:** Plain text log output

#### GET /health
Health check endpoint.

**Response:**
```json
{
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0"
}
```

## Step 6: Testing the Setup

### 1. Test Health Check

```bash
# From your local machine
curl http://YOUR-EC2-IP/health
```

### 2. Test Webhook Locally on EC2

```bash
# SSH into EC2
cd /opt/claude-flow/scripts
./test-webhook.sh
```

### 3. Test from Local UI

```javascript
// Quick test script
const { ClaudeFlowResearchClient } = require('./LOCAL_UI_WEBHOOK_CLIENT');

async function test() {
    const client = new ClaudeFlowResearchClient({
        baseUrl: 'http://YOUR-EC2-IP'
    });
    
    const health = await client.healthCheck();
    console.log('Health:', health);
    
    const job = await client.submitResearch({
        intent: 'Test research: What is the best way to validate a MVP idea?'
    });
    
    console.log('Job submitted:', job);
}

test();
```

## Step 7: Monitoring and Logs

### View Webhook Server Logs

```bash
# Real-time logs
sudo journalctl -u claude-flow-webhook -f

# View specific job logs
cat /opt/claude-flow/logs/research-*.log
```

### Check Service Status

```bash
# Check all services
sudo systemctl status claude-flow-webhook
sudo systemctl status nginx

# Restart services if needed
sudo systemctl restart claude-flow-webhook
```

### Monitor Resource Usage

```bash
# Check disk space
df -h /opt/claude-flow

# Check memory usage
free -h

# Monitor processes
htop
```

## Advanced Configuration

### Enable HTTPS (Recommended for Production)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### Configure Webhook Authentication

Add to your environment:

```bash
# /opt/claude-flow/config/environment.sh
export WEBHOOK_SECRET="your-strong-secret-here"
export API_KEY_REQUIRED="true"
```

### Scaling Considerations

1. **Use Auto Scaling Group**: For high availability
2. **Add Application Load Balancer**: For multiple instances
3. **Use EFS for shared storage**: For multi-instance setups
4. **Implement job queue**: SQS for better job management

## Troubleshooting

### Common Issues

1. **Webhook not accessible**
   - Check security group allows port 80
   - Verify nginx is running: `sudo systemctl status nginx`
   - Check webhook service: `sudo systemctl status claude-flow-webhook`

2. **Secrets Manager access denied**
   - Verify IAM role is attached to instance
   - Check role has SecretsManager permissions
   - Verify secret name matches: `claude-flow/tokens`

3. **GitHub repo creation fails**
   - Verify GitHub token has repo creation permissions
   - Check GitHub CLI is authenticated: `gh auth status`
   - Review logs: `/opt/claude-flow/logs/research-*.log`

4. **Claude Flow command not found**
   - Ensure npm global bin is in PATH
   - Try using full path: `/usr/bin/npx claude-flow@alpha`
   - Reinstall: `npm install -g claude-flow@alpha`

## Security Best Practices

1. **Use VPC and Private Subnets** for production
2. **Enable CloudWatch Logs** for audit trail
3. **Rotate tokens regularly** in Secrets Manager
4. **Implement rate limiting** in nginx
5. **Use IAM roles** instead of credentials
6. **Enable AWS GuardDuty** for threat detection
7. **Regular security updates**: `sudo apt-get update && sudo apt-get upgrade`

## Cost Optimization

1. **Use Spot Instances** for non-critical workloads
2. **Stop instances** when not in use
3. **Use smaller instance types** if possible (t3.medium may suffice)
4. **Clean up old logs** regularly
5. **Set up billing alerts** in AWS

## Next Steps

1. **Set up monitoring**: CloudWatch dashboards
2. **Implement CI/CD**: For webhook server updates
3. **Add custom post-processing**: Extend the GitHub repo creation script
4. **Create backup strategy**: For research outputs
5. **Build admin dashboard**: For job management

This setup provides a robust foundation for running Claude Flow Research System with remote triggering capabilities and automated GitHub integration.