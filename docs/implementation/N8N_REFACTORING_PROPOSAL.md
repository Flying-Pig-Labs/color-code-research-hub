# n8n Refactoring Proposal: EC2 Competitive Intelligence System

## Executive Summary

This document provides a detailed technical proposal for refactoring the EC2 competitive intelligence system using n8n, a workflow automation platform. The refactoring will replace the current backend implementation with n8n workflows, providing better maintainability, visual workflow management, and built-in error handling.

## Architecture Overview

### Current Architecture
- Frontend: React application with form submission
- Backend: Node.js/Express server handling webhooks
- Processing: Direct EC2 API calls and GitHub polling
- Storage: File-based job tracking

### Proposed n8n Architecture
- Frontend: Unchanged React application
- Backend: n8n workflows with webhook triggers
- Processing: Visual workflows with built-in nodes
- Storage: PostgreSQL/MySQL database for job tracking

## Core n8n Components

### 1. Webhook Node - Form Reception
```json
{
  "node": "Webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "research-submission",
    "responseMode": "responseNode",
    "options": {
      "rawBody": false,
      "responseData": "allEntries",
      "responsePropertyName": "data"
    }
  }
}
```

**Key Features:**
- Receives POST requests from React frontend
- Automatically parses JSON/form-data
- Provides test and production URLs
- Maximum payload size: 16MB (configurable)

### 2. Code Node - Job ID Generation
```javascript
// Generate unique job ID
const timestamp = Date.now();
const randomId = Math.random().toString(36).substring(2, 9);
const jobId = `job-${timestamp}-${randomId}`;

// Prepare job data
const jobData = {
  jobId: jobId,
  status: 'pending',
  createdAt: new Date().toISOString(),
  formData: $input.first().json,
  ec2Status: 'not_started',
  githubRepoUrl: null,
  completedAt: null
};

return [{
  json: jobData
}];
```

### 3. HTTP Request Node - EC2 API Call
```json
{
  "node": "HTTP Request",
  "parameters": {
    "method": "POST",
    "url": "https://your-ec2-instance.compute.amazonaws.com/api/research",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "X-API-Key",
          "value": "={{$credentials.ec2ApiKey}}"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "jobId",
          "value": "={{$json.jobId}}"
        },
        {
          "name": "formData",
          "value": "={{$json.formData}}"
        }
      ]
    },
    "options": {
      "timeout": 30000,
      "response": {
        "response": {
          "responseFormat": "json"
        }
      }
    }
  }
}
```

### 4. PostgreSQL Node - Job Storage
```json
{
  "node": "Postgres",
  "parameters": {
    "operation": "insert",
    "table": "research_jobs",
    "columns": "job_id,status,created_at,form_data,ec2_status,github_repo_url",
    "additionalFields": {
      "queryBatching": "transaction"
    }
  }
}
```

**Database Schema:**
```sql
CREATE TABLE research_jobs (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  form_data JSONB NOT NULL,
  ec2_status VARCHAR(50),
  github_repo_url TEXT,
  completed_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);
```

### 5. Respond to Webhook Node - Immediate Response
```json
{
  "node": "Respond to Webhook",
  "parameters": {
    "responseMode": "responseNode",
    "responseCode": 200,
    "responseHeaders": {
      "values": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "responseData": "={{JSON.stringify({jobId: $json.jobId, status: 'accepted', message: 'Research job submitted successfully'})}}"
  }
}
```

## Polling Workflow for GitHub Repository Check

### 1. Schedule Trigger Node
```json
{
  "node": "Schedule Trigger",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "minutes",
          "minutesInterval": 5
        }
      ]
    }
  }
}
```

### 2. PostgreSQL Node - Get Pending Jobs
```json
{
  "node": "Postgres",
  "parameters": {
    "operation": "executeQuery",
    "query": "SELECT * FROM research_jobs WHERE status = 'pending' AND ec2_status = 'processing' AND created_at > NOW() - INTERVAL '24 hours' ORDER BY created_at ASC LIMIT 10"
  }
}
```

### 3. Loop Over Items Node
```json
{
  "node": "Loop Over Items",
  "parameters": {
    "batchSize": 1,
    "options": {}
  }
}
```

### 4. HTTP Request Node - Check GitHub Repository
```json
{
  "node": "HTTP Request",
  "parameters": {
    "method": "GET",
    "url": "=https://api.github.com/repos/{{$json.github_username}}/{{$json.expected_repo_name}}",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "Bearer {{$credentials.githubToken}}"
        },
        {
          "name": "Accept",
          "value": "application/vnd.github.v3+json"
        }
      ]
    },
    "options": {
      "ignoreResponseStatusErrors": true
    }
  }
}
```

### 5. Switch Node - Check Response Status
```json
{
  "node": "Switch",
  "parameters": {
    "dataType": "number",
    "value1": "={{$response.statusCode}}",
    "rules": {
      "rules": [
        {
          "value2": 200,
          "output": 0
        },
        {
          "value2": 404,
          "output": 1
        }
      ]
    },
    "fallbackOutput": 2
  }
}
```

