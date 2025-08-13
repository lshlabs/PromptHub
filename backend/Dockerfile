# Base Python image
FROM python:3.12-slim

# Prevents Python from writing .pyc files and enables unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (build-essential often needed for pip installs)
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy project
COPY backend/ /app/

# Expose Django dev server port
EXPOSE 8000

# Default environment (can be overridden by docker-compose)
ENV DJANGO_SETTINGS_MODULE="config.settings"

# Default command (overridden in compose to run migrations first)
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]


