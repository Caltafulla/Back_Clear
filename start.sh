#!/bin/bash

# Script de inicio rápido para la Plataforma de Retos Algorítmicos

echo "🚀 Iniciando Plataforma de Retos Algorítmicos..."
echo "=================================================="

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    echo "   Visita: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    echo "   Visita: https://docs.docker.com/compose/install/"
    exit 1
fi

# Verificar que el archivo .env exista
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env desde env.example..."
    cp env.example .env
    echo "⚠️  Por favor edita el archivo .env con tus configuraciones antes de continuar."
    echo "   Especialmente importante: JWT_SECRET, DATABASE_URL, REDIS_URL"
    read -p "¿Continuar con la configuración por defecto? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "👋 Configuración cancelada. Edita .env y ejecuta este script nuevamente."
        exit 1
    fi
fi

# Crear directorios necesarios
echo "📁 Creando directorios necesarios..."
mkdir -p logs uploads test-logs test-uploads

# Construir y ejecutar servicios
echo "🐳 Construyendo y ejecutando servicios con Docker Compose..."
docker-compose up --build -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado de los servicios
echo "🔍 Verificando estado de los servicios..."
docker-compose ps

# Verificar health check
echo "🏥 Verificando health check..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ API está funcionando correctamente!"
        break
    else
        echo "⏳ Intento $attempt/$max_attempts - Esperando que la API esté lista..."
        sleep 2
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ La API no respondió después de $max_attempts intentos."
    echo "📋 Verificando logs..."
    docker-compose logs api
    exit 1
fi

# Mostrar información del sistema
echo ""
echo "🎉 ¡Plataforma iniciada exitosamente!"
echo "=================================================="
echo "📊 Servicios disponibles:"
echo "   • API: http://localhost:3000"
echo "   • Health Check: http://localhost:3000/health"
echo "   • Métricas: http://localhost:3000/api/metrics"
echo "   • MongoDB: localhost:27017"
echo "   • Redis: localhost:6379"
echo ""
echo "🔑 Usuario administrador por defecto:"
echo "   • Email: admin@example.com"
echo "   • Password: admin123"
echo ""
echo "📚 Documentación:"
echo "   • README.md - Guía principal"
echo "   • docs/API.md - Documentación de la API"
echo "   • docs/ARCHITECTURE.md - Arquitectura del sistema"
echo "   • docs/DEPLOYMENT.md - Guía de despliegue"
echo ""
echo "🛠️ Comandos útiles:"
echo "   • Ver logs: docker-compose logs -f"
echo "   • Detener: docker-compose down"
echo "   • Reiniciar: docker-compose restart"
echo "   • Escalar workers: docker-compose up --scale worker-python=3"
echo ""
echo "🧪 Para ejecutar tests:"
echo "   • npm test"
echo "   • npm run test:coverage"
echo ""
echo "📈 Para monitorear:"
echo "   • docker-compose logs -f api"
echo "   • curl http://localhost:3000/api/metrics"
echo ""

# Opcional: Abrir navegador
read -p "¿Abrir el navegador en http://localhost:3000/health? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000/health
    elif command -v open &> /dev/null; then
        open http://localhost:3000/health
    elif command -v start &> /dev/null; then
        start http://localhost:3000/health
    else
        echo "No se pudo abrir el navegador automáticamente."
    fi
fi

echo "🎯 ¡Disfruta desarrollando con la Plataforma de Retos Algorítmicos!"