### 6. Update Database - Repository Found
```json
{
  "node": "Postgres",
  "parameters": {
    "operation": "update",
    "table": "research_jobs",
    "updateKey": "job_id",
    "columns": "status,github_repo_url,completed_at",
    "additionalFields": {
      "values": {
        "status": "completed",
        "github_repo_url": "={{$json.html_url}}",
        "completed_at": "={{new Date().toISOString()}}"
      }
    }
  }
}
```

## Error Handling Workflow

### 1. Error Trigger Node
```json
{
  "node": "Error Trigger",
  "parameters": {}
}
```

### 2. Code Node - Process Error
```javascript
const error = $input.first().json;
const errorData = {
  workflowId: error.workflow.id,
  workflowName: error.workflow.name,
  executionId: error.execution.id,
  errorMessage: error.message,
  errorTime: new Date().toISOString(),
  nodeType: error.node.type,
  nodeName: error.node.name
};

// Extract job ID if present
if (error.data && error.data.jobId) {
  errorData.jobId = error.data.jobId;
}

return [{
  json: errorData
}];
```

### 3. PostgreSQL Node - Log Error
```json
{
  "node": "Postgres",
  "parameters": {
    "operation": "executeQuery",
    "query": "UPDATE research_jobs SET error_message = $1, retry_count = retry_count + 1 WHERE job_id = $2",
    "additionalFields": {
      "queryParams": "={{$json.errorMessage}},{{$json.jobId}}"
    }
  }
}
```

### 4. Slack Node - Send Alert
```json
{
  "node": "Slack",
  "parameters": {
    "channel": "#alerts",
    "text": "Research Job Error: {{$json.jobId}}\nError: {{$json.errorMessage}}\nWorkflow: {{$json.workflowName}}"
  }
}
```

## Environment Variables and Credentials

### 1. EC2 API Credentials
```javascript
// In n8n credentials store
{
  "name": "EC2 Research API",
  "type": "httpHeaderAuth",
  "data": {
    "name": "X-API-Key",
    "value": "your-ec2-api-key"
  }
}
```

### 2. GitHub Credentials
```javascript
// In n8n credentials store
{
  "name": "GitHub API",
  "type": "httpHeaderAuth",
  "data": {
    "name": "Authorization",
    "value": "Bearer your-github-token"
  }
}
```

### 3. Database Credentials
```javascript
// PostgreSQL credentials
{
  "host": "localhost",
  "port": 5432,
  "database": "research_hub",
  "user": "n8n_user",
  "password": "secure_password",
  "ssl": {
    "rejectUnauthorized": false
  }
}
```

### 4. AWS Secrets Manager Integration (Production)
```javascript
// External secrets configuration
{
  "provider": "awsSecretsManager",
  "config": {
    "region": "us-east-1",
    "accessKeyId": "{{$env.AWS_ACCESS_KEY_ID}}",
    "secretAccessKey": "{{$env.AWS_SECRET_ACCESS_KEY}}"
  }
}
```

## Deployment Options

### 1. Docker Compose Setup
```yaml
version: '3.8'

services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=n8n.yourdomain.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://n8n.yourdomain.com/
      - N8N_PAYLOAD_SIZE_MAX=32
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/home/node/workflows
    depends_on:
      - postgres

  postgres:
    image: postgres:14
    restart: unless-stopped
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  n8n_data:
  postgres_data:
```

### 2. AWS EC2 Deployment Script
```bash
#!/bin/bash

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create n8n directory
mkdir -p /opt/n8n
cd /opt/n8n

# Copy docker-compose.yml and .env files
# (These should be uploaded separately)

# Start n8n
sudo docker-compose up -d

# Setup SSL with Certbot
sudo apt-get install certbot python3-certbot-nginx -y
sudo certbot --nginx -d n8n.yourdomain.com
```

## Implementation Workflow JSON

