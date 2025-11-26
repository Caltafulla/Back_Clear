#!/bin/bash

# Script para inicializar la base de datos con datos de prueba

echo "🚀 Inicializando base de datos con datos de prueba..."

# Esperar a que MongoDB esté listo
echo "⏳ Esperando a que MongoDB esté listo..."
until mongosh --eval "print('MongoDB is ready')" > /dev/null 2>&1; do
  echo "MongoDB no está listo aún, esperando..."
  sleep 2
done

echo "✅ MongoDB está listo"

# Conectar a MongoDB y ejecutar script de inicialización
echo "📊 Ejecutando script de inicialización..."
mongosh --file scripts/init-mongo.js

echo "✅ Base de datos inicializada correctamente"

# Crear directorios necesarios
echo "📁 Creando directorios necesarios..."
mkdir -p logs
mkdir -p uploads
mkdir -p test-logs
mkdir -p test-uploads

echo "🎉 Inicialización completada!"
