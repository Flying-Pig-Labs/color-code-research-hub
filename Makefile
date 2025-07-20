# Makefile for Color Code Research Hub

# Default target
.DEFAULT_GOAL := help

# Help command
help:
	@echo "Available commands:"
	@echo "  make start    - Start frontend, backend, and open browser"
	@echo "  make test     - Run e2e tests"
	@echo "  make stop     - Stop all servers"
	@echo "  make install  - Install dependencies"

# Start both servers and open browser
start:
	@echo "🚀 Starting Color Code Research Hub..."
	@echo "🔍 Checking for processes on ports 3000 and 3001..."
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	@echo "✅ Ports cleared"
	@echo "📦 Starting backend API on port 3001..."
	@cd backend && npm start & echo $$! > ../.backend.pid
	@sleep 3
	@echo "🎨 Starting frontend on port 3000..."
	@npm start & echo $$! > .frontend.pid
	@sleep 5
	@echo "🌐 Opening browser..."
	@open http://localhost:3000 || xdg-open http://localhost:3000 || start http://localhost:3000
	@echo "✅ Application is running!"
	@echo ""
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:3001"
	@echo ""
	@echo "Press Ctrl+C to stop all servers"
	@trap 'make stop' INT; wait

# Stop all servers
stop:
	@echo "🛑 Stopping servers..."
	@if [ -f .frontend.pid ]; then kill `cat .frontend.pid` 2>/dev/null || true; rm .frontend.pid; fi
	@if [ -f .backend.pid ]; then kill `cat .backend.pid` 2>/dev/null || true; rm .backend.pid; fi
	@pkill -f "node server-endpoint.js" 2>/dev/null || true
	@pkill -f "node backend/server.js" 2>/dev/null || true
	@pkill -f "vite" 2>/dev/null || true
	@echo "✅ All servers stopped"

# Run tests
test:
	@echo "🧪 Running e2e tests..."
	@npx playwright test

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@npm install
	@cd backend && npm install
	@npx playwright install
	@echo "✅ Dependencies installed"

.PHONY: help start stop test install