# Script para verificar Docker y ejecutar el proyecto (Windows PowerShell)

Write-Host "🐳 Verificando Docker Desktop..." -ForegroundColor Blue

# Verificar que Docker esté ejecutándose
try {
    docker info | Out-Null
    Write-Host "✅ Docker Desktop está ejecutándose" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Desktop no está ejecutándose." -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Para ejecutar el proyecto con Docker:" -ForegroundColor Yellow
    Write-Host "   1. Abre Docker Desktop" -ForegroundColor White
    Write-Host "   2. Espera a que esté completamente iniciado" -ForegroundColor White
    Write-Host "   3. Ejecuta: docker-compose up --build" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Alternativamente, puedes ejecutar el proyecto sin Docker:" -ForegroundColor Yellow
    Write-Host "   • npm run build" -ForegroundColor White
    Write-Host "   • npm test" -ForegroundColor White
    Write-Host "   • node demo.js" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "🚀 Iniciando servicios con Docker Compose..." -ForegroundColor Blue

# Ejecutar Docker Compose
docker-compose up --build -d

# Verificar estado de los servicios
Write-Host "🔍 Verificando estado de los servicios..." -ForegroundColor Blue
docker-compose ps

Write-Host ""
Write-Host "🎉 Servicios iniciados correctamente!" -ForegroundColor Green
Write-Host "📊 Servicios disponibles:" -ForegroundColor Yellow
Write-Host "   • API: http://localhost:3000" -ForegroundColor White
Write-Host "   • Health Check: http://localhost:3000/health" -ForegroundColor White
Write-Host "   • MongoDB: localhost:27017" -ForegroundColor White
Write-Host "   • Redis: localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "🛠️ Comandos útiles:" -ForegroundColor Yellow
Write-Host "   • Ver logs: docker-compose logs -f" -ForegroundColor White
Write-Host "   • Detener: docker-compose down" -ForegroundColor White
Write-Host "   • Reiniciar: docker-compose restart" -ForegroundColor White
Write-Host "   • Escalar workers: docker-compose up --scale worker-python=3" -ForegroundColor White
