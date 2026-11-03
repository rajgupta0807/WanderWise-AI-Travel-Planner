# Wanderwise API

FastAPI backend for an AI travel itinerary planner: user accounts, trips, day-by-day
itineraries, activities and budget breakdowns.

- **Without an AI key** it generates itineraries from built-in templates, so everything works offline.
- **Guest sessions** create isolated guest accounts; demo users do not share trip data.
- **With `AI_API_KEY`** set (any OpenAI-compatible API) it asks the model for a personalised plan,
  and falls back to the templates if the call fails.

## Run locally (Windows PowerShell)

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt --default-timeout=100 --retries 10
.\.venv\Scripts\python.exe -m pytest                      # should print: all passed
copy .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs to try every endpoint.
In `/docs`: register at `POST /api/auth/register`, copy the `access_token`, click **Authorize**, paste it.

## Push to GitHub

```powershell
git init
git add .
git status          # make sure .env, .venv and *.db are NOT listed
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Deploy on Render

**Fastest:** Render dashboard > **New +** > **Blueprint** > pick your repo. `render.yaml` creates the
web service and a free PostgreSQL database and generates `SECRET_KEY` for you.

**Manual:** New Web Service from the repo, then:

| Setting | Value |
|---|---|
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check path | `/api/health` |

Environment variables:

| Name | Value |
|---|---|
| `APP_ENV` | `production` |
| `SECRET_KEY` | long random string (`python -c "import secrets; print(secrets.token_urlsafe(48))"`) |
| `DATABASE_URL` | PostgreSQL URL from Render / Neon / Supabase |
| `CORS_ORIGINS` | your frontend URL, e.g. `https://my-app.onrender.com` (comma-separated, or `*`) |
| `AI_API_KEY` | optional, enables AI itineraries |

With `APP_ENV=production` the app refuses to start if `SECRET_KEY` is missing. That is intentional.
The free Render plan sleeps when idle, so the first request after a pause can take about 30 seconds.

## Endpoints (all under `/api`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | health check |
| POST | `/auth/register`, `/auth/login`, `/auth/guest` | returns a bearer token; guest creates an isolated demo account |
| GET, PATCH | `/me` | profile |
| GET, POST | `/trips` | list (page, size, search, status, sort_by, sort_order) / create + generate |
| GET, PATCH, DELETE | `/trips/{trip_id}` | one trip |
| POST | `/trips/{trip_id}/regenerate` (alias `/generate`) | regenerate the whole itinerary |
| GET | `/trips/{trip_id}/itinerary` | all days |
| PATCH | `/trips/{trip_id}/days/{day_id}` | edit a day |
| POST | `/trips/{trip_id}/days/{day_id}/regenerate` | regenerate one day (`focus_preference` optional) |
| POST | `/trips/{trip_id}/days/{day_id}/activities` | add an activity |
| PATCH, DELETE | `/trips/{trip_id}/activities/{activity_id}` | edit / remove an activity |

## Notes

- Activity `estimated_cost` is the total for the whole group, not per person.
- The budget breakdown estimates accommodation, food and transport as fixed shares of the budget;
  it is a planning aid, not a price quote.
- Tables are created automatically on startup. For schema changes after launch, add Alembic migrations.
- SQLite files do not survive redeploys on most hosts. Use PostgreSQL in production.

## Layout

```
app/
  main.py            app, CORS, routers
  schemas.py         request/response models
  core/              config (env vars), security (password hashing, JWT)
  db/                engine/session, ORM models
  api/               auth dependency, routes (health, auth, trips, itinerary)
  services/          ai.py (generation), budget.py, itinerary.py
tests/               API tests
```
