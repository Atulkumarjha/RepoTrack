# RepoTrack Deployment Guide

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub account connected to Vercel
- Backend API deployed and accessible publicly

### Step 1: Prepare Frontend
```bash
cd frontend
npm install
npm run build  # Verify build works locally
```

### Step 2: Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd frontend
vercel
```

#### Option B: Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your Git repository
3. Select the `frontend` directory as the root
4. Vercel will auto-detect Next.js settings

### Step 3: Configure Environment Variables in Vercel

Add these environment variables in Vercel Dashboard (Settings → Environment Variables):

```env
NEXT_PUBLIC_API_URL=https://your-backend-api-url.com
NEXT_PUBLIC_FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Important:** 
- `NEXT_PUBLIC_API_URL` must be your **public backend URL** (Railway, Render, AWS, etc.)
- `NEXT_PUBLIC_FRONTEND_URL` is your Vercel deployment URL
- Redeploy after adding environment variables

### Step 4: Update GitHub OAuth App

Update your GitHub OAuth App settings:
1. Go to https://github.com/settings/developers
2. Select your OAuth App (Client ID: `Ov23liP9pwRGJaKgV1U2`)
3. Update:
   - **Homepage URL**: `https://your-vercel-app.vercel.app`
   - **Authorization callback URL**: `https://your-backend-url.com/auth/github/callback`

---

## Backend Deployment

### Option 1: Railway (Recommended for FastAPI + MongoDB)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Add MongoDB plugin
railway add mongodb

# Deploy
railway up
```

**Environment Variables (Railway Dashboard):**
```env
MONGO_URI=<provided-by-railway-mongodb-plugin>
MONGO_DB_NAME=repotrack
GITHUB_CLIENT_ID=Ov23liP9pwRGJaKgV1U2
GITHUB_CLIENT_SECRET=c8cf3f09ee4c26009b2607b07cad4130b5911432
GITHUB_WEBHOOK_SECRET=supersecret
BACKEND_BASE_URL=https://your-railway-url.up.railway.app
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Option 2: Render

1. Create new Web Service at https://render.com
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3
4. Add environment variables (same as above)
5. Add MongoDB via Render or use MongoDB Atlas

### Option 3: MongoDB Atlas (Database)

If using external MongoDB:
1. Create cluster at https://cloud.mongodb.com
2. Create database user
3. Whitelist IP: `0.0.0.0/0` (allow all) or specific IPs
4. Get connection string
5. Update `MONGO_URI` in backend env vars:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   ```

---

## Post-Deployment Checklist

### 1. Test Frontend
- [ ] Visit your Vercel URL
- [ ] Click "Continue with GitHub" - should redirect to GitHub OAuth
- [ ] After auth, should redirect back to `/callback` then `/repositories`

### 2. Test Backend
- [ ] Visit `https://your-backend-url.com/docs` (FastAPI auto docs)
- [ ] Test `/auth/github/login` endpoint
- [ ] Verify MongoDB connection in logs

### 3. Configure Webhooks
- [ ] Connect a repository in RepoTrack UI
- [ ] Check if GitHub webhook was created (repo Settings → Webhooks)
- [ ] Webhook URL should be: `https://your-backend-url.com/webhooks/github`
- [ ] Make a test commit/PR and verify notification arrives

### 4. Test Integrations
- [ ] Add Discord webhook in Dashboard → Integrations
- [ ] Push a commit to connected repo
- [ ] Verify Discord message received

---

## Build Commands Reference

### Frontend (Next.js)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm start            # Serve production build
```

### Backend (FastAPI)
```bash
cd backend
python -m venv .venv                    # Create virtual environment
source .venv/bin/activate               # Activate (Mac/Linux)
# .venv\Scripts\activate                # Activate (Windows)
pip install -r requirements.txt         # Install dependencies
uvicorn app.main:app --reload           # Development server (localhost:8000)
uvicorn app.main:app --host 0.0.0.0     # Production server
```

---

## Troubleshooting

### Frontend Issues

**401 Unauthorized errors:**
- Verify `NEXT_PUBLIC_API_URL` is correct in Vercel
- Check if token expired (log in again)
- Verify backend is accessible publicly

**Blank activity feed:**
- Backend webhook URL must be public (not localhost)
- Reconnect repository after deploying backend
- Check GitHub webhook deliveries in repo settings

**CORS errors:**
- Backend must allow frontend domain in CORS settings
- Check `app/main.py` CORS configuration

### Backend Issues

**MongoDB connection failed:**
- Verify `MONGO_URI` is correct
- Check IP whitelist in MongoDB Atlas
- Ensure network allows MongoDB port (27017)

**Webhook signature verification failed:**
- `GITHUB_WEBHOOK_SECRET` must match the secret in GitHub webhook settings
- Regenerate webhook secret if needed

**Discord/Slack not receiving notifications:**
- Verify webhook URLs are saved correctly in MongoDB `notification_settings`
- Check backend logs for HTTP errors when sending
- Test webhook manually with curl

---

## Environment Variables Summary

### Frontend (.env.local or Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
```

### Backend (.env or Railway/Render)
```env
MONGO_URI=mongodb://localhost:27017  # or MongoDB Atlas URI
MONGO_DB_NAME=repotrack
GITHUB_CLIENT_ID=Ov23liP9pwRGJaKgV1U2
GITHUB_CLIENT_SECRET=c8cf3f09ee4c26009b2607b07cad4130b5911432
GITHUB_WEBHOOK_SECRET=supersecret
BACKEND_BASE_URL=https://your-backend-url.com
FRONTEND_URL=https://your-app.vercel.app
```

---

## Security Notes

⚠️ **Important Security Reminders:**

1. **Never commit `.env` files** - they contain secrets
2. **Rotate Discord webhook** - exposed in chat history
3. **Use production SECRET_KEY** - change from "CHANGE_THIS_IN_PRODUCTION" in `backend/app/core/security.py`
4. **Enable HTTPS only** - disable HTTP in production
5. **Restrict CORS** - don't use `allow_origins=["*"]` in production

---

## Quick Deploy Commands

### Deploy Frontend (Vercel CLI)
```bash
cd frontend
vercel --prod
```

### Deploy Backend (Railway CLI)
```bash
cd backend
railway up
```

### Verify Deployment
```bash
# Frontend health check
curl https://your-app.vercel.app

# Backend health check
curl https://your-backend-url.com/docs
```

---

## Support & Resources

- Next.js Docs: https://nextjs.org/docs
- Vercel Docs: https://vercel.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com
- Railway Docs: https://docs.railway.app
- MongoDB Atlas: https://www.mongodb.com/docs/atlas
