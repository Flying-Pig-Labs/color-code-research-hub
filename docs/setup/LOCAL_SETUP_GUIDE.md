# Color Code Research Hub - Local Setup Guide

This is a comprehensive guide for setting up and running the Color Code Research Hub application locally. This application has been configured to run entirely on your local machine without any external dependencies.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Installation](#installation)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Architecture](#architecture)
8. [API Documentation](#api-documentation)
9. [Troubleshooting](#troubleshooting)
10. [Development Workflow](#development-workflow)

## Overview

The Color Code Research Hub is a web application that provides three specialized research teams (Red, Black, and White) for strategic intelligence gathering. The application consists of:

- **Frontend**: React + TypeScript + Vite application
- **Backend**: Express.js API server
- **UI Components**: shadcn/ui component library
- **Styling**: Tailwind CSS

## Prerequisites

Before setting up the application, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)

## Project Structure

```
color-code-research-hub/
├── backend/                 # Backend API server
│   ├── server.js           # Express server implementation
│   └── package.json        # Backend dependencies
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service layer
│   ├── pages/             # Route pages
│   └── main.tsx           # Application entry point
├── e2e/                    # End-to-end tests
├── scripts/               # Build and start scripts
│   ├── start.js          # Development server script
│   └── build.js          # Build script
├── .env.local             # Local environment configuration
├── package.json           # Frontend dependencies
├── vite.config.ts         # Vite configuration
├── playwright.config.ts   # E2E test configuration
└── vitest.config.ts       # Unit test configuration
```

## Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd color-code-research-hub
```

### Step 2: Install Dependencies

Install all dependencies:

```bash
# Install all dependencies (frontend and backend)
make install
```

This command will install dependencies for both the frontend and backend automatically.

### Step 3: Environment Configuration

The application comes with a pre-configured `.env.local` file. If it doesn't exist, create it:

```bash
# Create .env.local file
cat > .env.local << EOF
# Local development configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_API_KEY=local-dev-key
VITE_PORT=3000
VITE_ENABLE_HEALTH_CHECK=true
VITE_API_TIMEOUT=300000
VITE_POLL_INTERVAL=2000
EOF
```

## Running the Application

### Primary Method (Recommended)

```bash
make start
```

This command will:
- Kill any processes on ports 3000 and 3001 (prevents port conflicts)
- Start the backend API server on port 3001
- Start the frontend development server on port 3000
- Open your browser automatically to http://localhost:3000

To stop all servers, press `Ctrl+C`.

### Alternative Methods

In separate terminal windows:

**Terminal 1 - Backend:**
```bash
npm run start:backend
```

**Terminal 2 - Frontend:**
```bash
npm start
```

### Accessing the Application

Once both servers are running:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Testing

### Unit Tests

Run unit tests with Vitest:

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### End-to-End Tests

Run E2E tests with Playwright:

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Linting

Check code quality:

```bash
npm run lint
```

## Architecture

### Frontend Architecture

The frontend is built with:
- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **React Hook Form**: Form management
- **Tanstack Query**: Server state management
- **shadcn/ui**: Component library
- **Tailwind CSS**: Styling

Key features:
- Type-safe API client (`src/services/api.ts`)
- Custom hooks for API interactions
- Responsive design for all screen sizes
- Health check monitoring
- Local storage for draft management

### Backend Architecture

The backend provides:
- RESTful API endpoints
- In-memory job storage (for development)
- Mock research processing
- CORS support for local development

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/teams` | Get available team types |
| GET | `/teams/:teamType/fields` | Get form fields for a team |
| POST | `/research/submit` | Submit a research request |
| GET | `/research/status/:jobId` | Check job status |
| GET | `/research/results/:jobId` | Get research results |

## API Documentation

### Health Check
```bash
GET http://localhost:3001/health

Response:
{
  "status": "healthy",
  "environment": "production"
}
```

### Get Teams
```bash
GET http://localhost:3001/teams
Headers:
  X-API-Key: local-dev-key

Response:
["red", "black", "white"]
```

### Get Team Fields
```bash
GET http://localhost:3001/teams/red/fields
Headers:
  X-API-Key: local-dev-key

Response:
[
  {
    "name": "objective",
    "label": "Red Team Objective",
    "type": "textarea",
    "required": true
  },
  // ... more fields
]
```

### Submit Research
```bash
POST http://localhost:3001/research/submit
Headers:
  Content-Type: application/json
  X-API-Key: local-dev-key

Body:
{
  "teamType": "red",
  "fields": {
    "objective": "Test security measures",
    "scope": "Web application"
  }
}

Response:
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Check Job Status
```bash
GET http://localhost:3001/research/status/123e4567-e89b-12d3-a456-426614174000
Headers:
  X-API-Key: local-dev-key

Response:
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "completedAt": "2024-01-01T00:00:05.000Z"
}
```

### Get Results
```bash
GET http://localhost:3001/research/results/123e4567-e89b-12d3-a456-426614174000
Headers:
  X-API-Key: local-dev-key

Response:
{
  "summary": "Analysis completed for red team request",
  "vulnerabilities": [...],
  "recommendations": [...]
}
```

## Troubleshooting

### Common Issues and Solutions

#### Port Already in Use

If you see "EADDRINUSE" errors:

```bash
# Kill processes on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill processes on port 3001 (backend)
lsof -ti:3001 | xargs kill -9
```

#### Backend Connection Failed

If the health check shows "Backend connection failed":

1. Ensure the backend is running on port 3001
2. Check the console for any backend errors
3. Verify `.env.local` has correct `VITE_API_BASE_URL`

#### Tests Failing

If tests are failing:

1. Ensure both frontend and backend are running
2. Check that environment variables are loaded correctly
3. Clear test cache: `rm -rf node_modules/.cache`

#### Build Errors

If build fails:

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Check for TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```

## Development Workflow

### Building for Production

```bash
# Build the frontend
npm run build

# The built files will be in the 'dist' directory
```

### Code Organization

- **Components**: Place reusable components in `src/components/`
- **Pages**: Route-specific components in `src/pages/`
- **Hooks**: Custom hooks in `src/hooks/`
- **Services**: API and external services in `src/services/`
- **Types**: TypeScript types in respective component files or `src/types/`

### Best Practices

1. **Type Safety**: Always use TypeScript types
2. **Component Structure**: Use functional components with hooks
3. **State Management**: Use React Query for server state
4. **Forms**: Use React Hook Form with Zod validation
5. **Styling**: Use Tailwind CSS classes
6. **Testing**: Write tests for critical functionality

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name
```

## Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Express.js Documentation](https://expressjs.com)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review error messages in browser console
3. Check backend logs in terminal
4. Create an issue in the repository

---

This application is configured for local development only. All API endpoints use mock data and in-memory storage suitable for development and testing purposes.