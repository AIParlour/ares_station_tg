# Ares Station — Deployment Guide

Free stack: **Render** (compute) + **Neon** (PostgreSQL). No credit card needed.

---

## 1. Create Neon Database (free, 0.5 GB)

1. Go to [neon.tech](https://neon.tech) → Sign up with GitHub or Google
2. Create a new project → name it `ares-station`
3. Copy the **connection string** — it looks like:
   ```
   postgresql://user:password@ep-something.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep this — you'll paste it into Render.

---

## 2. Push Code to GitHub

Render deploys from a Git repo. If you haven't already:

```bash
cd poc
git init
git add -A
git commit -m "Initial deploy"
```

Create a repo on GitHub (public or private) and push:

```bash
git remote add origin https://github.com/YOUR_USER/ares-station.git
git branch -M main
git push -u origin main
```

---

## 3. Deploy on Render (free tier)

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **New → Web Service**
3. Connect your GitHub repo (`ares-station`)
4. Render will detect `render.yaml` — or configure manually:

   | Setting | Value |
   |---|---|
   | **Name** | `ares-station` |
   | **Region** | Frankfurt (EU) |
   | **Branch** | `main` |
   | **Runtime** | Node |
   | **Build Command** | `npm run build:production` |
   | **Start Command** | `npm run db:migrate && npm run db:seed && npm start` |
   | **Plan** | Free |

5. Add **Environment Variables**:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `NPM_CONFIG_PRODUCTION` | `false` *(needed so tsx is available for DB seed)* |
   | `DATABASE_URL` | *(paste your Neon connection string)* |
   | `JWT_SECRET` | *(any random string, e.g. `openssl rand -hex 32`)* |
   | `BOT_TOKEN` | *(your Telegram bot token from BotFather)* |
   | `FRONTEND_URL` | *(leave blank for now, set after first deploy)* |

6. Click **Create Web Service** → wait for build (~2-4 min)

7. Your URL will be: `https://ares-station.onrender.com`  
   Go back and set `FRONTEND_URL` to this URL.

---

## 4. Register Telegram Mini App

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. `/mybots` → select your bot → **Bot Settings** → **Menu Button**
   - Set URL to: `https://ares-station.onrender.com`
3. Or set a Web App button:
   - `/mybots` → your bot → **Bot Settings** → **Menu Button** → set URL

Your Render URL is the link you give Telegram for the Mini App.

---

## 5. Verify

- Health check: `https://ares-station.onrender.com/api/health`
- Open the Mini App from your Telegram bot
- First load may take ~30s (Render free tier cold starts)

---

## Notes

- **Cold starts**: Render free tier sleeps after 15 min of inactivity. First request takes ~30s to wake up. Subsequent requests are fast.
- **Neon free tier**: 0.5 GB storage, auto-suspend after 5 min idle, wakes on connection (~1-2s).
- **Re-deploy**: Push to `main` → Render auto-deploys.
- **Seed data**: The start command runs migrations + seed automatically on each deploy.
- **Logs**: Render dashboard → your service → Logs tab.
