# KarIA Scout

Agente de inteligencia competitiva de precios para equipos de ventas de electrodomésticos.

## Requisitos
- Docker y Docker Compose
- Node.js 20+ (solo para desarrollo local sin Docker)
- Archivo .env configurado (ver .env.example)

## Instalación
cp .env.example .env
# Completar las variables en .env

## Cómo correr
docker compose up --build      # Producción / staging
npm install && npm run dev     # Desarrollo local sin Docker
