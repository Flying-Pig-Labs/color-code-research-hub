# Testing Guide for Color Code Research Hub

This guide covers the comprehensive testing infrastructure for the application, including unit tests, integration tests, and end-to-end tests.

## 📋 Table of Contents

1. [Testing Stack](#testing-stack)
2. [Running Tests](#running-tests)
3. [Unit Tests](#unit-tests)
4. [E2E Tests](#e2e-tests)
5. [Dynamic Port Allocation](#dynamic-port-allocation)
6. [Build & Launch Scripts](#build--launch-scripts)
7. [CI/CD Integration](#cicd-integration)
8. [Troubleshooting](#troubleshooting)

## 🧪 Testing Stack

- **Unit Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright
- **Coverage**: Vitest Coverage with Istanbul
- **Mocking**: Built-in Vitest mocks

## 🚀 Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test src/services/__tests__/api.test.ts
```

### E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific E2E test
npx playwright test e2e/app.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium
```

## 🧩 Unit Tests

### Test Coverage

The following components and modules have comprehensive unit tests:

#### API Service (`src/services/__tests__/api.test.ts`)
- ✅ Health check endpoint
- ✅ Team listing and field retrieval
- ✅ Research submission with proper headers
- ✅ Job status polling with exponential backoff
- ✅ Error handling (network, CORS, timeout, auth)
- ✅ Environment detection

#### API Edge Cases (`src/services/__tests__/api.edge-cases.test.ts`)
- ✅ Malformed JSON responses
- ✅ Concurrent request handling
- ✅ Large payload handling
- ✅ Special HTTP status codes (204, 302, 429)
- ✅ Memory leak prevention
- ✅ Environment variable edge cases

#### Components
- **HealthCheck** (`src/components/__tests__/HealthCheck.test.tsx`)
  - Connection status indicators
  - Auto-refresh functionality
  - Error state handling
  
- **ResearchSwarmForm** (`src/components/__tests__/ResearchSwarmForm.test.tsx`)
  - Form rendering and validation
  - API submission flow
  - Loading states
  - Error handling
  - LocalStorage fallback

- **useApiEnvironment** (`src/hooks/__tests__/useApiEnvironment.test.ts`)
  - Environment detection
  - Health status monitoring
  - State management

### Writing Unit Tests

Example unit test structure:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<Component />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

## 🎭 E2E Tests

### Test Scenarios

The E2E test suite (`e2e/app.spec.ts`) covers:

#### Core Functionality
- ✅ Page loading and navigation
- ✅ Health check indicator visibility
- ✅ Team page navigation
- ✅ Form submission workflows
- ✅ Research request table display

#### User Experience
- ✅ Responsive design on mobile
- ✅ API error handling
- ✅ 404 page handling
- ✅ Performance (< 3s load time)

#### Accessibility
- ✅ Heading hierarchy
- ✅ Alt text for images
- ✅ Keyboard navigation

### E2E Test Configuration

Playwright is configured to:
- Test on multiple browsers (Chromium, Firefox, WebKit)
- Test mobile viewports
- Take screenshots on failure
- Use dynamic port allocation
- Automatically start the dev server

## 🔌 Dynamic Port Allocation

The application now uses dynamic port allocation to avoid port conflicts:

### How It Works

1. **Environment Variables** (highest priority)
   ```bash
   VITE_PORT=3001 npm start
   PORT=3001 npm start
   ```

2. **Automatic Detection**
   - Checks if preferred port (3000) is available
   - Finds next available port if occupied
   - Uses `detect-port` package for reliability

3. **Configuration**
   ```javascript
   // scripts/start.js
   const preferredPort = process.env.VITE_PORT || process.env.PORT || 3000;
   const availablePort = await detectPort(preferredPort);
   ```

### Benefits
- No more "port already in use" errors
- Multiple instances can run simultaneously
- CI/CD friendly
- Development flexibility

## 🏗️ Build & Launch Scripts

### Build Script (`scripts/build.js`)

```bash
# Production build (default)
npm run build

# Development build (with sourcemaps)
npm run build -- --dev

# EC2-specific build
npm run build -- --ec2
```

Features:
- Environment-specific configurations
- Build size reporting
- Source map control
- Minification options

### Launch Script (`scripts/launch.js`)

```bash
# Launch in production mode
npm run launch

# Launch in development mode
npm run launch:dev

# Show help
npm run launch -- --help
```

Features:
- Combined build + serve
- Automatic port allocation
- Environment detection
- Preview server integration

### Start Script (`scripts/start.js`)

```bash
# Start development server
npm start

# Start with specific port
VITE_PORT=3001 npm start
```

Features:
- Dynamic port allocation
- Clear console output
- API endpoint display
- Network address display

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Test and Build

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run unit tests
      run: npm test -- --coverage
      
    - name: Install Playwright
      run: npx playwright install --with-deps
      
    - name: Run E2E tests
      run: npm run test:e2e
      
    - name: Build application
      run: npm run build
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

### Docker Example

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "launch"]
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
- The app now automatically finds an available port
- Check console output for actual port being used
- Use `VITE_PORT` to force a specific port

#### E2E Tests Failing
1. Ensure Playwright browsers are installed:
   ```bash
   npx playwright install
   ```

2. Check if dev server started correctly:
   ```bash
   npm start
   # In another terminal
   npm run test:e2e
   ```

3. Run in headed mode to see what's happening:
   ```bash
   npx playwright test --headed
   ```

#### Unit Tests Failing
1. Clear test cache:
   ```bash
   npm test -- --clearCache
   ```

2. Check for missing mocks:
   ```typescript
   vi.mock('@/services/api');
   ```

3. Ensure test environment setup:
   ```typescript
   // vitest.config.ts
   environment: 'jsdom'
   ```

### Debugging Tips

1. **Playwright Inspector**
   ```bash
   PWDEBUG=1 npx playwright test
   ```

2. **Vitest UI**
   ```bash
   npm test -- --ui
   ```

3. **Coverage Report**
   ```bash
   npm run test:coverage
   # Open coverage/index.html
   ```

4. **Console Logs in Tests**
   ```typescript
   // Vitest
   console.log(wrapper.debug());
   
   // Playwright
   await page.evaluate(() => console.log(document.body.innerHTML));
   ```

## 📊 Test Metrics

### Coverage Goals
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

### Performance Benchmarks
- Unit tests: < 10 seconds
- E2E tests: < 2 minutes
- Page load: < 3 seconds
- API response: < 500ms (local)

## 🔗 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

Remember: Good tests are the foundation of reliable software. Write tests that give you confidence to ship! 🚀