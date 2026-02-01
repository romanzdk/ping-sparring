# Agents Instructions - Ping Sparring

This file contains instructions for AI coding agents working on this project.

## Project Overview

Ping Sparring is a table tennis training marketplace platform with:
- **Backend**: FastAPI (Python 3.11+) with async SQLAlchemy and PostgreSQL
- **Frontend**: React 18 + TypeScript + Vite
- **Deployment**: Render.com (Frankfurt region)

## Production Deployment

### Render Services

The application is deployed on Render with the following services:

| Service | Type | ID | URL |
|---------|------|-----|-----|
| muj-trenink | Frontend (Docker) | `<frontend-service-id>` | https://muj-trenink.onrender.com |
| muj-trenink-api | Backend (Docker) | `<backend-service-id>` | https://muj-trenink-api.onrender.com |
| muj-trenink-db | PostgreSQL | `<database-id>` | Internal connection |

### Render CLI

The Render CLI is available for managing deployments:

```bash
# List all services
render services list -o json

# View logs for backend
render logs --service <backend-service-id> -o text

# View logs for frontend
render logs --service <frontend-service-id> -o text

# Trigger a deploy for backend
render deploys create --service <backend-service-id> -o json --confirm

# Trigger a deploy for frontend
render deploys create --service <frontend-service-id> -o json --confirm

# Restart backend service
render restart --service <backend-service-id> -o json --confirm

# SSH into backend (interactive)
render ssh <backend-service-id>

# Open psql session to database
render psql <database-id>
```

### Environment Variables

Environment variables can be set via the Render Dashboard or API:

**Dashboard:**
- Backend: https://dashboard.render.com/web/<backend-service-id>/env
- Frontend: https://dashboard.render.com/web/<frontend-service-id>/env

**API (requires API key from ~/.render/cli.yaml):**

```bash
# Get API key
API_KEY=$(grep 'key:' ~/.render/cli.yaml | head -1 | awk '{print $2}')

# List current env vars
curl -s -H "Authorization: Bearer $API_KEY" \
  "https://api.render.com/v1/services/<backend-service-id>/env-vars" | python3 -m json.tool

# Set an env var
curl -s -X PUT -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/<backend-service-id>/env-vars/VAR_NAME" \
  -d '{"value": "var_value"}'

# After setting env vars, trigger a deploy to apply them
render deploys create <backend-service-id> -o json --confirm
```

**Required Backend Environment Variables:**

```
# Database (auto-configured by Render)
DATABASE_URL=<provided by Render PostgreSQL>

# Security
SECRET_KEY=<generate with: openssl rand -hex 32>

# Email (Resend - recommended)
EMAIL_PROVIDER=resend
EMAIL_FROM=Ping Sparring <noreply@pingsparring.cz>
RESEND_API_KEY=re_xxxxxxxxxxxx

# Frontend URL (for email links)
FRONTEND_URL=https://muj-trenink.onrender.com

# Environment
ENVIRONMENT=production
```

**Required Frontend Environment Variables (Build-time):**

```
VITE_API_URL=https://muj-trenink-api.onrender.com
```

### Deployment Workflow

1. **Auto-deploy**: Both services auto-deploy on push to `main` branch
2. **Manual deploy**: Use `render deploys create --service <service-id> -o json --confirm`
3. **Database migrations**: SSH into backend and run `alembic upgrade head`

### Running Database Migrations

```bash
# Option 1: SSH into the service
render ssh <backend-service-id>
# Then inside the container:
cd /app && alembic upgrade head

# Option 2: Use render jobs (if configured)
render jobs create --service <backend-service-id> --command "alembic upgrade head" -o json --confirm
```

## Local Development

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local backend development)
- Node.js 20+ (for local frontend development)
- Poetry (Python dependency management)

### Quick Start

```bash
# Start all services with Docker Compose
docker-compose up -d

# Run database migrations
docker-compose exec backend alembic upgrade head

# Seed initial data (regions)
docker-compose exec backend python -m app.core.seed
```

### Backend Development

```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## Code Structure

```
ping-sparring/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routes
│   │   ├── core/         # Config, security, database
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic
│   │       └── email/    # Modular email providers
│   ├── alembic/          # Database migrations
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── api/          # API client
│   └── Dockerfile.prod
├── docker-compose.yml      # Development
└── docker-compose.prod.yml # Production reference
```

## Email Service

The email service uses a modular provider architecture:

```
backend/app/services/email/
├── __init__.py          # Factory and send_email() function
├── base.py              # Abstract EmailProvider interface
├── resend_provider.py   # Resend API implementation
└── smtp_provider.py     # SMTP fallback
```

**Switching providers:**

1. Set `EMAIL_PROVIDER` environment variable to: `resend`, `smtp`, or `console`
2. Provide required credentials for the chosen provider

**Adding a new provider (e.g., Mailgun):**

1. Create `mailgun_provider.py` implementing `EmailProvider` abstract class
2. Add provider to factory in `__init__.py`
3. Add config settings to `backend/app/core/config.py`

## Common Tasks

### Adding a New API Endpoint

1. Create/edit route in `backend/app/api/`
2. Add Pydantic schemas in `backend/app/schemas/`
3. Implement business logic in `backend/app/services/`
4. Add tests in `backend/tests/`

### Database Schema Changes

1. Modify models in `backend/app/models/`
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Review and edit the generated migration
4. Apply: `alembic upgrade head`

### Deploying Changes

1. Push to `main` branch (auto-deploys)
2. Check logs: `render logs --service <backend-service-id> -o text`
3. If DB migration needed, SSH in and run `alembic upgrade head`
