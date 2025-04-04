#!/bin/bash

# Start MongoDB if not running
if ! systemctl is-active --quiet mongod; then
  echo "Starting MongoDB..."
  sudo systemctl start mongod
fi

# Start backend
cd "$(dirname "$0")/backend"
echo "Starting backend..."
npm run dev &
BACKEND_PID=$!

# Start frontend
cd ../frontend
echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

# Function to handle exit
function cleanup {
  echo "Stopping services..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  exit
}

# Register the cleanup function for these signals
trap cleanup SIGINT SIGTERM

echo "Rompin is running!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop all services"

# Wait for signals
wait 