# 🚀 RepoTrack Production Deployment Configuration

## Your Deployment URLs
- **Frontend (Vercel):** https://repo-track.vercel.app
- **Backend (Render):** https://repotrack.onrender.com

---

## ✅ Step 1: Configure Backend Environment Variables (Render)

Go to: **Render Dashboard** → **repotrack service** → **Environment** tab

Add these environment variables:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/repotrack?retryWrites=true&w=majority
MONGO_DB_NAME=repotrack
GITHUB_CLIENT_ID=Ov23liP9pwRGJaKgV1U2
GITHUB_CLIENT_SECRET=c8cf3f09ee4c26009b2607b07cad4130b5911432
GITHUB_WEBHOOK_SECRET=supersecret
SECRET_KEY=replace_with_a_long_random_secret
ACCESS_TOKEN_EXPIRE_MINUTES=43200
BACKEND_BASE_URL=https://repotrack.onrender.com
FRONTEND_URL=https://repo-track.vercel.app
CORS_ORIGINS=
```

### ⚠️ MongoDB Atlas Setup Required

Render doesn't provide MongoDB. Set up MongoDB Atlas (free):

1. Go to https://cloud.mongodb.com
2. Create free cluster (M0 Sandbox)
3. Create database user (username + password)
4. Network Access → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)
5. Get connection string:
   - Click **Connect** → **Connect your application**
   - Copy connection string
   - Replace `<username>` and `<password>` with your credentials
   - Example: `mongodb+srv://myuser:mypass123@cluster0.abc123.mongodb.net/repotrack?retryWrites=true&w=majority`

After adding all variables, Render will automatically redeploy.

---

## ✅ Step 2: Configure Frontend Environment Variables (Vercel)

Go to: **Vercel Dashboard** → **repo-track project** → **Settings** → **Environment Variables**

Add these variables (for **Production**, **Preview**, and **Development**):

```env
NEXT_PUBLIC_API_URL=https://repotrack.onrender.com
NEXT_PUBLIC_FRONTEND_URL=https://repo-track.vercel.app
```

**Important:** After adding variables:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **⋯** (three dots) → **Redeploy**
4. Check "Use existing Build Cache" → **Redeploy**

---

## ✅ Step 3: Update GitHub OAuth App

Go to: https://github.com/settings/developers

Find your OAuth App and update:

### Homepage URL:
```
https://repo-track.vercel.app
```

### Authorization callback URL:
```
https://repotrack.onrender.com/auth/github/callback
```

Click **Update application**

---

## ✅ Step 4: Test Your Deployment

### 4.1 Backend Health Check
```bash
curl https://repotrack.onrender.com/
```
Expected: `{"status":"ok"}`

### 4.2 Backend API Docs
Open in browser: https://repotrack.onrender.com/docs

Should show FastAPI Swagger UI.

### 4.3 Frontend Access
Open: https://repo-track.vercel.app

Should load the login page.

### 4.4 Test OAuth Flow
1. Click **"Continue with GitHub"**
2. Authorize on GitHub
3. Should redirect back to https://repo-track.vercel.app/repositories
4. Check browser console for any errors (F12 → Console)

### 4.5 Connect a Repository
1. Select a repository
2. Click **Connect**
3. Should navigate to dashboard
4. Check if GitHub webhook was created (repo Settings → Webhooks)

### 4.6 Test Webhook
1. Push a commit to connected repo
2. Check activity feed in dashboard
3. If Discord webhook configured, check Discord channel

---

## 🐛 Troubleshooting

### Backend Shows "Application Failed to Respond"
**Issue:** Backend crashed or MongoDB connection failed

**Check:**
```bash
# View Render logs
# Go to Render Dashboard → repotrack → Logs tab
```

Common causes:
- `MONGO_URI` incorrect format
- MongoDB Atlas IP not whitelisted
- Missing environment variables

**Fix:** Verify all env vars are set correctly, check MongoDB Atlas connection.

---

### Frontend Shows 401 Unauthorized
**Issue:** Frontend can't authenticate with backend

