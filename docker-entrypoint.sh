#!/bin/sh
set -e

echo "🔄 Running Prisma migrations..."
cd /app/apps/api
npx prisma migrate deploy

echo "🚀 Starting the API..."
cd /app
exec node apps/api/dist/index.js
