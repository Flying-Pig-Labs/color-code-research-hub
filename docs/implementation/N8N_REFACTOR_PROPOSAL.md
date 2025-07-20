# n8n Refactoring Proposal: EC2 Competitive Intelligence System

## Executive Summary

This proposal outlines a complete refactoring of the current EC2 competitive intelligence system using n8n workflow automation. The refactor will replace custom webhook handling, GitHub polling, and job tracking with visual workflows that are easier to maintain, monitor, and scale.

## 1. Architecture Overview

### Current Architecture
```
Frontend Forms → Backend Proxy → EC2 Webhook → GitHub → Manual Polling
     ↓                ↓             ↓                        ↓
localStorage    Custom Logic    Bash Scripts         Custom JS Service
```

### Proposed n8n Architecture
```
Frontend Forms → n8n Webhook → Parallel Processing → Auto-notification
                      ↓              ↓        ↓
                PostgreSQL      EC2 API   GitHub API
```

## 2. Core Workflows

### 2.1 Main Submission Workflow

```json
{
  "name": "CI Research Submission",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "research-submit",
        "responseMode": "responseNode",
        "responseData": "allEntries",
        "responsePropertyName": "response",
        "options": {
          "responseIncludeHeaders": true,
          "rawBody": false
        }
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "functionCode": "// Generate unique 5-char tracking ID\nconst chars = 'abcdefghijklmnopqrstuvwxyz0123456789';\nlet repoId = '';\nfor (let i = 0; i < 5; i++) {\n  repoId += chars.charAt(Math.floor(Math.random() * chars.length));\n}\n\n// Extract form data\nconst { teamType, formData } = $input.item.json.body;\n\n// Generate expected repo name\nconst date = new Date().toISOString().split('T')[0].replace(/-/g, '');\nconst expectedRepoName = `ci-${teamType}-${repoId}-${date}`;\n\nreturn {\n  repoId,\n  expectedRepoName,\n  teamType,\n  formData,\n  submittedAt: new Date().toISOString()\n};"
      },
      "name": "Generate Tracking ID",
      "type": "n8n-nodes-base.functionItem",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "url": "={{$env.EC2_WEBHOOK_URL}}/api/analyze",
        "method": "POST",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "teamType",
              "value": "={{$json.teamType}}"
            },
            {
              "name": "formData",
              "value": "={{Object.assign($json.formData, {repoId: $json.repoId, companyName: $env.CLIENT_COMPANY_NAME})}}"
            }
          ]
        },
        "options": {
          "timeout": 30000,
          "response": {
            "response": {
              "fullResponse": true
            }
          }
        }
      },
      "name": "Submit to EC2",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [650, 200],
      "credentials": {
        "httpHeaderAuth": {
          "id": "ec2-webhook-auth",
          "name": "EC2 Webhook Auth"
        }
      },
      "continueOnFail": true
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO research_jobs (id, repo_id, team_type, expected_repo_name, form_data, status, submitted_at, ec2_job_id)\nVALUES (\n  gen_random_uuid(),\n  '{{ $json.repoId }}',\n  '{{ $json.teamType }}',\n  '{{ $json.expectedRepoName }}',\n  '{{ JSON.stringify($json.formData) }}'::jsonb,\n  '{{ $node[\"Submit to EC2\"].json.error ? \"failed\" : \"submitted\" }}',\n  '{{ $json.submittedAt }}',\n  '{{ $node[\"Submit to EC2\"].json.body?.jobId }}'\n)\nRETURNING *;",
        "additionalFields": {}
      },
      "name": "Store Job in DB",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [850, 300],
      "credentials": {
        "postgres": {
          "id": "postgres-ci-system",
          "name": "CI System PostgreSQL"
        }
      }
    },
    {
      "parameters": {
        "values": {
          "boolean": [],
          "string": [
            {
              "name": "response.success",
              "value": "={{ !$node[\"Submit to EC2\"].json.error }}"
            },
            {
              "name": "response.jobId",
              "value": "={{ $node[\"Store Job in DB\"].json[0].id }}"
            },
            {
              "name": "response.repoId",
              "value": "={{ $json.repoId }}"
            },
            {
              "name": "response.expectedRepoName",
              "value": "={{ $json.expectedRepoName }}"
            },
            {
              "name": "response.message",
              "value": "={{ $node[\"Submit to EC2\"].json.error ? \"EC2 submission failed but job was logged\" : \"Research submitted successfully\" }}"
            }
          ]
        },
        "options": {}
      },
      "name": "Format Response",
      "type": "n8n-nodes-base.set",
      "typeVersion": 1,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "respondWith": "allIncomingItems",
        "responseBody": "={{ $json.response }}",
        "responseCode": "={{ $node[\"Submit to EC2\"].json.error ? 500 : 200 }}",
        "responseHeaders": {
          "entries": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        }
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1250, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Generate Tracking ID",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Generate Tracking ID": {
      "main": [
        [
          {
            "node": "Submit to EC2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Submit to EC2": {
      "main": [
        [
          {
            "node": "Store Job in DB",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Store Job in DB": {
      "main": [
        [
          {
            "node": "Format Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Format Response": {
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

### 2.2 GitHub Polling Workflow

```json
{
  "name": "CI GitHub Polling",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "minutesInterval": 5
            }
          ]
        }
      },
      "name": "Every 5 Minutes",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM research_jobs \nWHERE status IN ('submitted', 'processing') \nAND submitted_at > NOW() - INTERVAL '24 hours'\nORDER BY submitted_at ASC;",
        "additionalFields": {}
      },
      "name": "Get Pending Jobs",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [450, 300],
      "credentials": {
        "postgres": {
          "id": "postgres-ci-system",
          "name": "CI System PostgreSQL"
        }
      }
    },
    {
      "parameters": {
        "batchSize": 1,
        "options": {}
      },
      "name": "Process Each Job",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "url": "=https://api.github.com/repos/{{ $env.GITHUB_ORG }}/{{ $json.expected_repo_name }}",
        "method": "GET",
        "options": {
          "response": {
            "response": {
              "fullResponse": true,
              "neverError": true
            }
          }
        }
      },
      "name": "Check GitHub Repo",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [850, 300],
      "credentials": {
        "httpHeaderAuth": {
          "id": "github-api-token",
          "name": "GitHub API Token"
        }
      }
    },
    {
      "parameters": {
        "dataType": "number",
        "value1": "={{ $json.statusCode }}",
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
      },
      "name": "Check Status",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "UPDATE research_jobs \nSET \n  status = 'completed',\n  github_url = '{{ $node[\"Check GitHub Repo\"].json.body.html_url }}',\n  completed_at = NOW(),\n  github_data = '{{ JSON.stringify($node[\"Check GitHub Repo\"].json.body) }}'::jsonb\nWHERE id = '{{ $node[\"Process Each Job\"].json.id }}';",
        "additionalFields": {}
      },
      "name": "Update Job - Found",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [1250, 200],
      "credentials": {
        "postgres": {
          "id": "postgres-ci-system",
          "name": "CI System PostgreSQL"
        }
      }
    },
    {
      "parameters": {
        "resource": "message",
        "text": "=🎉 Research Completed!\n\nTracking ID: {{ $node[\"Process Each Job\"].json.repo_id }}\nTeam: {{ $node[\"Process Each Job\"].json.team_type }}\nGitHub: {{ $node[\"Check GitHub Repo\"].json.body.html_url }}",
        "additionalFields": {
          "channel": "={{ $env.SLACK_CHANNEL }}",
          "as_user": false,
          "username": "CI Research Bot"
        }
      },
      "name": "Notify Slack",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 1,
      "position": [1450, 200],
      "credentials": {
        "slackApi": {
          "id": "slack-ci-bot",
          "name": "CI Bot Slack"
        }
      }
    }
  ]
}
```

### 2.3 Error Handling Workflow

```json
{
  "name": "CI Error Handler",
  "nodes": [
    {
      "parameters": {},
      "name": "Error Trigger",
      "type": "n8n-nodes-base.errorTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO error_logs (workflow_name, node_name, error_message, error_data, occurred_at)\nVALUES (\n  '{{ $json.workflow.name }}',\n  '{{ $json.node.name }}',\n  '{{ $json.error.message }}',\n  '{{ JSON.stringify($json) }}'::jsonb,\n  NOW()\n);",
        "additionalFields": {}
      },
      "name": "Log Error to DB",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ]
}
```

## 3. Database Schema

```sql
-- Main job tracking table
CREATE TABLE research_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id VARCHAR(5) NOT NULL,
    team_type VARCHAR(10) NOT NULL,
    expected_repo_name VARCHAR(255) NOT NULL,
    form_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'submitted',
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ec2_job_id VARCHAR(255),
    github_url TEXT,
    github_data JSONB,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_research_jobs_status ON research_jobs(status);
