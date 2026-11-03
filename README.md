# WanderWise — AI Travel Planner

WanderWise is a full-stack travel planner with a React + TypeScript frontend and a FastAPI backend. It supports accounts, guest sessions, trip planning, day-by-day itineraries, activity editing, budget estimates, and map views. It can generate plans with built-in templates or an optional OpenAI-compatible API.

## Requirements

- Python 3.10+
- Node.js 18+ and npm

## 1. Start the backend (Windows PowerShell)

```powershell
cd wanderwise-backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt --default-timeout=100 --retries 10
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Backend API: http://127.0.0.1:8000
API docs: http://127.0.0.1:8000/docs
Health: http://127.0.0.1:8000/api/health

The default database is SQLite and the itinerary generator works without an AI API key. For production, set a strong `SECRET_KEY`, use PostgreSQL, and configure `CORS_ORIGINS`.

## 2. Start the frontend (a second PowerShell window)

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Open http://127.0.0.1:5173. The frontend `.env` points to the local FastAPI backend.

## 3. Verify the project

Backend tests:

```powershell
cd wanderwise-backend
.\.venv\Scripts\python.exe -m pytest -q
```

Frontend production build and tests:

```powershell
cd frontend
npm run build
npm test
```

## Authentication

Create an account with an email and password, or use **Continue as Demo Guest Traveler**. Each guest session gets its own account, so guest users cannot see one another's trips. Password reset email delivery is not configured in this local starter; configure a mail provider before enabling it in production.

## Optional AI generation

In `wanderwise-backend/.env`, set `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` for an OpenAI-compatible API. Leave `AI_API_KEY` blank to use the built-in offline itinerary templates.

## Project structure

```text
frontend/              React + TypeScript + Vite app
wanderwise-backend/    FastAPI app, SQLAlchemy models, API, and tests
```
