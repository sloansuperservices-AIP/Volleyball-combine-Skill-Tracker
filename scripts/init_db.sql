-- PostgreSQL + TimescaleDB initialization

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Convert skill_metrics to a TimescaleDB hypertable for time-series performance
-- Run AFTER the ORM creates the tables (handled in Docker entrypoint ordering)
SELECT create_hypertable('skill_metrics', 'measured_at', if_not_exists => TRUE);

-- Index for fast leaderboard queries: drill_type + metric_type
CREATE INDEX IF NOT EXISTS idx_skill_metrics_type_value
    ON skill_metrics (metric_type, value DESC);

-- Index for player history queries
CREATE INDEX IF NOT EXISTS idx_skill_metrics_player_time
    ON skill_metrics (player_id, measured_at DESC);

-- Index for session lookups
CREATE INDEX IF NOT EXISTS idx_combine_sessions_player
    ON combine_sessions (player_id, recorded_at DESC);

-- TimescaleDB continuous aggregate: pre-compute daily max per player/metric
-- Speeds up leaderboard from full scan to aggregate query
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_player_metrics
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', measured_at) AS day,
    player_id,
    metric_type,
    MAX(value) AS daily_max,
    AVG(value) AS daily_avg,
    COUNT(*) AS sample_count
FROM skill_metrics
GROUP BY day, player_id, metric_type
WITH NO DATA;

-- Refresh policy: keep aggregate up to date
SELECT add_continuous_aggregate_policy(
    'daily_player_metrics',
    start_offset => INTERVAL '7 days',
    end_offset   => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);