CREATE INDEX idx_research_jobs_repo_id ON research_jobs(repo_id);
CREATE INDEX idx_research_jobs_submitted_at ON research_jobs(submitted_at);

-- Error logging table
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name VARCHAR(255),
    node_name VARCHAR(255),
    error_message TEXT,
    error_data JSONB,
    occurred_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. Credentials Configuration

### 4.1 PostgreSQL Connection
```json
{
  "name": "CI System PostgreSQL",
  "type": "postgres",
  "data": {
    "host": "localhost",
    "port": 5432,
    "database": "ci_research",
    "user": "n8n_user",
    "password": "secure_password",
    "ssl": true
  }
}
```

### 4.2 EC2 Webhook Auth
```json
{
  "name": "EC2 Webhook Auth",
  "type": "httpHeaderAuth",
  "data": {
    "name": "X-Webhook-Signature",
    "value": "={{ $env.WEBHOOK_SECRET }}"
  }
}
```

### 4.3 GitHub API Token
```json
{
  "name": "GitHub API Token",
  "type": "httpHeaderAuth",
  "data": {
    "name": "Authorization",
    "value": "token {{ $env.GITHUB_TOKEN }}"
  }
}
```

## 5. Environment Variables

```bash
# .env file for n8n
EC2_WEBHOOK_URL=http://your-ec2-ip
CLIENT_COMPANY_NAME=YourClient
WEBHOOK_SECRET=your-webhook-secret
GITHUB_ORG=your-github-org
GITHUB_TOKEN=ghp_xxxxx
SLACK_CHANNEL=#ci-notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx

# Database
DATABASE_TYPE=postgresdb
DATABASE_POSTGRESDB_HOST=localhost
DATABASE_POSTGRESDB_PORT=5432
DATABASE_POSTGRESDB_DATABASE=ci_research
DATABASE_POSTGRESDB_USER=n8n_user
DATABASE_POSTGRESDB_PASSWORD=secure_password

# n8n Configuration
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_HOST=n8n.yourdomain.com
WEBHOOK_URL=https://n8n.yourdomain.com/
N8N_ENCRYPTION_KEY=your-encryption-key
```

