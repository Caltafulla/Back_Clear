#!/bin/bash

# Script para verificar Docker y ejecutar el proyecto

echo "🐳 Verificando Docker Desktop..."

# Verificar que Docker esté ejecutándose
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker Desktop no está ejecutándose."
    echo ""
    echo "📋 Para ejecutar el proyecto con Docker:"
    echo "   1. Abre Docker Desktop"
    echo "   2. Espera a que esté completamente iniciado"
    echo "   3. Ejecuta: docker-compose up --build"
    echo ""
    echo "🚀 Alternativamente, puedes ejecutar el proyecto sin Docker:"
    echo "   • npm run build"
    echo "   • npm test"
    echo "   • node demo.js"
    echo ""
    exit 1
fi

echo "✅ Docker Desktop está ejecutándose"
echo "🚀 Iniciando servicios con Docker Compose..."

# Ejecutar Docker Compose
docker-compose up --build -d

# Verificar estado de los servicios
echo "🔍 Verificando estado de los servicios..."
docker-compose ps

echo ""
echo "🎉 Servicios iniciados correctamente!"
echo "📊 Servicios disponibles:"
echo "   • API: http://localhost:3000"
echo "   • Health Check: http://localhost:3000/health"
echo "   • MongoDB: localhost:27017"
echo "   • Redis: localhost:6379"
echo ""
echo "🛠️ Comandos útiles:"
echo "   • Ver logs: docker-compose logs -f"
echo "   • Detener: docker-compose down"
echo "   • Reiniciar: docker-compose restart"
echo "   • Escalar workers: docker-compose up --scale worker-python=3"
