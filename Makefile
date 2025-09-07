# Makefile for Color Code Research Hub

# Default target
.DEFAULT_GOAL := help

# Help command
help:
	@echo "Available commands:"
	@echo "  make all      - Install dependencies, start servers, and open browser"
	@echo "  make start    - Start frontend and open browser"
	@echo "  make web      - Start only the web server"
	@echo "  make test     - Run unit tests (vitest)"
	@echo "  make lambda-build-prompts - Copy prompts for Lambda build"
	@echo "  make lambda              - Deploy SAM stack (and CDK unless skipped)"
	@echo "  make lambda-sam          - Deploy only SAM (skip CDK)"
	@echo "  make lambda-nocache      - SAM build without cache (slower, safer)"
	@echo "  make lambda-validate     - Validate SAM template only"
	@echo "  make auth:brand:apply    - Apply Cognito Hosted UI branding (CSS+logo)"
	@echo "  make auth:brand:status   - Show branding + domain config"
	@echo "  make auth:brand:rollback - Remove branding (revert to default)"
	@echo "  make auth:managed:apply  - Apply Managed Login branding (colors, mode, font)"
	@echo "  make auth:managed:status - Show Managed Login branding settings"
	@echo "  make auth:managed:reset  - Reset Managed Login branding to defaults"
	@echo "  make auth:managed:check  - Best-effort drift check (non-failing by default)"
	@echo "  make stop     - Stop all servers"
	@echo "  make clean    - Kill all related processes"
	@echo "  make install  - Install dependencies"

# All-in-one command: install and start
all: install start

# Start both servers and open browser
start:
	@echo "🚀 Starting Color Code Research Hub..."
	@echo "🔍 Checking for processes on port 3000..."
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@echo "✅ Ports cleared"
	@echo "🎨 Starting frontend on port 3000..."
	@npm start & echo $$! > .frontend.pid
	@sleep 5
	@echo "🌐 Opening browser..."
	@open http://localhost:3000 || xdg-open http://localhost:3000 || start http://localhost:3000
	@echo "✅ Application is running!"
	@echo ""
	@echo "Frontend: http://localhost:3000"
	@echo ""
	@echo "Press Ctrl+C to stop all servers"
	@trap 'make stop' INT; wait

# Start only web server
web:
	@echo "🎨 Starting frontend on port 3000..."
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@npm start

# Stop all servers
stop:
	@echo "🛑 Stopping servers..."
	@if [ -f .frontend.pid ]; then kill `cat .frontend.pid` 2>/dev/null || true; rm .frontend.pid; fi
	@pkill -f "vite" 2>/dev/null || true
	@echo "✅ All servers stopped"

# Clean - Kill all related processes
clean:
	@echo "🧹 Cleaning up all related processes..."
	@echo "🔍 Killing processes on port 3000..."
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@echo "🔍 Killing Node.js processes..."
	@pkill -f "node scripts/start.js" 2>/dev/null || true
	@pkill -f "vite" 2>/dev/null || true
	@pkill -f "npm start" 2>/dev/null || true
	@pkill -f "npm run" 2>/dev/null || true
	@echo "🔍 Removing PID files..."
	@rm -f .frontend.pid 2>/dev/null || true
	@echo "✅ All processes cleaned up"

# Run unit tests
test:
	@echo "🧪 Running unit tests..."
	@npm test


# Build-only: copy backend prompts into handlers for SAM packaging
lambda-build-prompts:
	@echo "📤 Copying prompts into handlers for build..."
	@cd backend/infrastructure && ./copy-prompts-for-build.sh

# Deploy Lambda functions
lambda:
	@echo "🚀 Deploying Lambda functions to AWS..."
	@cd backend/infrastructure && ./deploy.sh

lambda-sam:
	@echo "🚀 Deploying SAM only (skipping CDK)..."
	@cd backend/infrastructure && SKIP_CDK=1 ./deploy.sh

lambda-nocache:
	@echo "🚀 Deploying with SAM --no-cached (full rebuild)..."
	@cd backend/infrastructure && NO_CACHE=1 ./deploy.sh

lambda-validate:
	@echo "🧪 Validating SAM template..."
	@cd backend/infrastructure && sam validate

