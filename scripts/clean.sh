#!/bin/bash

# Script para limpiar el entorno de desarrollo

echo "🧹 Limpiando entorno de desarrollo..."

# Detener contenedores Docker
echo "🐳 Deteniendo contenedores Docker..."
docker-compose down -v

# Limpiar imágenes Docker no utilizadas
echo "🗑️ Limpiando imágenes Docker no utilizadas..."
docker system prune -f

# Limpiar archivos de build
echo "📦 Limpiando archivos de build..."
rm -rf dist/
rm -rf build/
rm -rf node_modules/
rm -rf coverage/

# Limpiar logs
echo "📝 Limpiando logs..."
rm -rf logs/
rm -rf test-logs/

# Limpiar uploads
echo "📁 Limpiando uploads..."
rm -rf uploads/
rm -rf test-uploads/

# Limpiar archivos temporales
echo "🗂️ Limpiando archivos temporales..."
rm -rf tmp/
rm -rf temp/
rm -f *.log
rm -f *.pid

echo "✅ Limpieza completada!"
