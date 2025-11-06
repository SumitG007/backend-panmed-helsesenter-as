# Panmed Helsesenter AS - Backend API

Backend API for the Panmed Helsesenter AS telemedicine platform.

## Features

- User authentication (Patient, Specialist, Admin)
- Email verification system
- Password reset functionality
- JWT-based authentication
- Role-based access control
- Input validation
- Rate limiting

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Nodemailer for email services
- bcryptjs for password hashing

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/panmed
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/panmed?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Admin Password (for initial admin user)
ADMIN_PASSWORD=Admin@123456
```

### 3. Gmail Setup for Email Service

1. Create a Gmail account for the application
2. Enable 2-Step Verification
3. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password
   - Use this password in `EMAIL_PASSWORD`

### 4. Database Setup

Make sure MongoDB is running locally or use MongoDB Atlas.

### 5. Seed Admin User

Run the seed script to create the initial admin user:

```bash
npm run seed:admin
```

This will create an admin user with:
- Email: `admin@yopmail.com`
- Password: (from ADMIN_PASSWORD env variable, default: `Admin@123456`)

**Important:** Change the admin password after first login!

### 6. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000` (or the PORT specified in .env)

## API Endpoints

### Authentication Routes

#### Register Patient
- **POST** `/api/auth/register/patient`
- **Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+4712345678",
    "address": "Street 123",
    "city": "Oslo",
    "postalCode": "0123",
    "country": "Norge",
    "dateOfBirth": "1990-01-01",
    "password": "password123"
  }
  ```

#### Register Specialist
- **POST** `/api/auth/register/specialist`
- **Body:** (Same as patient + optional specialist fields)
  ```json
  {
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phone": "+4712345678",
    "address": "Street 123",
    "city": "Oslo",
    "postalCode": "0123",
    "country": "Norge",
    "dateOfBirth": "1985-01-01",
    "password": "password123",
    "medicalSpecialty": "Cardiology",
    "professionalSummary": "Experienced cardiologist...",
    "workExperience": [],
    "education": [],
    "languages": []
  }
  ```

#### Login
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:** Returns JWT token

#### Verify Email
- **GET** `/api/auth/verify-email?token=<verification_token>`
- Verifies user email address

#### Resend Verification Email
- **POST** `/api/auth/resend-verification`
- **Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```

#### Forgot Password
- **POST** `/api/auth/forgot-password`
- **Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```

#### Reset Password
- **POST** `/api/auth/reset-password`
- **Body:**
  ```json
  {
    "token": "<reset_token>",
    "password": "newpassword123"
  }
  ```

#### Get Current User
- **GET** `/api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- Returns current user information

## User Roles

- **patient**: Regular patient users
- **specialist**: Healthcare specialists (require CV approval)
- **admin**: System administrators

## Email Verification Flow

1. User registers (patient or specialist)
2. System sends verification email with token
3. User clicks verification link in email
4. Email is verified, user can now login
5. Users cannot login until email is verified

## Password Reset Flow

1. User requests password reset via `/api/auth/forgot-password`
2. System sends password reset email with token
3. User clicks reset link and enters new password
4. Password is updated, user can login with new password

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Email verification required before login
- Rate limiting on API endpoints
- Input validation on all endpoints
- Role-based access control

## Notes

- Admin user is pre-created and cannot be registered through the API
- Only one admin user exists (admin@yopmail.com)
- Admin can use forgot password functionality
- All user-facing messages are in English
- All developer-facing code is in English

