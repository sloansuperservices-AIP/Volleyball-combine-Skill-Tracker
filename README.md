# Volleyball Combine Skill Tracker

Vision-powered volleyball skill tracking system with real-time analysis, leaderboard, and intelligent video storage.

## Architecture Overview

```
                        ┌──────────────────────────────────────────────┐
                        │              INGRESS / CDN                   │
                        │     Nginx (reverse proxy + video delivery)   │
                        └──────────────────┬───────────────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────┐
              │                            │                        │
    ┌─────────▼──────────┐    ┌────────────▼──────────┐  ┌─────────▼──────────┐
    │    FastAPI          │    │     React Frontend    │  │  HLS Video Stream  │
    │    REST API         │    │     (Vite + TS)       │  │  (Nginx RTMP/HLS)  │
    │    (Async / ASGI)   │    │                       │  │                    │
    └─────────┬──────────┘    └───────────────────────┘  └────────────────────┘
              │
    ┌─────────┴──────────────────────────────────────┐
    │                   Task Queue                    │
    │              Redis (Celery Broker)              │
    │         + Result Cache + Session Store          │
    └────┬──────────────────────────────┬────────────┘
         │                              │
┌────────▼──────────┐        ┌──────────▼──────────────┐
│  Vision Workers   │        │   Video Process Workers  │
│  (Celery + GPU)   │        │   (Celery + FFmpeg)      │
│                   │        │                          │
│  • Pose Detection │        │  • Transcode to HLS      │
│  • Skill Analysis │        │  • Thumbnail Generation  │
│  • Jump Tracking  │        │  • Compression Pipeline  │
│  • Speed Metrics  │        │  • Tiered Storage Move   │
└────────┬──────────┘        └──────────┬───────────────┘
         │                              │
    ┌────▼──────────────────────────────▼────┐
    │            PostgreSQL + TimescaleDB     │
    │    (Player metrics, sessions, events)  │
    └─────────────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │     MinIO (S3-Compatible Storage)     │
    │  raw-uploads/ → processed/ → archive/ │
    │  Hot tier: SSD  |  Cold tier: HDD     │
    └───────────────────────────────────────┘
```

## Key Optimizations

### Vision Processing
- **Async task queue**: Vision jobs dispatched to Celery workers via Redis — API never blocks
- **Frame sampling**: Configurable sampling rate (default: every 3rd frame) reduces compute 66%
- **GPU workers**: Dedicated GPU-enabled worker pods for MediaPipe/YOLO inference
- **Batch inference**: Frames batched per video before inference to maximize GPU utilization
- **Result caching**: Redis caches analysis results for 24h — repeated views skip reprocessing

### Video Storage
- **Tiered storage**: Raw uploads → processed HLS → cold archive (auto-lifecycle policy)
- **HLS streaming**: Videos transcoded to adaptive bitrate HLS (360p/720p/1080p) for efficient delivery
- **Chunk-based upload**: Pre-signed multipart S3 upload — frontend uploads directly to MinIO
- **Compression pipeline**: FFmpeg H.264/H.265 transcoding cuts storage 40–60%
- **CDN-ready**: Nginx serves HLS `.m3u8` + `.ts` segments with aggressive cache headers

### Scalability
- **Horizontal pod autoscaler**: Vision workers scale 2→20 based on queue depth
- **Stateless API**: All state in PostgreSQL/Redis — API pods scale freely
- **TimescaleDB**: Time-series extension on PostgreSQL for efficient metric queries/aggregations
- **Read replicas**: Leaderboard queries routed to PostgreSQL read replica

## Services

| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| `api` | FastAPI + Uvicorn | 8000 | REST API |
| `worker-vision` | Celery + GPU | — | Vision analysis |
| `worker-video` | Celery + FFmpeg | — | Video transcoding |
| `redis` | Redis 7 | 6379 | Broker + cache |
| `postgres` | PostgreSQL 16 + Timescale | 5432 | Primary datastore |
| `minio` | MinIO | 9000/9001 | Object storage |
| `nginx` | Nginx | 80/443 | Proxy + HLS delivery |

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

API: http://localhost:8000/docs
MinIO Console: http://localhost:9001
Frontend: http://localhost:3000

## Production Deployment

See `k8s/` for Kubernetes manifests with HPA, resource limits, and GPU node affinity.

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```
