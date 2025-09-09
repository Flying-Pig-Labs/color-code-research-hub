#!/bin/bash

# Deploy script for Color Code Research Hub
# CRITICAL: Uses MVP AWS profile and account 984906149037 ONLY!

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Enable debug mode if DEBUG is set
if [ "${DEBUG:-}" = "true" ]; then
    set -x  # Print commands as they execute
fi

# CRITICAL: MUST use mvp profile - NEVER personal!
PROFILE=${AWS_PROFILE:-mvp}

echo "==============================================="
echo "🚀 Color Code Research Hub Deployment Script"
echo "==============================================="
echo "📅 Date: $(date)"
echo "👤 Profile: $PROFILE"
echo "🌎 Region: us-east-1"
echo "📦 Stack: color-code-research-hub"
echo "==============================================="

# Verify we're NOT using personal profile
if [ "$PROFILE" = "personal" ]; then
    echo "❌ CRITICAL ERROR: Attempting to use 'personal' profile!"
    echo "This deployment MUST use the 'mvp' profile for account 984906149037"
    echo "Please run with: AWS_PROFILE=mvp ./deploy.sh"
    exit 1
fi

# Set AWS profile and region
export AWS_PROFILE=$PROFILE
export AWS_REGION=us-east-1

# Verify AWS credentials
echo ""
echo "📋 Step 1: Verifying AWS credentials..."
echo "---------------------------------------"

ACCOUNT_INFO=$(aws sts get-caller-identity --profile $PROFILE 2>&1) || {
    echo "❌ Failed to authenticate with AWS profile '$PROFILE'"
    echo "Error details: $ACCOUNT_INFO"
    echo ""
    echo "Please ensure you have configured the '$PROFILE' profile with:"
    echo "  aws configure --profile $PROFILE"
    echo "Or set AWS_PROFILE environment variable to your preferred profile"
    exit 1
}

# Parse account info
ACCOUNT_ID=$(echo "$ACCOUNT_INFO" | jq -r '.Account')
USER_ARN=$(echo "$ACCOUNT_INFO" | jq -r '.Arn')

echo "✅ Successfully authenticated!"
echo "   Account ID: $ACCOUNT_ID"
echo "   User ARN: $USER_ARN"

# Verify it's the correct account
if [ "$ACCOUNT_ID" != "984906149037" ]; then
    echo ""
    echo "❌ CRITICAL ERROR: Wrong AWS account!"
    echo "   Expected: 984906149037"
    echo "   Actual: $ACCOUNT_ID"
    echo ""
    echo "Please switch to the MVP account profile!"
    exit 1
fi

echo "✅ Correct AWS account verified!"

# Navigate to infrastructure directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo ""
echo "📁 Step 2: Navigating to infrastructure directory..."
echo "---------------------------------------"
cd "$SCRIPT_DIR"
echo "✅ Current directory: $(pwd)"

# Check if template.yaml exists
if [ ! -f "template.yaml" ]; then
    echo "❌ ERROR: template.yaml not found in current directory!"
    echo "   Please ensure you're running this script from the infrastructure directory"
    exit 1
fi
echo "✅ Found template.yaml"

# Copy canonical prompts into handlers for packaging (build-only)
echo ""
echo "📤 Step 3: Copying prompts into handlers for build..."
echo "---------------------------------------"
"$(dirname "$0")/copy-prompts-for-build.sh"
echo "✅ Prompts copied"

# Preflight validations (fail-fast)
echo ""
echo "🧪 Step 3.1: Validating SAM template..."
echo "---------------------------------------"
SAM_VALIDATE_OUT=$(sam validate 2>&1) || {
    echo "❌ SAM template validation failed!"
    echo "$SAM_VALIDATE_OUT"
    exit 1
}
echo "✅ SAM template is valid"

