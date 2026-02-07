# Student's Document Store System

A production-ready MERN stack web application for managing student documents with secure authentication, file upload, and role-based access control.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT with HTTP-only cookies, bcrypt
- **File Storage**: Local server storage

## Features

### Student Features
- Secure login with Student ID and Password
- Upload documents (PDF, JPG, PNG - Max 5MB)
- View own documents with pagination
- Search and filter documents by category
- Download own documents
- Delete own documents

### Admin Features
- Admin login
- View all documents from all students
- Delete any document
- Reset student passwords
- View all registered students

### Security Features
- JWT authentication with 1-hour expiry
- HTTP-only cookies
- bcrypt password hashing
- File ownership verification
- Secure file streaming
- File type and size validation
- Filename sanitization
- Executable file blocking
- Audit logging

## Project Structure

```
.
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Document.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── documents.js
│   │   └── admin.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   ├── auditLogger.js
│   │   └── fileUtils.js
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Setup Instructions (Unified)

### Prerequisites
- Node.js (v14 or higher)
- MongoDB

### Quick Start (Local)

1. **Install everything**:
   ```bash
   npm run install-all
   ```

2. **Configure Environment**:
   Edit `backend/.env` with your MongoDB URI and JWT Secret.

3. **Run the entire app**:
   ```bash
   npm run dev
   ```
   This will start both the backend (Port 5001) and the frontend (Port 3000) simultaneously.

### Deployment (Render)
Simply push to GitHub and connect to Render. The `render.yaml` Blueprint will automatically:
- Install all dependencies.
- Build the frontend.
- Serve the app from a single URL.

### Database Setup

1. Make sure MongoDB is running on your system.

2. The application will automatically create the database and collections on first run.

3. To create initial admin user, you can use MongoDB shell or a script:
```javascript
// Connect to MongoDB and run:
use student_document_store

db.users.insertOne({
  studentId: "admin",
  password: "$2a$10$YourHashedPasswordHere", // Use bcrypt to hash password
  role: "admin",
  name: "Administrator"
})
```

Or use a script to create admin (see below).

### Creating Initial Users

You can create users manually in MongoDB or use this Node.js script:

Create `backend/scripts/createUser.js`:
```javascript
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createUser() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Create admin user
  const admin = new User({
    studentId: 'admin',
    password: 'admin123', // Will be hashed automatically
    role: 'admin',
    name: 'Administrator'
  });
  await admin.save();
  console.log('Admin user created');
  
  // Create sample student
  const student = new User({
    studentId: '714023205119',
    password: 'student123',
    role: 'student',
    name: 'John Doe',
    email: 'john@example.com'
  });
  await student.save();
  console.log('Student user created');
  
  process.exit();
}

createUser();
```

Run it:
```bash
node backend/scripts/createUser.js
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Student login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Documents (Student)
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/my-documents` - Get own documents (with pagination, search, filter)
- `GET /api/documents/categories` - Get categories
- `GET /api/documents/download/:id` - Download document
- `DELETE /api/documents/:id` - Delete own document

### Admin
- `GET /api/admin/documents` - Get all documents
- `DELETE /api/admin/documents/:id` - Delete any document
- `POST /api/admin/reset-password` - Reset student password
- `GET /api/admin/students` - Get all students

## File Storage

Files are stored in:
```
backend/uploads/
  └── {studentId}/
      └── {category}/
          └── {randomFileName}.ext
```

Files are NOT publicly accessible. All file access requires:
1. Valid JWT token
2. Ownership verification (or admin role)

## Security Notes

- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens expire after 1 hour
- HTTP-only cookies prevent XSS attacks
- File uploads are validated for type and size
- Filenames are sanitized
- Executable files are blocked
- All file downloads verify ownership
- Audit logs track all important actions

## Development Notes

- Backend uses Express.js with MongoDB (Mongoose)
- Frontend uses React with Vite
- Tailwind CSS for styling (basic layout only)
- CORS enabled for frontend-backend communication
- File uploads use Multer with memory storage

## Production Deployment

This project is optimized for deployment on **Render** or **Railway**.

1. **Render (Blueprint)**: The project includes a `render.yaml` file. Simply connect your GitHub repo to Render and it will automatically configure both the backend and frontend.
2. **Environment Variables**: See [DEPLOYMENT.md](DEPLOYMENT.md) for a full list of required variables (`MONGODB_URI`, `JWT_SECRET`, etc.).
3. **Storage**: Files are currently stored locally. For production with multiple instances, consider integrating AWS S3 or similar.
4. **Security**: Ensure `NODE_ENV` is set to `production` and provide a strong `JWT_SECRET`.

## License

ISC