**Check:**
1. Browser DevTools → Network tab
2. Look for failed API calls to `https://repotrack.onrender.com`
3. Check CORS errors in console

**Fix:**
- Verify `NEXT_PUBLIC_API_URL` is set in Vercel
- Verify `FRONTEND_URL` is set in Render backend
- Redeploy both services after adding env vars

---

### OAuth Redirect Fails
**Issue:** After GitHub auth, stuck on "Signing you in…" or 404

**Check:**
1. GitHub OAuth app settings match exactly
2. Backend `/auth/github/callback` endpoint works:
   ```bash
   curl https://repotrack.onrender.com/auth/github/login
   ```

**Fix:**
- Update GitHub OAuth callback URL to `https://repotrack.onrender.com/auth/github/callback`
- Verify `FRONTEND_URL=https://repo-track.vercel.app` in backend env vars

---

### Activity Feed is Blank
**Issue:** No activities showing up

**Possible causes:**
1. **No webhook events yet** - Push a commit to trigger webhook
2. **Webhook not created** - Check repo Settings → Webhooks
3. **Webhook failing** - Check Render logs for webhook receiver errors

**Check webhook deliveries:**
- Go to GitHub repo → Settings → Webhooks
- Click on webhook URL
- Check "Recent Deliveries" tab
- Should show 200 OK responses

---

### Render Free Tier Spin Down
**Issue:** Backend takes 30+ seconds to respond

**Cause:** Render free tier spins down after 15 minutes of inactivity (cold start ~30s)

**Solutions:**
1. Upgrade to paid tier ($7/mo) - no spin down
2. Use a service like UptimeRobot to ping backend every 10 minutes
3. Accept cold starts (first request slow, subsequent fast)

---

## 📊 Monitoring

### Render Logs
```
Render Dashboard → repotrack → Logs
```
Watch for:
- Startup success messages
- MongoDB connection confirmed
- Webhook receiver hits
- Any Python errors

### Vercel Logs
```
Vercel Dashboard → repo-track → Logs
```
Watch for:
- Build success
- Runtime errors
- API call failures

### MongoDB Atlas Monitoring
```
MongoDB Atlas → Cluster → Metrics
```
Watch for:
- Connection count
- Operations per second
- Database size

---

## 🔒 Security Checklist

Before going live:
- [ ] Set a strong `SECRET_KEY` in Render environment variables
- [ ] Rotate Discord webhook URL (was exposed in chat)
- [ ] Set strong MongoDB Atlas password
- [ ] Review CORS settings - ensure only your frontend URL is allowed
- [ ] Enable GitHub webhook secret verification
- [ ] Set up SSL/HTTPS (Vercel and Render provide this automatically)

---

## 🎯 Quick Verification Checklist

Run through this list to verify everything works:

- [ ] Backend API docs accessible: https://repotrack.onrender.com/docs
- [ ] Frontend loads: https://repo-track.vercel.app
- [ ] Click "Continue with GitHub" - redirects to GitHub
- [ ] After GitHub auth - redirects back to /repositories page
- [ ] Repository list loads (no 401 errors)
- [ ] Can connect a repository
- [ ] GitHub webhook created in repo settings
- [ ] Push a commit - activity appears in dashboard
- [ ] Discord notification received (if configured)
- [ ] WebSocket real-time updates work (Render supports WebSockets)

---

## 🚀 Next Steps

Once everything is working:

1. **Set up Discord/Slack notifications**
   - Dashboard → Integrations
   - Add webhook URLs

2. **Monitor GitHub webhook deliveries**
   - Repo Settings → Webhooks → Recent Deliveries
   - All should show 200 OK

3. **Test with multiple repositories**
   - Connect 2-3 repos
   - Verify switching between them works

4. **Share with team**
   - Invite collaborators to GitHub repos
   - They can use the same RepoTrack instance

---

## 📞 Support Resources

- Render Status: https://status.render.com
- Vercel Status: https://www.vercel-status.com
- MongoDB Atlas Support: https://www.mongodb.com/docs/atlas

---

**Your RepoTrack is now deployed! 🎉**

Test the OAuth flow first, then try connecting a repository.
