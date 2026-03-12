FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN DJANGO_SECRET_KEY=docker-build-secret \
    DJANGO_ALLOWED_HOSTS=backend,localhost,127.0.0.1 \
    CORS_ALLOWED_ORIGINS=http://localhost:3000,http://frontend:3000 \
    CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 \
    DATABASE_URL=sqlite:////app/db.sqlite3 \
    python manage.py collectstatic --noinput --settings=config.settings_prod

EXPOSE 8000

ENV DJANGO_SETTINGS_MODULE=config.settings_prod

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/core/health/ || exit 1

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
