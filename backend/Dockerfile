FROM python:3.12-slim

# Install system dependencies required for psycopg2 and building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir poetry==1.8.3

# Configure Poetry to not create virtual environments inside the container
RUN poetry config virtualenvs.create false

WORKDIR /app

# Copy Poetry dependency files
COPY pyproject.toml ./

# Install dependencies (excluding dev dependencies)
RUN poetry install --only main --no-interaction --no-ansi

# Copy application source code
COPY . .

# Set environment variables for production
ENV PYTHONUNBUFFERED=1

# Cloud Run expects listening on port 8080 (0.0.0.0 is required for production container routing; localhost is preserved for testing)
EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
