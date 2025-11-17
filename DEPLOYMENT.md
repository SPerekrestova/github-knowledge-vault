# Deployment Guide - Free Hosting

## ⚠️ Important: MCP Server Required

This application uses a **3-tier MCP architecture** that requires:
1. **Frontend** (React)
2. **MCP Bridge** (FastAPI)
3. **MCP Server** (FastMCP) ← **Must be included!**

📚 **[Read MCP Server Deployment Guide](./MCP_DEPLOYMENT.md)** for detailed instructions on bundling MCP Server with your deployment.

**Quick Summary:** You need to either:
- Copy MCP Server into `mcp-server/` directory in this repo, OR
- Add MCP Server as a git submodule, OR
- Download it during build

---

## 🎯 Quick Deploy to Render (Free)

### Prerequisites
- GitHub account
- Render account (free): https://render.com
- **MCP Server in your repository** (see [MCP_DEPLOYMENT.md](./MCP_DEPLOYMENT.md))

### 1. Deploy Backend (MCP Bridge + MCP Server)

**Via Render Dashboard:**

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository: `SPerekrestova/github-knowledge-vault`
4. Configure:
   ```
   Name: github-knowledge-vault-bridge
   Root Directory: mcp-bridge
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: python main.py
   Plan: Free
   ```

5. **Environment Variables:**
   ```
   GITHUB_TOKEN=your_github_personal_access_token
   GITHUB_ORGANIZATION=SPerekrestova
   PORT=10000
   HOST=0.0.0.0
   CACHE_TTL_SECONDS=300
   CACHE_ENABLED=true
   CORS_ORIGINS=*
   LOG_LEVEL=INFO
   ```

6. Click **"Create Web Service"**
7. Wait for deployment (~5 minutes)
8. Copy your service URL: `https://your-service.onrender.com`

### 2. Deploy Frontend (React App)

**Via Render Dashboard:**

1. Click **"New +"** → **"Static Site"**
2. Connect same GitHub repository
3. Configure:
   ```
   Name: github-knowledge-vault
   Root Directory: (leave empty)
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **Environment Variables:**
   ```
   VITE_MCP_BRIDGE_URL=https://your-bridge-service.onrender.com
   VITE_GITHUB_ORGANIZATION=SPerekrestova
   ```

5. Click **"Create Static Site"**
6. Wait for deployment (~3 minutes)
7. Your app is live! 🎉

### 3. Access Your App

- **Frontend:** `https://github-knowledge-vault.onrender.com`
- **Backend API:** `https://github-knowledge-vault-bridge.onrender.com`
- **Health Check:** `https://github-knowledge-vault-bridge.onrender.com/health`

---

## 🔧 Alternative: Vercel (Frontend) + Render (Backend)

### Deploy Frontend to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
cd /home/user/github-knowledge-vault
vercel

# Add environment variables
vercel env add VITE_MCP_BRIDGE_URL production
# Enter: https://your-bridge.onrender.com

vercel env add VITE_GITHUB_ORGANIZATION production
# Enter: SPerekrestova

# Deploy to production
vercel --prod
```

**Result:**
- Frontend: `https://github-knowledge-vault.vercel.app` (faster)
- Backend: `https://your-bridge.onrender.com` (free)

---

## 🐳 Alternative: Railway (Full Stack)

### Deploy via Railway:

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose `SPerekrestova/github-knowledge-vault`
5. Railway will auto-detect Docker Compose
6. Add environment variables in dashboard
7. Deploy! 🚀

**Note:** Railway provides $5/month free credits (not unlimited)

---

## 📊 Free Tier Limitations

### Render Free Tier:
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Free PostgreSQL (90 days retention)
- ⚠️ Services spin down after 15 min inactivity
- ⚠️ Cold start: ~30 seconds to wake up
- ⚠️ 750 hours/month compute time

### Vercel Free Tier:
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS & CDN
- ✅ No cold starts
- ⚠️ Serverless function timeout: 10s

### Railway Free Tier:
- ⚠️ $5/month credits (runs out)
- ✅ No cold starts
- ✅ Better performance
- ✅ PostgreSQL included

---

## 🔍 Testing Your Deployment

### 1. Test Backend Health:
```bash
curl https://your-bridge.onrender.com/health
# Expected: {"status":"ok","cache_size":0,"mcp_connected":false}
```

### 2. Test Repository Endpoint:
```bash
curl https://your-bridge.onrender.com/api/repos
# Expected: [{"id":"...","name":"...","hasDocFolder":true}]
```

### 3. Test Frontend:
- Open: `https://your-frontend.onrender.com`
- Check: DevTools → Console (should see MCP logs)
- Check: DevTools → Network (requests to bridge URL)

---

## 🚨 Troubleshooting

### Backend takes 30s to respond:
**Cause:** Free tier service spun down
**Solution:** This is normal on Render free tier. First request wakes it up.

### CORS errors:
**Cause:** Frontend URL not in CORS_ORIGINS
**Solution:** Update CORS_ORIGINS in backend to include your frontend URL:
```
CORS_ORIGINS=https://your-frontend.onrender.com,*
```

### Build fails:
**Cause:** Missing environment variables
**Solution:** Double-check all environment variables are set in Render dashboard

### MCP Server not connected:
**Cause:** MCP Server needs separate implementation
**Solution:** This is expected - endpoints will return 503 until MCP Server is running

---

## 💡 Recommended Setup

**For Testing (Free Forever):**
```
Frontend: Render Static Site (fast enough)
Backend: Render Web Service (free)
Trade-off: 30s cold start acceptable for testing
```

**For Better Performance:**
```
Frontend: Vercel (no cold starts, CDN)
Backend: Render Web Service (free)
Trade-off: Mixed platforms, but better UX
```

**For Production:**
```
Consider Railway ($5/month) or upgrade Render to paid tier
No cold starts, better reliability
```

---

## 🎉 Success!

Once deployed, your architecture looks like:

```
User Browser
    ↓
Vercel/Render Frontend (Static Site)
    ↓ (HTTPS)
Render Backend (MCP Bridge)
    ↓
MCP Server (embedded)
    ↓
GitHub API
```

All hosted for **FREE** and accessible from anywhere! 🌍