# Optional CDK synth preflight (skipped if SKIP_CDK=1)
if [ "${SKIP_CDK:-}" != "1" ] && [ "${SKIP_CDK:-}" != "true" ]; then
  CDK_DIR="$SCRIPT_DIR/cdk"
  if [ -d "$CDK_DIR" ] && [ -f "$CDK_DIR/package.json" ]; then
    echo ""
    echo "🧪 Step 3.2: CDK synth preflight (Auth/Data/API) ..."
    echo "---------------------------------------"
    pushd "$CDK_DIR" >/dev/null
    npm install >/dev/null
    set +e
    npx cdk -a 'npx ts-node bin/auth-layer.ts' synth AuthStack >/dev/null
    AUTH_SYNTH_RC=$?
    npx cdk -a 'npx ts-node bin/data-layer.ts' synth DataLayerStack >/dev/null
    DATA_SYNTH_RC=$?
    npx cdk -a 'npx ts-node bin/api-layer.ts' synth ApiLayerStack >/dev/null
    API_SYNTH_RC=$?
    set -e
    if [ $AUTH_SYNTH_RC -ne 0 ] || [ $DATA_SYNTH_RC -ne 0 ] || [ $API_SYNTH_RC -ne 0 ]; then
      echo "❌ CDK synth failed: Auth=$AUTH_SYNTH_RC, Data=$DATA_SYNTH_RC, API=$API_SYNTH_RC"
      echo "   Run with DEBUG=true for detailed output."
      popd >/dev/null
      exit 1
    fi
    popd >/dev/null
    echo "✅ CDK synth passed for Auth/Data/API"
  else
    echo "ℹ️  CDK project not found; skipping CDK synth preflight."
  fi
fi

# Build the SAM application with parallel and caching
echo ""
echo "🏗️  Step 4: Building SAM application..."
echo "---------------------------------------"
if [ "${NO_CACHE:-}" = "1" ] || [ "${NO_CACHE:-}" = "true" ]; then
    echo "⚙️  Using parallel build without cache (this may take longer)"
    SAM_BUILD_ARGS=(--parallel --no-cached)
else
    echo "⚙️  Using parallel build with caching for faster builds"
    SAM_BUILD_ARGS=(--parallel --cached)
fi

BUILD_START=$(date +%s)
sam build "${SAM_BUILD_ARGS[@]}" 2>&1 | while IFS= read -r line; do
    echo "   BUILD: $line"
done

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "❌ SAM build failed!"
    exit 1
fi

BUILD_END=$(date +%s)
BUILD_DURATION=$((BUILD_END - BUILD_START))
echo "✅ Build completed successfully in ${BUILD_DURATION} seconds!"

# Deploy the SAM application
echo ""
echo "🚀 Step 5: Deploying SAM application..."
echo "---------------------------------------"
echo "⚙️  Stack: color-code-research-hub"
echo "⚙️  Region: us-east-1"
echo "⚙️  Profile: $PROFILE"
echo ""

DEPLOY_START=$(date +%s)

# Compose parameter overrides safely (omit empty values)
PARAM_OVERRIDES=(
  "Environment=production"
  "GitHubOrg=Flying-Pig-Labs"
  "ClientCompanyName=Your Company"
)

if [ -n "${USER_POOL_ID:-}" ]; then
  PARAM_OVERRIDES+=("CognitoUserPoolIdParam=${USER_POOL_ID}")
  # Construct the ARN from the User Pool ID
  USER_POOL_ARN="arn:aws:cognito-idp:${AWS_REGION}:${ACCOUNT_ID}:userpool/${USER_POOL_ID}"
  PARAM_OVERRIDES+=("CognitoUserPoolArnParam=${USER_POOL_ARN}")
fi
if [ -n "${STRIPE_PRICE_CREDIT:-}" ]; then
  PARAM_OVERRIDES+=("StripePriceCredit=${STRIPE_PRICE_CREDIT}")
fi
if [ -n "${STRIPE_WEBHOOK_SECRET:-}" ]; then
  PARAM_OVERRIDES+=("StripeWebhookSecret=${STRIPE_WEBHOOK_SECRET}")
fi

sam deploy \
    --profile $PROFILE \
    --stack-name color-code-research-hub \
    --capabilities CAPABILITY_IAM \
    --resolve-s3 \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset \
    --region us-east-1 \
    --parameter-overrides "${PARAM_OVERRIDES[@]}" 2>&1 | while IFS= read -r line; do
    echo "   DEPLOY: $line"
done

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "❌ SAM deploy failed!"
    exit 1
fi

DEPLOY_END=$(date +%s)
DEPLOY_DURATION=$((DEPLOY_END - DEPLOY_START))

echo "✅ Deployment completed successfully in ${DEPLOY_DURATION} seconds!"

# Get the API Gateway URL and other outputs
echo ""
echo "📊 Step 6: Retrieving stack outputs..."
echo "---------------------------------------"

