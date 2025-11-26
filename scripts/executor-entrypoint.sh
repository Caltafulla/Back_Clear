#!/bin/bash

# Script de entrada para ejecutar código TypeScript/JavaScript de forma segura
# Recibe como parámetro el archivo a ejecutar

set -e

CODE_FILE="$1"

if [ -z "$CODE_FILE" ]; then
  echo '{"error":"No code file provided"}' >&2
  exit 1
fi

if [ ! -f "$CODE_FILE" ]; then
  echo '{"error":"Code file not found"}' >&2
  exit 1
fi

# Ejecutar el archivo JavaScript/TypeScript compilado
exec node "$CODE_FILE"
