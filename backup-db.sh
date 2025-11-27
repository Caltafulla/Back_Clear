#!/usr/bin/env bash
# Simple MongoDB backup script using mongodump
# Requires: mongodump in PATH or use a docker container
# Usage: ./backup-db.sh /path/to/backup/dir

set -euo pipefail

OUT_DIR=${1:-./db_backups}
TIMESTAMP=$(date +%Y%m%d%H%M%S)
mkdir -p "${OUT_DIR}"

# DATABASE_URL can be a full mongodb URI, e.g. mongodb://user:pass@host:27017/db
DATABASE_URL=${DATABASE_URL:-mongodb://localhost:27017/algorithmic-challenges}

echo "Backing up MongoDB from ${DATABASE_URL} to ${OUT_DIR}/backup-${TIMESTAMP}.gz"

# If mongodump available locally
if command -v mongodump >/dev/null 2>&1; then
  mongodump --uri="${DATABASE_URL}" --archive="${OUT_DIR}/backup-${TIMESTAMP}.gz" --gzip
else
  echo "mongodump not found locally; attempting to run via docker mongo image"
  docker run --rm -v "${PWD}/${OUT_DIR}:/backup" mongo:6.0 bash -c "mongodump --uri='${DATABASE_URL}' --archive=/backup/backup-${TIMESTAMP}.gz --gzip"
fi

echo "Backup complete: ${OUT_DIR}/backup-${TIMESTAMP}.gz"
