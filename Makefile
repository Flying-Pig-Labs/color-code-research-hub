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
	@echo "  make lambda   - Deploy Lambda functions to AWS"
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

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@npm install
	@cd backend && npm install
	@echo "✅ Dependencies installed"

.PHONY: help all start api web stop clean test e2e lambda install