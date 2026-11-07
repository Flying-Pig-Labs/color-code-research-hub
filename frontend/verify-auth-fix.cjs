#!/usr/bin/env node
/**
 * Manual verification script for authentication redirect loop fixes.
 * Run this script to validate the hardened authentication implementation.
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Auth Redirect Loop Fix Verification\n');

// Check that all required files exist
const requiredFiles = [
  'src/lib/authStateManager.ts',
  'src/hooks/useAuthGate.ts',
  '.env.example'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

// Check that key files have been updated
const updatedFiles = [
  'src/services/v2/api.ts',
  'src/components/ProtectedRoute.tsx',
  'src/components/ResearchReportHistory.tsx',
  'src/pages/v2/Projects.tsx'
];

console.log('\nChecking updated files:');
updatedFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (file.includes('api.ts')) {
      const hasAuthManager = content.includes('authStateManager');
      const hasAbortController = content.includes('abortController');
      console.log(`${hasAuthManager && hasAbortController ? '✅' : '❌'} ${file} ${hasAuthManager && hasAbortController ? 'updated with centralized auth' : 'missing auth manager'}`);
    } else if (file.includes('ProtectedRoute.tsx')) {
      const hasAuthGate = content.includes('useAuthGate');
      console.log(`${hasAuthGate ? '✅' : '❌'} ${file} ${hasAuthGate ? 'updated with auth gate' : 'missing auth gate'}`);
    } else {
      const hasAuthGate = content.includes('useAuthGate');
      console.log(`${hasAuthGate ? '✅' : '❌'} ${file} ${hasAuthGate ? 'updated with auth gate' : 'missing auth gate'}`);
    }
  } else {
    console.log(`❌ ${file} not found`);
    allFilesExist = false;
  }
});

console.log('\n📋 Manual Testing Checklist:\n');

console.log('1. Test Safe Mode:');
console.log('   - Set VITE_AUTH_SAFE_MODE=true in .env');
console.log('   - Clear tokens: sessionStorage.clear()');
console.log('   - Visit /v2/projects');
console.log('   - Expected: Banner shows "Click here to login", no redirect');
console.log('');

console.log('2. Test Normal Mode (Single Redirect):');
console.log('   - Set VITE_AUTH_SAFE_MODE=false in .env');
console.log('   - Clear tokens: sessionStorage.clear()');
console.log('   - Visit /v2/projects');
console.log('   - Expected: ONE redirect to /v2/auth, no loop');
console.log('');

console.log('3. Test Multiple Tab Scenario:');
console.log('   - Clear tokens: sessionStorage.clear()');
console.log('   - Open /v2/projects in two tabs simultaneously');
console.log('   - Expected: Each tab redirects once, no oscillation');
console.log('');

console.log('4. Test Auth Recovery:');
console.log('   - Login normally');
console.log('   - Visit /v2/projects (should load normally)');
console.log('   - Clear id_token: sessionStorage.removeItem("id_token")');
console.log('   - Refresh page');
console.log('   - Expected: Single redirect to auth, no loop');
console.log('');

console.log('5. Debug Commands:');
console.log('   - Check redirect counters: window.authStateManager.getCounters()');
console.log('   - Expected: redirectExecuted ≤ 1 per page load');
console.log('');

if (allFilesExist) {
  console.log('✅ All files present. Ready for testing!\n');
  
  console.log('🚀 Deployment Steps:');
  console.log('1. npm run build');
  console.log('2. npm run typecheck');
  console.log('3. npm run lint'); 
  console.log('4. Deploy to staging environment');
  console.log('5. Run manual tests above');
  console.log('6. Deploy to production');
  
  process.exit(0);
} else {
  console.log('❌ Missing required files. Implementation incomplete.\n');
  process.exit(1);
}