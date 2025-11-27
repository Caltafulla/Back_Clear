#!/usr/bin/env bash
# Deployment helper for production
# Usage: ./deploy.sh <environment>
# Example: ./deploy.sh production

set -euo pipefail

ENV=${1:-production}
IMAGE_NAME=${IMAGE_NAME:-algorithmic-challenges-platform}
TAG=${TAG:-$(date +%Y%m%d%H%M)}

echo "Deploying ${IMAGE_NAME}:${TAG} to ${ENV}..."

# Build docker image
docker build -t ${IMAGE_NAME}:${TAG} .

# Optional: push to registry (configure DOCKER_REGISTRY and DOCKER_USER/DOCKER_PASS)
if [ -n "${DOCKER_REGISTRY:-}" ]; then
  FULL_TAG=${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}
  docker tag ${IMAGE_NAME}:${TAG} ${FULL_TAG}
  echo "Pushing ${FULL_TAG}..."
  docker push ${FULL_TAG}
fi

echo "Deployment script completed. Implement environment-specific deployment (k8s/ecs) as needed."
