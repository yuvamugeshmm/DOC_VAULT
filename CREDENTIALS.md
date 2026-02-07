# Default Login Credentials

## Admin Login
- **ID**: `admin`
- **Password**: `admin123`
- **Role**: Admin

## Student Login
- **ID**: `714023205119` (Range: `714023205119` to `714023205174`)
- **Password**: `student123`
- **Role**: Student

---

## How to Create/Reset Users

Run this command in the backend directory:

```bash
cd backend
node scripts/createUser.js
```

This will create both admin and student users if they don't exist.

---

## Important Notes

1. **Make sure MongoDB is running** before creating users
2. **Make sure the backend server is running** before trying to login
3. **Check the backend console** for any error messages
4. **Check browser console (F12)** for network errors

---

## Troubleshooting

If login still fails:

1. **Verify MongoDB connection:**
   ```bash
   cd backend
   node scripts/checkSetup.js
   ```

2. **Check if users exist in database:**
   - Open MongoDB Compass or mongo shell
   - Connect to `mongodb://localhost:27017/student_document_store`
   - Check the `users` collection

3. **Reset users (delete and recreate):**
   ```bash
   cd backend
   node scripts/resetUsers.js
   ```

4. **Check backend is running:**
   - Should see: `Server running on port 5000`
   - Should see: `MongoDB Connected`

5. **Check frontend proxy:**
   - Frontend should proxy to `http://localhost:5000`
   - Check `frontend/vite.config.js`
