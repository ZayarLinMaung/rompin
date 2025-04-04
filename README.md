# MTerra Real Estate Management System

A comprehensive real estate management system for property developers and agents. This application allows management of property units, reservations, and customer bookings.

## Features

- **Admin Dashboard**

  - Manage property units
  - Track reservations
  - Update unit status
  - View booking documents
  - Generate unit statistics

- **User Portal**

  - Browse available units
  - Reserve units
  - Upload required documents
  - Track reservation status
  - Update profile information

- **Unit Management**
  - Floor-based navigation
  - View-based filtering (Lake View, Facility View)
  - Unit status tracking
  - Unit details display

## Tech Stack

### Frontend

- React 18
- React Router DOM 6
- Axios for API communication
- Material UI components
- Custom CSS for styling

### Backend

- Node.js with Express
- MongoDB with Mongoose ORM
- JWT for authentication
- Multer for file uploads
- bcrypt for password hashing

## Documentation

For detailed setup and usage instructions, refer to the following guides:

- [Setup Guide](README.setup.md) - Complete installation and setup instructions
- [Unit Facing Configuration](README.unit-facings.md) - Configure unit facings based on unit numbers
- [File Upload System](README.file-uploads.md) - Documentation for the file upload system

## Quick Start

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/mterra.git
cd mterra

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. Start the application:

```bash
./start.sh
```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Project Structure

```
mterra/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── app.js
│   ├── uploads/
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## API Endpoints

### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and get JWT token
- `PUT /api/users/profile` - Update user profile

### Units

- `GET /api/units` - Get all units (with filtering options)
- `GET /api/units/:id` - Get single unit
- `POST /api/units` - Create new unit (admin only)
- `PUT /api/units/:id` - Update unit (admin only)
- `DELETE /api/units/:id` - Delete unit (admin only)
- `PUT /api/units/:id/reserve` - Reserve a unit

### Bookings

- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/all` - Get all bookings (admin only)
- `PUT /api/bookings/:id/status` - Update booking status (admin only)
- `POST /api/units/:id/files` - Upload booking documents

## User Roles

### Admin User

- Can view and manage all units
- Can approve, reject, or cancel reservations
- Can add, edit or delete units
- Can view all reservations

### Regular User

- Can browse available units
- Can reserve units
- Can view their own reservations
- Can manage their profile

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Material UI](https://mui.com/)
# rompin
