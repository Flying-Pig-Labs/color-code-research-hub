#!/usr/bin/env node

import { spawn } from 'child_process';
import detect from 'detect-port';
import { existsSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);

// Configuration
const DEFAULT_PORT = 3000;
const isProduction = args.includes('--production') || process.env.NODE_ENV === 'production';
const shouldBuild = args.includes('--build') || isProduction;

async function findAvailablePort(preferredPort) {
  try {
    const port = await detect(preferredPort);
    if (port === preferredPort) {
      console.log(`✅ Using port ${port}`);
    } else {
      console.log(`⚠️  Port ${preferredPort} is in use, using port ${port} instead`);
    }
    return port;
  } catch (error) {
    console.error('Error detecting port:', error);
    return preferredPort;
  }
}

async function buildProject() {
  console.log('🏗️  Building project...');
  
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      shell: true,
    });

    buildProcess.on('error', reject);
    buildProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });
  });
}

async function serveProject(port) {
  const distPath = join(process.cwd(), 'dist');
  
  if (isProduction && !existsSync(distPath)) {
    throw new Error('No dist folder found. Please build the project first.');
  }

  if (isProduction) {
    // Serve production build
    console.log('🚀 Serving production build...');
    
    const serveProcess = spawn('npx', ['vite', 'preview', '--port', port.toString(), '--host'], {
      stdio: 'inherit',
      shell: true,
    });

    return serveProcess;
  } else {
    // Start development server
    console.log('🚀 Starting development server...');
    
    process.env.VITE_PORT = port.toString();
    
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        VITE_PORT: port.toString(),
      }
    });

    return devProcess;
  }
}

async function launch() {
  try {
    // Get preferred port
    const preferredPort = parseInt(
      process.env.VITE_PORT || 
      process.env.PORT || 
      DEFAULT_PORT
    );
    
    // Find available port
    const port = await findAvailablePort(preferredPort);
    
    // Build if needed
    if (shouldBuild) {
      await buildProject();
    }
    
    // Get API URL
    const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:3001';
    
    console.log(`
🚀 Color Code Research Hub
📍 Local: http://localhost:${port}
📍 Network: http://[::]:${port}
🔗 API: ${apiBaseUrl}
🏗️  Mode: ${isProduction ? 'Production' : 'Development'}
    `);
    
    // Start server
    const serverProcess = await serveProject(port);
    
    // Handle process termination
    process.on('SIGINT', () => {
      serverProcess.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });

    serverProcess.on('exit', (code) => {
      if (code !== null) {
        process.exit(code);
      }
    });
    
  } catch (error) {
    console.error('❌ Launch failed:', error);
    process.exit(1);
  }
}

// Display help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Color Code Research Hub Launch Script

Usage: node scripts/launch.js [options]

Options:
  --production    Run in production mode (serves built files)
  --build         Build the project before starting
  --help, -h      Show this help message

Environment Variables:
  VITE_PORT       Preferred port (default: 3000)
  PORT            Alternative port variable
  NODE_ENV        Set to 'production' for production mode
  VITE_API_BASE_URL   API server URL (default: http://localhost:3001)

Examples:
  node scripts/launch.js                    # Start development server
  node scripts/launch.js --production       # Serve production build
  node scripts/launch.js --build            # Build and start dev server
  VITE_PORT=8080 node scripts/launch.js     # Use specific port
  `);
  process.exit(0);
}

// Start the launch process
launch();