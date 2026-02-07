# Deployment Guide

This project is designed to be easily deployable to platforms like **Railway** or **Render**.

## Environment Variables

To ensure the application runs correctly in production, you must set the following environment variables in your deployment platform.

### Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | The port the backend should run on. | `5001` or `10000` |
| `MONGODB_URI` | Your MongoDB connection string. | `mongodb+srv://...` |
| `JWT_SECRET` | A secret key for JWT token generation. | `your_secret_key` |
| `FRONTEND_URL` | The URL of your deployed frontend. | `https://your-frontend.vercel.app` |

### Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | The full URL of your deployed backend API. | `https://your-backend.railway.app/api` |

---

### Render (Unified - Manual Setup)

1. **Create a New Web Service** on Render.
2. **Root Directory**: (Leave blank)
3. **Build Command**: `npm run install-all && npm run build`
4. **Start Command**: `npm start`
5. **Add Environment Variables** (Environment tab):
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: (Your MongoDB string)
   - `JWT_SECRET`: (A secret key)
   - `VITE_API_URL`: `https://your-app-name.onrender.com/api`
   - `FRONTEND_URL`: `https://your-app-name.onrender.com`

---

### Render (Using Blueprint) 
*If you change your mind, this is the easiest way:*
1. Connect repo -> Select Blueprint -> Apply. It uses `render.yaml`.

---

## Troubleshooting "API Error"

If you see an "API Error" after deployment:
1. Verify that `VITE_API_URL` in the frontend starts with `https://` and ends with `/api`.
2. Verify that `FRONTEND_URL` in the backend matches your frontend's deployment URL exactly (without a trailing slash).
3. Check the backend logs for "CORS" or "MongoDB Connection" errors.
