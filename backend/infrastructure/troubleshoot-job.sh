#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if job ID is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide a job ID${NC}"
    echo "Usage: ./troubleshoot-job.sh <job-id>"
    echo "Example: ./troubleshoot-job.sh job-me5psedx-wd4n9af2g"
    exit 1
fi

JOB_ID=$1
PROFILE="mvp"
REGION="us-east-1"

echo -e "${BLUE}=== Troubleshooting Job: ${JOB_ID} ===${NC}\n"

# Step 1: Check job status in DynamoDB
echo -e "${YELLOW}1. Checking job status in DynamoDB...${NC}"
JOB_DATA=$(aws dynamodb get-item \
    --table-name PlanGenerationJobs \
    --key "{\"jobId\":{\"S\":\"${JOB_ID}\"}}" \
    --profile ${PROFILE} \
    --region ${REGION} \
    2>/dev/null)

if [ -z "$JOB_DATA" ]; then
    echo -e "${RED}Job not found in DynamoDB${NC}"
    exit 1
fi

# Extract key fields
STATUS=$(echo "$JOB_DATA" | jq -r '.Item.status.S // "unknown"')
CREATED_AT=$(echo "$JOB_DATA" | jq -r '.Item.createdAt.S // "unknown"')
UPDATED_AT=$(echo "$JOB_DATA" | jq -r '.Item.updatedAt.S // "unknown"')

echo -e "Status: ${GREEN}${STATUS}${NC}"
echo -e "Created: ${CREATED_AT}"
echo -e "Updated: ${UPDATED_AT}"

# Show errors if any
ERRORS=$(echo "$JOB_DATA" | jq -r '.Item.errors.L[]?.M.error.S // empty' 2>/dev/null)
if [ ! -z "$ERRORS" ]; then
    echo -e "${RED}Errors found:${NC}"
    echo "$ERRORS"
fi

# Show stages
echo -e "\n${YELLOW}2. Job stages:${NC}"
echo "$JOB_DATA" | jq -r '.Item.stages.M | to_entries[] | "\(.key): \(.value.M.status.S // "unknown")"' 2>/dev/null || echo "No stages data"

# Step 2: Check CloudWatch logs
echo -e "\n${YELLOW}3. Fetching CloudWatch logs (last 10 minutes)...${NC}"
echo -e "${BLUE}--- PlanOrchestrator Logs ---${NC}"

# Get logs with context
aws logs tail /aws/lambda/color-code-research-hub-PlanOrchestratorFunction-lSc6H7LIK8FG \
    --profile ${PROFILE} \
    --region ${REGION} \
    --since 10m 2>/dev/null | grep -A 10 -B 5 "${JOB_ID}" | tail -50

# Check for specific error patterns
echo -e "\n${YELLOW}4. Checking for common error patterns...${NC}"

ERROR_LOGS=$(aws logs tail /aws/lambda/color-code-research-hub-PlanOrchestratorFunction-lSc6H7LIK8FG \
    --profile ${PROFILE} \
    --region ${REGION} \
    --since 10m 2>/dev/null | grep "${JOB_ID}" -A 20 | grep -E "ERROR|error|failed|Failed")

if [ ! -z "$ERROR_LOGS" ]; then
    echo -e "${RED}Errors found in logs:${NC}"
    echo "$ERROR_LOGS"
else
    echo -e "${GREEN}No obvious errors found in recent logs${NC}"
fi

# Step 3: Check job result if completed
if [ "$STATUS" = "COMPLETED" ]; then
    echo -e "\n${YELLOW}5. Job completed successfully. Checking results...${NC}"
    RESULT_COUNT=$(echo "$JOB_DATA" | jq '.Item.results.M.phases.L | length' 2>/dev/null)
    echo -e "Generated ${GREEN}${RESULT_COUNT}${NC} phases"
fi

# Step 4: Provide API endpoint for status check
echo -e "\n${YELLOW}6. API Status Check:${NC}"
echo -e "You can check the job status via API:"
echo -e "${BLUE}curl -s https://zi612qxxv0.execute-api.us-east-1.amazonaws.com/production/api/plan/async/status/${JOB_ID} | jq${NC}"

echo -e "\n${GREEN}=== Troubleshooting Complete ===${NC}"