STACK_INFO=$(aws cloudformation describe-stacks \
    --stack-name color-code-research-hub \
    --profile $PROFILE \
    --region us-east-1 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ Failed to retrieve stack information!"
    echo "Error: $STACK_INFO"
    exit 1
fi

# Extract outputs
API_URL=$(echo "$STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="ApiGatewayUrl") | .OutputValue')
REPORT_PROCESSING_ARN=$(echo "$STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="ReportProcessingFunctionArn") | .OutputValue')
RESEARCH_BUCKET=$(echo "$STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="ResearchBucketName") | .OutputValue')

echo "✅ Stack outputs retrieved successfully!"
echo ""
echo "==============================================="
echo "🎉 DEPLOYMENT SUMMARY"
echo "==============================================="
echo "⏱️  Total deployment time: $((BUILD_DURATION + DEPLOY_DURATION)) seconds"
echo "    - Build time: ${BUILD_DURATION}s"
echo "    - Deploy time: ${DEPLOY_DURATION}s"
echo ""
echo "🌐 API Gateway URL: $API_URL"
echo "📦 Research Bucket: $RESEARCH_BUCKET"
echo "⚡ Report Processor: ${REPORT_PROCESSING_ARN##*/}"
echo ""
echo "==============================================="
echo "📝 NEXT STEPS"
echo "==============================================="
echo ""
echo "1️⃣  Update your frontend .env.local file with:"
echo "    VITE_API_BASE_URL=$API_URL"
echo ""
echo "2️⃣  Verify the following secrets exist in Secrets Manager:"
echo "    ✓ github_token"
echo "    ✓ anthropic_key" 
echo "    ✓ openai_key"
echo "    ✓ perplexity-key"
echo ""
echo "3️⃣  To test the report processing integration:"
echo "    - Submit a research request through the frontend"
echo "    - Monitor CloudWatch Logs for the ResearchApiFunction"
echo "    - Check that ReportProcessingFunction is invoked"
echo "    - Verify processed summaries appear in DynamoDB"
echo ""
echo "4️⃣  To enable debug logging, run:"
echo "    DEBUG=true ./deploy.sh"
echo ""
echo "==============================================="
echo "✨ Deployment completed at $(date)"
echo "==============================================="

# Deploy V2 CDK stacks (Data + API) if CDK project is present
echo ""
if [ "${SKIP_CDK:-}" = "1" ] || [ "${SKIP_CDK:-}" = "true" ]; then
  echo "⏭️  Skipping CDK deployment per SKIP_CDK flag."
else
  echo "🏗️  Step 7: Deploying V2 CDK stacks (Data + API)..."
  echo "---------------------------------------"

CDK_DIR="$SCRIPT_DIR/cdk"
if [ -d "$CDK_DIR" ]; then
    echo "📁 Found CDK directory at: $CDK_DIR"
    pushd "$CDK_DIR" >/dev/null

    if [ ! -f package.json ]; then
        echo "ℹ️  No package.json in CDK directory. Skipping V2 CDK deployment."
        echo "   To enable, add a CDK project in $CDK_DIR (package.json, tsconfig)."
        popd >/dev/null
    else
        echo "📦 Installing CDK dependencies (if needed)..."
        npm install

        echo "🔧 Bootstrapping CDK environment (safe to run repeatedly)..."
        npx cdk -a 'npx ts-node bin/data-layer.ts' bootstrap aws://$ACCOUNT_ID/$AWS_REGION || true

        echo "🔐 Deploying AuthStack (Cognito)…"
        COGNITO_CALLBACK_URL_DEFAULT="https://www.truflr.ai/v2/auth/callback"
        COGNITO_LOGOUT_URL_DEFAULT="https://www.truflr.ai/"
        export COGNITO_CALLBACK_URL="${COGNITO_CALLBACK_URL:-$COGNITO_CALLBACK_URL_DEFAULT}"
        export COGNITO_LOGOUT_URL="${COGNITO_LOGOUT_URL:-$COGNITO_LOGOUT_URL_DEFAULT}"
        npx cdk -a 'npx ts-node bin/auth-layer.ts' deploy AuthStack --require-approval never

        echo "🔎 Reading AuthStack outputs..."
        AUTH_STACK_INFO=$(aws cloudformation describe-stacks \
            --stack-name AuthStack \
            --profile $PROFILE \
            --region $AWS_REGION 2>&1)

        if [ $? -ne 0 ]; then
            echo "❌ Failed to retrieve AuthStack information!"
            echo "Error: $AUTH_STACK_INFO"
            echo "ApiLayerStack will fall back to USER_POOL_ID if provided."
        else
            export USER_POOL_ID=$(echo "$AUTH_STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="UserPoolId") | .OutputValue')
            export USER_POOL_CLIENT_ID=$(echo "$AUTH_STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="UserPoolClientId") | .OutputValue')
            export COGNITO_HOSTED_UI_DOMAIN=$(echo "$AUTH_STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="HostedUIDomain") | .OutputValue')
            export COGNITO_CLIENT_ID="$USER_POOL_CLIENT_ID"
            echo "✅ AuthStack deployed"
            echo "   USER_POOL_ID=$USER_POOL_ID"
            echo "   USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID"
            echo "   COGNITO_HOSTED_UI_DOMAIN=$COGNITO_HOSTED_UI_DOMAIN"
        fi

        echo "🚀 Deploying DataLayerStack..."
        npx cdk -a 'npx ts-node bin/data-layer.ts' deploy DataLayerStack --require-approval never

        echo "🔎 Reading DataLayerStack outputs..."
        DATA_STACK_INFO=$(aws cloudformation describe-stacks \
            --stack-name DataLayerStack \
            --profile $PROFILE \
            --region $AWS_REGION 2>&1)

        if [ $? -ne 0 ]; then
            echo "❌ Failed to retrieve DataLayerStack information!"
            echo "Error: $DATA_STACK_INFO"
            echo "Skipping ApiLayerStack deployment."
            popd >/dev/null
        else
            export USERS_TABLE_NAME=$(echo "$DATA_STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="UsersTableName") | .OutputValue')
            export CREDIT_LEDGER_TABLE_NAME=$(echo "$DATA_STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="CreditLedgerTableName") | .OutputValue')
            export PROJECTS_TABLE_NAME=$(echo "$DATA_STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="ProjectsTableName") | .OutputValue')
            export REPORTS_TABLE_NAME=$(echo "$DATA_STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="ReportsTableName") | .OutputValue')
            export IDEATIONS_TABLE_NAME=$(echo "$DATA_STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="IdeationsTableName") | .OutputValue')
            export DOUBLES_TABLE_NAME=$(echo "$DATA_STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="DoubleDownsTableName") | .OutputValue')
            export ARTIFACTS_BUCKET_NAME=$(echo "$DATA_STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="ArtifactsBucketName") | .OutputValue')

            echo "✅ DataLayer outputs exported as env vars for ApiLayerStack"
            echo "   USERS_TABLE_NAME=$USERS_TABLE_NAME"
            echo "   CREDIT_LEDGER_TABLE_NAME=$CREDIT_LEDGER_TABLE_NAME"
            echo "   PROJECTS_TABLE_NAME=$PROJECTS_TABLE_NAME"
            echo "   REPORTS_TABLE_NAME=$REPORTS_TABLE_NAME"
            echo "   IDEATIONS_TABLE_NAME=$IDEATIONS_TABLE_NAME"
            echo "   DOUBLES_TABLE_NAME=$DOUBLES_TABLE_NAME"
            echo "   ARTIFACTS_BUCKET_NAME=$ARTIFACTS_BUCKET_NAME"

            if [ -z "${USER_POOL_ID:-}" ]; then
                echo "⚠️  USER_POOL_ID is not set. ApiLayerStack requires a Cognito User Pool ID."
                echo "    Set USER_POOL_ID in your environment and rerun to deploy ApiLayerStack."
            else
        echo "🚀 Deploying ApiLayerStack..."
        # Provide Stripe API key secret ARN default if not set
        export STRIPE_API_KEY_SECRET_ARN="${STRIPE_API_KEY_SECRET_ARN:-arn:aws:secretsmanager:us-east-1:984906149037:secret:stripe_api_key-pmgNww}"
        npx cdk -a 'npx ts-node bin/api-layer.ts' deploy ApiLayerStack --require-approval never
        echo "✅ ApiLayerStack deployed"
            fi
            popd >/dev/null
        fi
    fi
else
    echo "ℹ️  No CDK directory found. Skipping V2 CDK deployment."
fi
fi
