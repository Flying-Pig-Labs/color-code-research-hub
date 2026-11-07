# Monitoring Dashboard AWS Deployment Guide

This guide walks through adding monitoring dashboard functionality to the existing CloudFormation stack to connect with the EC2-hosted Claude Flow monitoring API.

## 📋 Prerequisites

1. **Existing CF Stack**: `color-code-research-hub` deployed with profile `mvp`
2. **EC2 Instance**: Claude Flow running at `18.209.36.58:8080`
3. **Monitoring API**: Ready to deploy at port 3001 on same EC2
4. **AWS CLI**: Configured with `mvp` profile

## 🚀 Deployment Steps

### Step 1: Create Monitoring API Secret

```bash
# Create API key secret (generate a secure random key)
MONITORING_API_KEY=$(openssl rand -base64 32)

aws secretsmanager create-secret \
  --name monitoring-api-key \
  --description "API key for Claude Flow monitoring dashboard" \
  --secret-string "{\"key\":\"$MONITORING_API_KEY\"}" \
  --region us-east-1 \
  --profile mvp

echo "Created monitoring API key: $MONITORING_API_KEY"
```

### Step 2: Update CloudFormation Template

Add the monitoring functions to your `infrastructure/template.yaml`:

```yaml
# Add these parameters to the Parameters section
Parameters:
  # ... existing parameters ...
  
  EC2MonitoringHost:
    Type: String
    Default: "18.209.36.58"
    Description: EC2 instance IP for monitoring API

  EC2MonitoringPort:
    Type: String
    Default: "3001"
    Description: Port for monitoring API on EC2

# Add monitoring functions to Resources section
Resources:
  # ... existing resources ...

  # Monitoring Dashboard Data Proxy
  MonitoringDashboardFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ../lambda/handlers/
      Handler: monitoringProxy.dashboardHandler
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          EC2_MONITORING_HOST: !Ref EC2MonitoringHost
          EC2_MONITORING_PORT: !Ref EC2MonitoringPort
          MONITORING_API_KEY: '{{resolve:secretsmanager:monitoring-api-key:SecretString:key}}'
      Policies:
        - Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - secretsmanager:GetSecretValue
              Resource: 
                - arn:aws:secretsmanager:us-east-1:984906149037:secret:monitoring-api-key-*
      Events:
        GetDashboard:
          Type: Api
          Properties:
            RestApiId: !Ref ResearchHubApi
            Path: /api/monitoring/dashboard
            Method: GET
        OptionsReq:
          Type: Api
          Properties:
            RestApiId: !Ref ResearchHubApi
            Path: /api/monitoring/dashboard
            Method: OPTIONS

  # ... (add all other monitoring functions from MONITORING_CF_ADDITIONS.yaml)
```

### Step 3: Deploy Updated Stack

```bash
cd infrastructure

# Build and deploy
sam build
sam deploy \
  --profile mvp \
  --stack-name color-code-research-hub \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset \
  --region us-east-1 \
  --parameter-overrides \
    EC2MonitoringHost=18.209.36.58 \
    EC2MonitoringPort=3001
```

### Step 4: Deploy Monitoring API to EC2

```bash
# Copy monitoring files to EC2
scp -r ../monitoring-dashboard/ec2/* ubuntu@18.209.36.58:/home/ubuntu/claude-flow-monitoring/

# SSH to EC2 and setup
ssh ubuntu@18.209.36.58

# On EC2 instance:
cd /home/ubuntu/claude-flow-monitoring

# Install dependencies
npm install

# Configure environment
cp config/.env.example .env

# Edit .env with the generated API key
nano .env
```

**Required .env configuration:**
```bash
# Use the API key generated in Step 1
API_KEY=your-monitoring-api-key-from-step-1

# Port and host
MONITORING_PORT=3001
CLAUDE_FLOW_HOST=localhost
CLAUDE_FLOW_PORT=8080

# Database
DB_TYPE=sqlite
DB_PATH=/home/ubuntu/claude-flow-monitoring/data/monitoring.db

# CORS - Allow requests from API Gateway
CORS_ORIGIN=*

# Security
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW=15
```

```bash
# Build and start
npm run build
pm2 start dist/index.js --name claude-flow-monitoring
pm2 save
pm2 startup

# Open port in security group (if not already open)
# AWS Console: EC2 > Security Groups > Add rule for port 3001
```

### Step 5: Update EC2 Security Group

```bash
# Get the security group ID
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=ip-address,Values=18.209.36.58" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text \
  --profile mvp \
  --region us-east-1)

SG_ID=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query "Reservations[0].Instances[0].SecurityGroups[0].GroupId" \
  --output text \
  --profile mvp \
  --region us-east-1)

# Add inbound rule for port 3001
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 3001 \
  --source-group $SG_ID \
  --profile mvp \
  --region us-east-1

echo "Added port 3001 to security group $SG_ID"
```

### Step 6: Test the Integration

