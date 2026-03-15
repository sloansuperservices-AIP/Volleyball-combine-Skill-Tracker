# CPU base (swap to nvidia/cuda for GPU)
FROM python:3.12-slim

# OpenCV runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy vision worker code
COPY . .
# Copy shared backend modules (workers/, config, services)
COPY ../backend/workers ./workers
COPY ../backend/config.py ./config.py
COPY ../backend/services ./services

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

CMD ["celery", "-A", "workers.celery_app", "worker", "-Q", "vision", "--loglevel=info"]
