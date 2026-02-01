FROM python:3.11-slim

WORKDIR /app

# Install Poetry
RUN pip install poetry==1.7.1

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Configure poetry to not create virtual env
RUN poetry config virtualenvs.create false

# Install dependencies
RUN poetry install --no-interaction --no-ansi

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Environment variable to control number of workers
# Default to 4 workers for production, can be overridden
ENV UVICORN_WORKERS=4

# Run the application with multiple workers for production
# Use --workers for production scaling (each worker handles concurrent async requests)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${UVICORN_WORKERS}"]
