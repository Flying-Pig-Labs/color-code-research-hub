#!/usr/bin/env node

import { spawn } from 'child_process';

const args = process.argv.slice(2);

// Determine test command
let testCommand = 'vitest';
let testArgs = [];

if (args.includes('--coverage')) {
  testArgs.push('--coverage');
}

if (args.includes('--ui')) {
  testArgs.push('--ui');
}

if (args.includes('--run')) {
  testArgs.push('--run');
}

console.log(`
🧪 Running tests...
📊 Command: ${testCommand} ${testArgs.join(' ')}
`);

const testProcess = spawn('npx', [testCommand, ...testArgs], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'test',
    FORCE_COLOR: '1',
  }
});

testProcess.on('error', (error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

testProcess.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.error(`\n❌ Tests failed with code ${code}`);
  }
  process.exit(code || 0);
});