#!/usr/bin/env node

import detect from 'detect-port';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_PORT = 3000;

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

async function startServer() {
  // Get preferred port from environment or use default
  const preferredPort = parseInt(process.env.VITE_PORT || process.env.PORT || DEFAULT_PORT);
  
  // Find available port
  const port = await findAvailablePort(preferredPort);
  
  // Set environment variable for Vite
  process.env.VITE_PORT = port.toString();
  
  // Build command arguments
  const args = ['vite', '--host', '::', '--port', port.toString()];
  
  // Get the base URL for display
  const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:3001';
  
  console.log(`
🚀 Starting Color Code Research Hub
📍 Local: http://localhost:${port}
📍 Network: http://[::]:${port}
🔗 API: ${apiBaseUrl}
  `);
  
  // Spawn Vite process
  const viteProcess = spawn('npx', args, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      FORCE_COLOR: '1',
    }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    viteProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    viteProcess.kill('SIGTERM');
    process.exit(0);
  });

  viteProcess.on('error', (error) => {
    console.error('Failed to start Vite:', error);
    process.exit(1);
  });

  viteProcess.on('exit', (code) => {
    if (code !== null) {
      process.exit(code);
    }
  });
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});