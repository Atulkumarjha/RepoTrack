# Deploy Backend to Vercel (Alternative)

## ⚠️ Important Limitations

Vercel serverless functions have constraints:
- **10-second timeout** on Hobby plan (60s on Pro)
- **No persistent WebSocket connections** (WS features won't work)
- **Cold starts** (~1-2 seconds for Python)
- Best for **stateless REST APIs only**

**Recommendation:** Use Railway/Render for full feature support (WebSockets, long-running webhooks).

---

## 📋 What Works on Vercel
✅ GitHub OAuth login  
✅ REST API endpoints (repos, activities, integrations)  
✅ GitHub webhook receiver (if < 10s processing)  
✅ Discord/Slack notifications  

## ❌ What Doesn't Work
❌ WebSocket real-time updates (`/ws/activities`)  
❌ Long-running webhook processing  
❌ Background tasks  

---

## 🚀 Deploy Backend to Vercel

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy Backend
```bash
cd backend
vercel
```

### 3. Add Environment Variables in Vercel Dashboard

Go to Vercel Project Settings → Environment Variables:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/repotrack?retryWrites=true&w=majority
MONGO_DB_NAME=repotrack
GITHUB_CLIENT_ID=Ov23liP9pwRGJaKgV1U2
GITHUB_CLIENT_SECRET=c8cf3f09ee4c26009b2607b07cad4130b5911432
GITHUB_WEBHOOK_SECRET=supersecret
BACKEND_BASE_URL=https://your-backend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
```

**Important:** Use MongoDB Atlas (cloud) for `MONGO_URI`, not localhost!

### 4. Redeploy
After adding environment variables, trigger a new deployment:
```bash
vercel --prod
```

---

## 🔧 Frontend Configuration

Update frontend environment variables to point to Vercel backend:

**Vercel Dashboard → Frontend Project → Settings → Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend.vercel.app
```

Then redeploy frontend.

---

## 🗄️ MongoDB Setup (Required)

Vercel doesn't provide MongoDB. Use **MongoDB Atlas**:

1. Create free cluster at https://cloud.mongodb.com
2. Create database user
3. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
4. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/repotrack?retryWrites=true&w=majority
   ```
5. Add as `MONGO_URI` in Vercel environment variables

---

## ✅ Post-Deployment Verification

### Test Backend API
```bash
# Health check
curl https://your-backend.vercel.app

# API docs (Swagger)
open https://your-backend.vercel.app/docs
```

### Test OAuth Flow
1. Visit frontend: `https://your-frontend.vercel.app`
2. Click "Continue with GitHub"
3. Should redirect to GitHub → back to your app
4. Check browser console for errors

### Test GitHub Webhooks
1. Connect a repository
2. Push a commit
3. Check Vercel backend logs for webhook delivery
4. Note: If processing takes >10s, it will timeout

---

## 🐛 Troubleshooting

### Cold Start Delays
**Issue:** First request takes 2-3 seconds  
**Solution:** This is normal for serverless. Subsequent requests are faster.

### 504 Gateway Timeout
**Issue:** Function execution exceeded 10 seconds  
**Solution:** 
- Optimize slow database queries
- Upgrade to Vercel Pro (60s timeout)
- Or migrate to Railway/Render for no timeout limits

### WebSocket Connection Failed
**Issue:** `wss://your-backend.vercel.app/ws/...` doesn't connect  
**Solution:** Vercel doesn't support WebSockets. Deploy to Railway/Render for WS support.

### CORS Errors
**Issue:** Frontend can't reach backend  
**Solution:**
- Verify `FRONTEND_URL` is set correctly in backend env vars
- Check browser console for exact CORS error
- Ensure backend is redeployed after adding env vars

### MongoDB Connection Failed
**Issue:** Can't connect to MongoDB  
**Solution:**
- Verify `MONGO_URI` format is correct
- Check MongoDB Atlas IP whitelist (use `0.0.0.0/0`)
- Test connection string locally first

---

## 📊 Comparison: Vercel vs Railway

| Feature | Vercel | Railway |
|---------|--------|---------|
| **Deployment** | 1 command | 1 command |
| **Cold starts** | Yes (~2s) | No |
| **Timeout** | 10s (Hobby) | No limit |
| **WebSockets** | ❌ No | ✅ Yes |
| **Background jobs** | ❌ No | ✅ Yes |
| **Cost (Hobby)** | Free | ~$5/mo |
| **MongoDB included** | No | Yes (addon) |
| **Best for** | Simple APIs | Full-featured apps |

---

## 🎯 Recommended Setup

### Option 1: All Vercel (Simpler, Limited)
- **Frontend:** Vercel
- **Backend:** Vercel (REST API only)
- **Database:** MongoDB Atlas
- **Limitation:** No WebSocket real-time updates

### Option 2: Hybrid (Full Features)
- **Frontend:** Vercel
- **Backend:** Railway/Render
- **Database:** Railway MongoDB or Atlas
- **Benefit:** WebSockets, no timeouts, background tasks

### Option 3: Both on Railway (Simplest)
- **Frontend:** Railway (supports Next.js)
- **Backend:** Railway
- **Database:** Railway MongoDB
- **Benefit:** Single platform, integrated MongoDB, easy env vars

---

## 🚀 Quick Commands

### Deploy Both to Vercel
```bash
# Backend
cd backend
vercel --prod

# Frontend  
cd ../frontend
vercel --prod
```

### Check Deployment Status
```bash
vercel ls
```

### View Logs
```bash
vercel logs <deployment-url>
```

### Roll Back
```bash
vercel rollback
```

---

## 📚 Resources

- Vercel Python Docs: https://vercel.com/docs/functions/serverless-functions/runtimes/python
- FastAPI on Vercel: https://vercel.com/guides/using-fastapi-with-vercel
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/getting-started/
- Railway Guide: https://docs.railway.app/getting-started

---

## 💡 My Recommendation

If you need **full RepoTrack features** (real-time activity feed, WebSockets):
→ **Use Railway for backend** (see DEPLOYMENT.md)

If you only need **basic GitHub tracking** without real-time updates:
→ **All Vercel deployment works fine**

Choose based on your needs! 🎯