### Main Research Submission Workflow
```json
{
  "name": "Research Submission Handler",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "research-submission",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForAllItems",
        "jsCode": "// Generate unique job ID\nconst timestamp = Date.now();\nconst randomId = Math.random().toString(36).substring(2, 9);\nconst jobId = `job-${timestamp}-${randomId}`;\n\n// Prepare job data\nconst jobData = {\n  jobId: jobId,\n  status: 'pending',\n  createdAt: new Date().toISOString(),\n  formData: $input.first().json,\n  ec2Status: 'not_started',\n  githubRepoUrl: null,\n  completedAt: null\n};\n\nreturn [{\n  json: jobData\n}];"
      },
      "name": "Generate Job ID",
      "type": "n8n-nodes-base.code",
      "position": [450, 300]
    },
    {
      "parameters": {
        "operation": "insert",
        "table": "research_jobs",
        "columns": "job_id,status,created_at,form_data,ec2_status",
        "additionalFields": {}
      },
      "name": "Store Job",
      "type": "n8n-nodes-base.postgres",
      "position": [650, 300],
      "credentials": {
        "postgres": {
          "id": "1",
          "name": "PostgreSQL"
        }
      }
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://your-ec2-instance.compute.amazonaws.com/api/research",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "jobId",
              "value": "={{$json.jobId}}"
            },
            {
              "name": "formData",
              "value": "={{JSON.stringify($json.formData)}}"
            }
          ]
        },
        "options": {
          "timeout": 30000
        }
      },
      "name": "Call EC2 API",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 300],
      "credentials": {
        "httpHeaderAuth": {
          "id": "2",
          "name": "EC2 API Key"
        }
      },
      "continueOnFail": true
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$response.statusCode}}",
              "operation": "equal",
              "value2": 200
            }
          ]
        }
      },
      "name": "Check EC2 Response",
      "type": "n8n-nodes-base.if",
      "position": [1050, 300]
    },
    {
      "parameters": {
        "operation": "update",
        "table": "research_jobs",
        "updateKey": "job_id",
        "columns": "ec2_status",
        "additionalFields": {
          "values": {
            "ec2_status": "processing"
          }
        }
      },
      "name": "Update EC2 Status",
      "type": "n8n-nodes-base.postgres",
      "position": [1250, 200],
      "credentials": {
        "postgres": {
          "id": "1",
          "name": "PostgreSQL"
        }
      }
    },
    {
      "parameters": {
        "operation": "update",
        "table": "research_jobs",
        "updateKey": "job_id",
        "columns": "ec2_status,error_message",
        "additionalFields": {
          "values": {
            "ec2_status": "failed",
            "error_message": "={{$json.error.message}}"
          }
        }
      },
      "name": "Update Error Status",
      "type": "n8n-nodes-base.postgres",
      "position": [1250, 400],
      "credentials": {
        "postgres": {
          "id": "1",
          "name": "PostgreSQL"
        }
      }
    },
    {
      "parameters": {
        "responseCode": 200,
        "responseHeaders": {
          "values": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "responseData": "={{JSON.stringify({jobId: $json.jobId, status: 'accepted', message: 'Research job submitted successfully'})}}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1450, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Generate Job ID",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Generate Job ID": {
      "main": [
        [
          {
            "node": "Store Job",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Store Job": {
      "main": [
        [
          {
            "node": "Call EC2 API",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Call EC2 API": {
      "main": [
        [
          {
            "node": "Check EC2 Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check EC2 Response": {
      "main": [
        [
          {
            "node": "Update EC2 Status",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Update Error Status",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Update EC2 Status": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Update Error Status": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Benefits of n8n Refactoring

### 1. Visual Workflow Management
- Drag-and-drop interface for workflow design
- Easy debugging with visual execution paths
- Built-in testing capabilities

### 2. Built-in Error Handling
- Error workflows for centralized error management
- Retry mechanisms with exponential backoff
- Detailed error logging and notifications

### 3. Scalability
- Horizontal scaling with multiple n8n instances
- Queue mode for high-volume processing
- Built-in performance monitoring

### 4. Security
- Credential encryption
- AWS Secrets Manager integration
- Role-based access control (Enterprise)

### 5. Monitoring and Observability
- Execution history with detailed logs
- Real-time workflow monitoring
- Integration with external monitoring tools

### 6. Maintenance Benefits
- No code deployment for workflow changes
- Version control for workflows
- Easy rollback capabilities

## Migration Strategy

### Phase 1: Setup Infrastructure
1. Deploy n8n using Docker Compose
2. Configure PostgreSQL database
3. Set up SSL certificates
4. Configure credentials

### Phase 2: Implement Core Workflows
1. Create webhook reception workflow
2. Implement EC2 API integration
3. Set up database operations
4. Test end-to-end flow

### Phase 3: Add Polling and Error Handling
1. Create GitHub polling workflow
2. Implement error workflows
3. Add notification systems
4. Test failure scenarios

### Phase 4: Frontend Integration
1. Update webhook URLs in frontend
2. Test form submissions
3. Verify response handling
4. Monitor performance

### Phase 5: Production Deployment
1. Deploy to production environment
2. Configure monitoring
3. Set up backups
4. Document workflows

## Cost Considerations

### Self-Hosted Option
- EC2 instance: ~$50-150/month (t3.medium recommended)
- RDS PostgreSQL: ~$30-50/month
- Total: ~$80-200/month

### n8n Cloud Option
- Starter: $20/month (2,500 executions)
- Pro: $50/month (10,000 executions)
- Scale as needed

## Conclusion

Refactoring the EC2 competitive intelligence system to n8n provides numerous benefits including visual workflow management, robust error handling, and easier maintenance. The proposed architecture maintains all current functionality while adding scalability, monitoring, and security improvements.

The modular workflow design allows for easy modifications and extensions without code deployments, making the system more maintainable and adaptable to future requirements.