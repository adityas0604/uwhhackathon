#!/bin/bash

echo "🛑 Stopping Redis container..."
docker stop redis-bullmq 2>/dev/null && docker rm redis-bullmq 2>/dev/null

echo "🛑 Stopping Docker Compose services (if any)..."
docker compose down

echo "🧹 Killing background Node/Nodemon processes..."
# Kill all node processes in background started by this user (only safe if this project runs node directly)
pkill -f "nodemon index.js"
pkill -f "node start-worker.js"
pkill -f "node index.js"

echo "🧼 (Optional) Stopping frontend dev server..."
pkill -f "npm start"

echo "✅ All services stopped."
