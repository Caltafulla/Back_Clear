#!/bin/bash

# Script para ejecutar tests

echo "🧪 Ejecutando tests..."

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Crear directorios necesarios para tests
mkdir -p test-logs
mkdir -p test-uploads
mkdir -p coverage

# Ejecutar tests
echo "🔬 Ejecutando tests unitarios..."
npm run test

# Ejecutar tests de integración
echo "🔗 Ejecutando tests de integración..."
npm run test:integration

# Generar reporte de coverage
echo "📊 Generando reporte de coverage..."
npm run test:coverage

echo "✅ Tests completados!"
