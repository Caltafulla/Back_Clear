#!/usr/bin/env bash
# Setup Prometheus + Grafana via Docker Compose (local quickstart)
# Usage: ./setup-monitoring.sh [--compose-file docker-monitoring.yml]

set -euo pipefail

COMPOSE_FILE=${1:-docker-monitoring.yml}

cat > ${COMPOSE_FILE} <<'EOF'
version: '3.7'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3000:3000'
    depends_on:
      - prometheus
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  # Optional: node_exporter for system metrics
  node_exporter:
    image: prom/node-exporter:latest
    ports:
      - '9100:9100'

EOF

mkdir -p monitoring
cat > monitoring/prometheus.yml <<'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['node_exporter:9100']

# To scrape the app, add a scrape job for the app's /metrics endpoint
# - job_name: 'app'
#   metrics_path: /api/metrics
#   static_configs:
#     - targets: ['host.docker.internal:3000']

EOF

echo "Monitoring compose created: ${COMPOSE_FILE}. Start with: docker-compose -f ${COMPOSE_FILE} up -d"
