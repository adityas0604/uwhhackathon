#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")"

echo "🔁 Starting Docker containers (Redis, Prometheus, Grafana)..."
docker compose up -d

echo "🚀 Starting backend server..."
cd backend
# Open backend in background
node index.js &

echo "⚙️  Starting BullMQ worker..."
node start-worker.js &

echo "🧠 Backend & worker running!"

# Optional: Start frontend
if [ -d "../frontend" ]; then
  echo "🌐 Starting frontend..."
  cd ../frontend
  npm run dev
else
  echo "⚠️ No frontend directory found. Skipping..."
fi
