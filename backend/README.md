# Ping Sparring Backend

Backend API for the Ping Sparring Marketplace application.

## Setup

1. Install Poetry if you haven't already:
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

2. Install dependencies:
```bash
poetry install
```

3. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

4. Run database migrations:
```bash
poetry run alembic upgrade head
```

5. Run the development server:
```bash
poetry run uvicorn app.main:app --reload
```

## Database Migrations

Create a new migration:
```bash
poetry run alembic revision --autogenerate -m "description"
```

Apply migrations:
```bash
poetry run alembic upgrade head
```

## Testing

Run tests:
```bash
poetry run pytest
```
