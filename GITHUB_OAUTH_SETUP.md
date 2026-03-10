# GitHub OAuth App Setup Guide

## Step 1: Go to GitHub Developer Settings

1. Open your browser
2. Go to: **https://github.com/settings/developers**
3. Click **"OAuth Apps"** in the left sidebar
4. Look for an existing app with Client ID: `Ov23liP9pwRGJaKgV1U2`

---

## Step 2: If App Already Exists

If you see the app:
1. Click on the app name
2. **Update these settings:**

   - **Application name:** RepoTrack (or any name you want)
   - **Homepage URL:** `http://localhost:3000` (for now - update after deployment)
   - **Authorization callback URL:** `http://localhost:8000/auth/github/callback` (for now - update after deployment)

3. Click **"Update application"**

---

## Step 3: If App Doesn't Exist (Create New)

If you don't see the app:
1. Click **"New OAuth App"** (top right)
2. Fill in:
   - **Application name:** RepoTrack
   - **Homepage URL:** `http://localhost:3000`
   - **Application description:** (optional) "GitHub repository activity tracker"
   - **Authorization callback URL:** `http://localhost:8000/auth/github/callback`

3. Click **"Register application"**
4. You'll see your **Client ID** (copy it)
5. Click **"Generate a new client secret"**
6. Copy the **Client Secret** (shown only once!)
7. Update your `.env` file with the new Client ID and Secret

---

## Step 4: After Deploying to Render + Vercel

Once you have your deployment URLs, **update the OAuth app**:

1. Go back to: https://github.com/settings/developers
2. Click on your OAuth app
3. Update:
   - **Homepage URL:** `https://repo-track.vercel.app` (your Vercel URL)
   - **Authorization callback URL:** `https://repotrack.onrender.com/auth/github/callback` (your Render URL)
4. Click **"Update application"**

---

## Current Settings in Your .env

```env
GITHUB_CLIENT_ID=Ov23liP9pwRGJaKgV1U2
GITHUB_CLIENT_SECRET=c8cf3f09ee4c26009b2607b07cad4130b5911432
```

If these are correct, you're good to go! Just make sure the callback URL matches.

---

## Troubleshooting

**Issue:** Can't access GitHub settings page

**Solutions:**
- Make sure you're logged into GitHub
- Try: https://github.com/settings/applications
- Or: Click your profile picture (top right) → Settings → Developer settings → OAuth Apps

**Issue:** "Application not found" when logging in

**Cause:** Callback URL mismatch

**Fix:** Make sure Authorization callback URL in GitHub exactly matches:
- Local dev: `http://localhost:8000/auth/github/callback`
- Production: `https://<your-render-url>/auth/github/callback`

---

## Quick Test (Local)

1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Open: http://localhost:3000/login
4. Click "Continue with GitHub"
5. Should redirect to GitHub, then back to your app

If it works locally, it will work in production after updating the URLs!
