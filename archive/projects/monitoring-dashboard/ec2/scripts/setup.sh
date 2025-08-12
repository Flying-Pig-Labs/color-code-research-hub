#!/bin/bash

# Claude Flow Monitoring Dashboard Setup Script

set -e

echo "🚀 Setting up Claude Flow Monitoring Dashboard..."

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed. Please install npm."
        exit 1
    fi
    
    echo "✅ Prerequisites satisfied"
}

# Create directories
create_directories() {
    echo "📁 Creating necessary directories..."
    mkdir -p data/db
    mkdir -p logs
    mkdir -p uploads
    mkdir -p config/ssl
    echo "✅ Directories created"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    npm install
    cd frontend && npm install && cd ..
    echo "✅ Dependencies installed"
}

# Setup environment
setup_environment() {
    echo "🔧 Setting up environment..."
    if [ ! -f .env ]; then
        cp config/.env.example .env
        echo "⚠️  Please edit .env file with your configuration"
    fi
    echo "✅ Environment setup complete"
}

# Initialize database
init_database() {
    echo "🗄️  Initializing database..."
    npm run db:init
    npm run db:migrate
    echo "✅ Database initialized"
}

# Build frontend
build_frontend() {
    echo "🎨 Building frontend..."
    cd frontend && npm run build && cd ..
    echo "✅ Frontend built"
}

# Generate API key
generate_api_key() {
    echo "🔐 Generating API key..."
    API_KEY=$(openssl rand -hex 32)
    echo "Your API key: $API_KEY"
    echo "Please add this to your .env file as API_KEY=$API_KEY"
}

# Main execution
main() {
    check_prerequisites
    create_directories
    install_dependencies
    setup_environment
    init_database
    build_frontend
    generate_api_key
    
    echo ""
    echo "✨ Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env file with your configuration"
    echo "2. Run 'npm start' to start the monitoring service"
    echo "3. Access dashboard at http://localhost:3001"
    echo ""
}

main "$@"