# Rompin Real Estate Management System - Setup Guide

This guide covers how to set up and configure the Rompin Real Estate Management System on a Linux environment.

## Prerequisites

- Node.js (v14+)
- MongoDB (v4.4+)
- npm (v6+)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/rompin.git
cd rompin
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cd ../backend
touch .env
```

Add the following content to the `.env` file:

```
MONGODB_URI=mongodb://localhost:27017/rompin
JWT_SECRET=your-super-secret-key-change-this-in-production
PORT=5000
```

### 4. Create Start Script

Create a script to start both the backend and frontend servers simultaneously:

```bash
cd ..
touch start.sh
chmod +x start.sh
```

Add the following content to `start.sh`:

```bash
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
```

## Data Seeding and Configuration

### 1. Seed Initial Data

Rompin comes with scripts to seed the database with initial data:

```bash
# Seed only the units
cd backend
npm run seed:units

# Seed everything (units, users, bookings)
npm run seed:all
```

### 2. Configure Unit Facings

The system allows you to customize how units are categorized by their facing:

#### Unit Facing Configuration:
- **Lake View**: Units 8-18 on all floors
- **Facility View**: Units 19-29 on all floors

To update all existing units to this configuration:

```bash
cd backend
npm run update-facings
```

This script will parse the unit numbers and assign the appropriate facing based on the unit number ranges above.

## Running the Application

Start the application using the start script:

```bash
./start.sh
```

This will:
- Start MongoDB if it's not already running
- Start the backend server on http://localhost:5000
- Start the frontend server on http://localhost:5173

## Troubleshooting

### Permission Denied for start.sh

If you see `permission denied: ./start.sh`, ensure the script is executable:

```bash
chmod +x start.sh
```

### MongoDB Connection Issues

If MongoDB fails to connect:

1. Check if MongoDB is running:
   ```bash
   sudo systemctl status mongod
   ```

2. If not running, start it:
   ```bash
   sudo systemctl start mongod
   ```

3. Ensure MongoDB is enabled to start on boot:
   ```bash
   sudo systemctl enable mongod
   ```

### File Upload Issues

If there are issues with uploading or viewing files:

1. Ensure the uploads directory exists:
   ```bash
   mkdir -p backend/uploads
   chmod 755 backend/uploads
   ```

2. Restart the backend server to recognize the directory.

## Additional Configuration

### Customizing Unit Seeds

The unit seeder script can be customized by editing these files:

- `backend/src/scripts/seedOnlyUnits.js` - For seeding only units
- `backend/src/scripts/seedUnits.js` - For seeding all data including units

You can modify the `mapFacingToSchema` function in these files to change how facings are assigned based on unit numbers.

### Updating Existing Units

If you need to modify how existing units are organized or categorized, edit the `backend/src/scripts/updateUnitFacings.js` file and run:

```bash
npm run update-facings
```

## Accessing the Application

- **Admin Dashboard**: http://localhost:5173/admin
  - Default admin credentials: admin@example.com / password123

- **User Portal**: http://localhost:5173
  - Default user credentials: user@example.com / password123 