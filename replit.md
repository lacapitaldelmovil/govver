# Flota Veracruz - Vehicle Fleet Management System

## Overview
A comprehensive vehicle fleet management system for the Government of Veracruz (Gobierno del Estado de Veracruz). The application allows authorized personnel to manage vehicle inventory, track movements, process requests, and generate reports.

## Project Architecture

### Frontend (React + Vite)
- **Location**: `/frontend`
- **Port**: 5000 (development)
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router DOM

### Backend (Express.js)
- **Location**: `/backend`
- **Port**: 3001
- **Framework**: Express.js
- **Database**: SQLite (using sql.js)
- **Authentication**: JWT-based

### Key Features
- User authentication with role-based access
- Vehicle inventory management
- Department (Secretarias) management
- Request processing for vehicle allocation
- Movement tracking
- Dashboard with statistics
- Report generation

## Running the Application

### Development
```bash
npm run dev
```
This runs both frontend and backend concurrently using the npm workspaces.

### Production
```bash
npm run build
npm start
```

## Environment Variables

### Backend (`backend/.env`)
- `PORT`: Backend server port (default: 3001)
- `NODE_ENV`: Environment mode
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration time

## Database
The application uses SQLite with sql.js. The database file is stored at `backend/flota_veracruz.sqlite`.

### Database Scripts
- `npm run seed` - Seed the database with initial data
- `npm run migrate` - Run database migrations

## API Routes
All API routes are prefixed with `/api`:
- `/api/auth` - Authentication (login/logout)
- `/api/vehiculos` - Vehicle management
- `/api/usuarios` - User management
- `/api/secretarias` - Department management
- `/api/solicitudes` - Request management
- `/api/movimientos` - Movement tracking
- `/api/dashboard` - Dashboard statistics
- `/api/reportes` - Report generation
- `/api/proveedores` - Supplier management

## Recent Changes
- 2026-01-25: Initial Replit environment setup
  - Configured Vite to run on port 5000 with proper host settings
  - Updated CORS to allow all origins for development
  - Created workflow for concurrent frontend/backend development