## 6. Deployment Configuration

### 6.1 Docker Compose (Recommended)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    restart: always
    environment:
      POSTGRES_USER: n8n_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: ci_research
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - n8n-network

  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=secure_admin_password
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=${WEBHOOK_URL}
      - DATABASE_TYPE=postgresdb
      - DATABASE_POSTGRESDB_HOST=postgres
      - DATABASE_POSTGRESDB_PORT=5432
      - DATABASE_POSTGRESDB_DATABASE=ci_research
      - DATABASE_POSTGRESDB_USER=n8n_user
      - DATABASE_POSTGRESDB_PASSWORD=secure_password
    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/workflows
    networks:
      - n8n-network
    depends_on:
      - postgres

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    networks:
      - n8n-network
    depends_on:
      - n8n

volumes:
  postgres_data:
  n8n_data:

networks:
  n8n-network:
    driver: bridge
```

### 6.2 Nginx Configuration

```nginx
server {
    listen 80;
    server_name n8n.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name n8n.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://n8n:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

## 7. Frontend Integration Updates

### 7.1 Update API Service

```typescript
// src/services/api.ts
export const n8nService = {
  async submitResearch(submission: ResearchSubmission & { repoId: string }) {
    const response = await fetch(`${N8N_WEBHOOK_URL}/webhook/research-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamType: submission.teamType,
        formData: submission.fields
      })
    });
    
    return response.json();
  },
  
  async getJobStatus(jobId: string) {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/status`);
    return response.json();
  }
};
```

### 7.2 Simple Status API (Optional)

```json
{
  "name": "CI Job Status API",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "GET",
        "path": "jobs/:jobId/status",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM research_jobs WHERE id = '{{ $json.params.jobId }}';",
        "additionalFields": {}
      },
      "name": "Get Job Status",
      "type": "n8n-nodes-base.postgres"
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json[0] || { error: 'Job not found' } }}",
        "responseCode": "={{ $json[0] ? 200 : 404 }}"
      },
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook"
    }
  ]
}
```

## 8. Migration Strategy

### Phase 1: Parallel Run (Week 1-2)
1. Deploy n8n with database
2. Create submission workflow
3. Update frontend to submit to both backends
4. Monitor for discrepancies

### Phase 2: GitHub Polling Migration (Week 3)
1. Activate polling workflow
2. Compare results with existing system
3. Gradually reduce custom polling frequency

### Phase 3: Complete Cutover (Week 4)
1. Disable old backend endpoints
2. Update all frontend calls to n8n
3. Archive old code
4. Monitor for issues

## 9. Benefits Summary

### Operational Benefits
- **Visual Monitoring**: See exactly where each job is in real-time
- **Error Recovery**: Automatic retries with exponential backoff
- **Scalability**: Handle 1000s of concurrent jobs
- **Debugging**: Full execution history with data at each step

### Development Benefits
- **No-Code Changes**: Business logic updates without deployment
- **Version Control**: Export/import workflows as JSON
- **Testing**: Built-in workflow testing capabilities
- **Integration**: Easy to add Slack, email, or other notifications

### Cost Benefits
- **Reduced Code**: ~80% less custom code to maintain
- **Faster Features**: Add new integrations in minutes, not days
- **Lower OpEx**: Less debugging and maintenance time

## 10. Estimated Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Setup | 1 day | Install n8n, configure database, SSL |
| Core Workflows | 2 days | Implement submission and polling |
| Testing | 2 days | Parallel run, load testing |
| Migration | 1 day | Frontend updates, cutover |
| **Total** | **6 days** | **Full migration** |

## Conclusion

n8n provides a robust, scalable solution that reduces complexity while adding powerful features like visual monitoring, automatic error handling, and easy integrations. The migration can be done incrementally with minimal risk to the existing system.