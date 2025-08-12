#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Build configuration - local only
const buildConfig = {
  mode: 'production',
  sourcemap: false,
  minify: true,
};

async function build() {
  const config = buildConfig;
  
  console.log(`
🏗️  Building Color Code Research Hub
📦 Mode: production (local)
🔧 Configuration:`, config);

  // Build command arguments
  const args = ['vite', 'build'];
  
  // Always production mode for local builds
  
  if (config.sourcemap) {
    args.push('--sourcemap');
  }
  
  if (!config.minify) {
    args.push('--minify', 'false');
  }

  // Run build
  const buildProcess = spawn('npx', args, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: config.mode,
      FORCE_COLOR: '1',
    }
  });

  buildProcess.on('error', (error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });

  buildProcess.on('exit', (code) => {
    if (code === 0) {
      console.log(`
✅ Build completed successfully!
📁 Output: ./dist
🚀 Ready for deployment
      `);
      
      // Show build size
      try {
        const distPath = join(process.cwd(), 'dist');
        if (existsSync(distPath)) {
          const { execSync } = await import('child_process');
          const size = execSync(`du -sh ${distPath} | cut -f1`).toString().trim();
          console.log(`📏 Build size: ${size}`);
        }
      } catch (e) {
        // Ignore size calculation errors
      }
    } else {
      console.error(`❌ Build failed with code ${code}`);
      process.exit(code || 1);
    }
  });
}

// Run build
build().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});