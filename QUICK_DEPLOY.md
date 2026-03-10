# RepoTrack - Quick Deploy to Vercel

## ✅ Frontend Build Ready
Your frontend builds successfully and is Vercel-ready!

## 🚀 Deploy Now (3 steps)

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy Frontend
```bash
cd frontend
vercel
```
Follow prompts → Deploy!

### 3. Add Environment Variables in Vercel Dashboard

After deployment, add these in Vercel Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
```

Then **redeploy** from Vercel dashboard.

---

## 📋 What Changed

✅ All hardcoded `localhost` URLs replaced with environment variables  
✅ Created centralized config in `src/lib/config.ts`  
✅ WebSocket connections now use configurable backend URL  
✅ Backend redirects now use `FRONTEND_URL` env var  
✅ Added `vercel.json` with optimal Next.js settings  
✅ Frontend build verified and passing  

---

## ⚙️ Backend Deployment

You'll also need to deploy your backend publicly (Railway/Render/AWS):

**Backend Environment Variables Required:**
```env
MONGO_URI=<your-mongodb-connection-string>
MONGO_DB_NAME=repotrack
GITHUB_CLIENT_ID=Ov23liP9pwRGJaKgV1U2
GITHUB_CLIENT_SECRET=c8cf3f09ee4c26009b2607b07cad4130b5911432
GITHUB_WEBHOOK_SECRET=supersecret
BACKEND_BASE_URL=https://your-backend-url.com
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Railway (Recommended):**
```bash
cd backend
railway init
railway add mongodb
railway up
```

---

## 🔧 Update GitHub OAuth App

After deployment, update your GitHub OAuth settings:

1. Go to: https://github.com/settings/developers
2. Select your app (Client ID: `Ov23liP9pwRGJaKgV1U2`)
3. Update:
   - **Homepage URL**: `https://your-app.vercel.app`
   - **Authorization callback URL**: `https://your-backend-url.com/auth/github/callback`

---

## 📖 Full Guide

See **DEPLOYMENT.md** for complete step-by-step instructions, troubleshooting, and security notes.

---

## ✨ Build Commands

```bash
# Frontend
cd frontend
npm install
npm run build    # Production build
npm run dev      # Local development

# Backend
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # Local dev
```

---

## 🎯 Quick Test After Deploy

1. Visit your Vercel URL
2. Click "Continue with GitHub"
3. Authorize app
4. Connect a repository
5. Push a commit → check Activity Feed!

Need help? Check DEPLOYMENT.md for troubleshooting.
