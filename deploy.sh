#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
npm run build

# Create necessary directories
echo "📁 Creating necessary directories..."
cd ../backend
mkdir -p uploads
mkdir -p logs

# Set permissions
echo "🔒 Setting permissions..."
chmod 755 uploads
chmod 755 logs

# Start the application
echo "🌐 Starting the application..."
cd ..
pm2 start backend/src/index.js --name "hartalink-api"
pm2 save

echo "✅ Deployment completed successfully!"
echo "🌍 Your application should now be running at https://hartalink.com" 