```bash
# Get API Gateway URL
API_URL=$(aws cloudformation describe-stacks \
  --stack-name color-code-research-hub \
  --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" \
  --output text \
  --profile mvp \
  --region us-east-1)

# Test monitoring endpoints
echo "Testing monitoring dashboard endpoint..."
curl "$API_URL/api/monitoring/dashboard"

echo "Testing monitoring metrics endpoint..."
curl "$API_URL/api/monitoring/metrics"

echo "Testing monitoring agents endpoint..."
curl "$API_URL/api/monitoring/agents"
```

### Step 7: Update Frontend Environment

Update your Amplify environment variables:

```bash
# In your Amplify console or .env file:
VITE_API_BASE_URL=https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/production
```

## 🔧 Required API Endpoints

After deployment, these endpoints will be available:

| Endpoint | Purpose | Lambda Function |
|----------|---------|-----------------|
| `/api/monitoring/dashboard` | Aggregated dashboard data | MonitoringDashboardFunction |
| `/api/monitoring/metrics` | System metrics | MonitoringMetricsFunction |
| `/api/monitoring/agents` | Active agents | MonitoringAgentsFunction |
| `/api/monitoring/tasks` | Task status | MonitoringTasksFunction |
| `/api/monitoring/alerts` | Alerts management | MonitoringAlertsFunction |
| `/api/monitoring/stream` | Long-polling updates | MonitoringStreamFunction |

## 📊 Data Flow Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Frontend       │────▶│  API Gateway     │────▶│  Lambda Proxy   │
│  (Amplify)      │     │  /api/monitoring │     │  Functions      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
                        ┌─────────────────┐     ┌──────────────────┐
                        │  EC2 Instance   │◀────│  HTTP Request    │
                        │  18.209.36.58   │     │  Port 3001       │
                        └─────────────────┘     └──────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │  Claude Flow    │
                        │  Monitoring API │
                        │  (Port 3001)    │
                        └─────────────────┘
```

## 🚨 Troubleshooting

### Common Issues

**1. Lambda Timeout Errors**
```bash
# Check CloudWatch logs
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/color-code-research-hub-MonitoringDashboard" \
  --profile mvp \
  --region us-east-1

# Tail logs
aws logs tail "/aws/lambda/color-code-research-hub-MonitoringDashboardFunction-XXXXX" \
  --follow \
  --profile mvp \
  --region us-east-1
```

**2. EC2 Connection Issues**
```bash
# Test direct connection to EC2
curl http://18.209.36.58:3001/health

# Check EC2 service status
ssh ubuntu@18.209.36.58 "pm2 status"

# Check EC2 logs
ssh ubuntu@18.209.36.58 "pm2 logs claude-flow-monitoring"
```

**3. Secret Access Issues**
```bash
# Verify secret exists
aws secretsmanager describe-secret \
  --secret-id monitoring-api-key \
  --profile mvp \
  --region us-east-1

# Test secret access from Lambda
aws secretsmanager get-secret-value \
  --secret-id monitoring-api-key \
  --profile mvp \
  --region us-east-1
```

**4. CORS Issues**
```bash
# Verify CORS headers in Lambda response
curl -H "Origin: https://your-amplify-domain.amplifyapp.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  "$API_URL/api/monitoring/dashboard"
```

### Performance Optimization

**1. Enable Lambda Provisioned Concurrency**
```bash
aws lambda put-provisioned-concurrency-config \
  --function-name color-code-research-hub-MonitoringDashboardFunction-XXXXX \
  --qualifier \$LATEST \
  --provisioned-concurrency-config ProvisionedConcurrencyConfig=1 \
  --profile mvp \
  --region us-east-1
```

**2. EC2 Performance Tuning**
```bash
# On EC2, optimize Node.js memory
pm2 restart claude-flow-monitoring --node-args="--max-old-space-size=2048"

# Enable compression
echo "ENABLE_COMPRESSION=true" >> /home/ubuntu/claude-flow-monitoring/.env
pm2 restart claude-flow-monitoring
```

## 🔄 Maintenance

### Regular Tasks

**1. Monitor Lambda Metrics**
```bash
# Check invocation counts and errors
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=color-code-research-hub-MonitoringDashboardFunction-XXXXX \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Sum \
  --profile mvp \
  --region us-east-1
```

**2. EC2 Health Checks**
```bash
# Automated health check script
ssh ubuntu@18.209.36.58 'curl -f http://localhost:3001/health || pm2 restart claude-flow-monitoring'
```

**3. Database Cleanup**
```bash
# Clean old monitoring data (run weekly)
ssh ubuntu@18.209.36.58 'cd /home/ubuntu/claude-flow-monitoring && npm run db:cleanup'
```

## ✅ Success Criteria

After successful deployment:

1. ✅ All monitoring endpoints return 200 status
2. ✅ Frontend monitoring components display data
3. ✅ Real-time updates work via long-polling
4. ✅ Alert system functions properly
5. ✅ Performance metrics are collected
6. ✅ CORS allows frontend access
7. ✅ Error handling provides graceful fallbacks

The monitoring dashboard should now provide comprehensive visibility into Claude Flow operations through the RESEARCH/Runs tab interface.