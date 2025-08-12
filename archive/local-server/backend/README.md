# Backend (Local Dev API)

Lightweight Express server for local development and demos. It provides mock research submission, simple job status/results, and an SQS handoff that mirrors the production serverless flow.

## Endpoints

- GET `/health`: Health check
- GET `/teams`: Available research teams
- GET `/teams/:teamType/fields`: Dynamic form fields for a team
- POST `/research/submit`: Create an in-memory research job and simulate completion
- GET `/research/status/:jobId`: Check job status
- GET `/research/results/:jobId`: Retrieve completed job results
- POST `/api/sqs/submit`: Submit a research request to SQS (aligns with production payload schema)

## How it fits

- Frontend can point to this API in development via `VITE_API_BASE_URL=http://localhost:3001`.
- `/api/sqs/submit` builds the same payload as the Lambda stack and publishes via `sqs-publisher.js`.
- In-memory jobs simulate asynchronous completion for quick local feedback.

## Run locally

```bash
cd backend
npm install
npm start
# http://localhost:3001
```

## Environment

- Loads `../.env.local` via `dotenv`.
- Useful vars:
  - `PORT` (default 3001)
  - `API_KEY` (optional; enforced if set)
  - `VITE_GITHUB_ORG` (used to build default repo names)
  - `CLIENT_COMPANY_NAME`

## Notes

For production, the API is served by API Gateway + Lambda. This service is only for local workflows and testing.