# ===== Cognito Hosted UI Branding =====
# Required env: COGNITO_USER_POOL_ID, optional COGNITO_APP_CLIENT_ID
# Optional assets: infrastructure/cognito/hosted-ui.css, public/logo-dark.png
auth:brand:apply:
	@test -n "$$COGNITO_USER_POOL_ID" || (echo "Missing COGNITO_USER_POOL_ID" && exit 1)
	@echo "🎨 Applying Hosted UI CSS..."
	@if [ -f infrastructure/cognito/hosted-ui.css ]; then \
		aws cognito-idp set-ui-customization \
			--user-pool-id $$COGNITO_USER_POOL_ID \
			$${COGNITO_APP_CLIENT_ID:+--client-id $$COGNITO_APP_CLIENT_ID} \
			--css fileb://infrastructure/cognito/hosted-ui.css >/dev/null; \
		else echo "(skip) No hosted-ui.css found"; fi
	@if [ -f public/logo-dark.png ]; then \
		echo "🖼️  Uploading logo..."; \
		aws cognito-idp set-ui-customization \
			--user-pool-id $$COGNITO_USER_POOL_ID \
			$${COGNITO_APP_CLIENT_ID:+--client-id $$COGNITO_APP_CLIENT_ID} \
			--image-file fileb://public/logo-dark.png >/dev/null; \
		else echo "(skip) No public/logo-dark.png found"; fi
	@echo "✅ Branding applied"

auth:brand:status:
	@test -n "$$COGNITO_USER_POOL_ID" || (echo "Missing COGNITO_USER_POOL_ID" && exit 1)
	@echo "🔎 Hosted UI Branding Status:"
	@aws cognito-idp get-ui-customization --user-pool-id $$COGNITO_USER_POOL_ID $${COGNITO_APP_CLIENT_ID:+--client-id $$COGNITO_APP_CLIENT_ID} | sed 's/"Css":.*/"Css":"<inline css omitted>",/'
	@echo "\n🔎 Domain config:"
	@aws cognito-idp describe-user-pool --user-pool-id $$COGNITO_USER_POOL_ID --query 'UserPool.Domain' --output text || true

auth:brand:rollback:
	@test -n "$$COGNITO_USER_POOL_ID" || (echo "Missing COGNITO_USER_POOL_ID" && exit 1)
	@echo "↩️  Rolling back branding to defaults..."
	@aws cognito-idp set-ui-customization --user-pool-id $$COGNITO_USER_POOL_ID $${COGNITO_APP_CLIENT_ID:+--client-id $$COGNITO_APP_CLIENT_ID} --css '' >/dev/null || true
	@aws cognito-idp set-ui-customization --user-pool-id $$COGNITO_USER_POOL_ID $${COGNITO_APP_CLIENT_ID:+--client-id $$COGNITO_APP_CLIENT_ID} --image-file fileb:///dev/null >/dev/null || true
	@echo "✅ Branding reset to defaults"

# ===== Cognito Managed Login Branding =====
# Uses AWS CLI Managed Login branding APIs (if available in your CLI version).
# Env: COGNITO_USER_POOL_ID (required), COGNITO_APP_CLIENT_ID (optional, defaults ALL)
# Settings file: brand/managed-login/settings.json
auth:managed:apply:
	@test -n "$$COGNITO_USER_POOL_ID" || (echo "Missing COGNITO_USER_POOL_ID" && exit 1)
	@SETTINGS_PATH=brand/managed-login/settings.json COGNITO_APP_CLIENT_ID=$${COGNITO_APP_CLIENT_ID:-ALL} \
		bash scripts/branding/managed-login.sh apply

auth:managed:status:
	@test -n "$$COGNITO_USER_POOL_ID" || (echo "Missing COGNITO_USER_POOL_ID" && exit 1)
	@COGNITO_APP_CLIENT_ID=$${COGNITO_APP_CLIENT_ID:-ALL} bash scripts/branding/managed-login.sh status

auth:managed:reset:
	@test -n "$$COGNITO_USER_POOL_ID" || (echo "Missing COGNITO_USER_POOL_ID" && exit 1)
	@COGNITO_APP_CLIENT_ID=$${COGNITO_APP_CLIENT_ID:-ALL} bash scripts/branding/managed-login.sh reset

auth:managed:check:
	@test -n "$$COGNITO_USER_POOL_ID" || (echo "Missing COGNITO_USER_POOL_ID" && exit 1)
	@COGNITO_APP_CLIENT_ID=$${COGNITO_APP_CLIENT_ID:-} bash scripts/branding/check.sh

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@npm install
	@cd backend && npm install
	@echo "✅ Dependencies installed"

.PHONY: help all start api web stop clean test e2e lambda install
