# Deploy FinTrack to Vercel (step by step)

FinTrack is a **monorepo** with three parts:

| Part | Tech | Where to host |
|------|------|----------------|
| **Web** | Next.js | **Vercel** |
| **API** | Express + Prisma | Railway, Render, Fly.io, or a VPS (not Vercel) |
| **Database** | PostgreSQL | Neon, Supabase, or Railway Postgres |

Vercel runs the frontend. The API must run somewhere else as a **long-lived Node server** (sessions, file uploads, Prisma, background jobs).

---

## Before you start

- GitHub (or GitLab/Bitbucket) repo with this project pushed
- [Vercel](https://vercel.com) account
- [Neon](https://neon.tech) or another PostgreSQL provider (free tier is fine)
- [Railway](https://railway.app) or [Render](https://render.com) account for the API (free/low-cost tier)

**Recommended domains (important for login cookies):**

- Web: `https://app.yourdomain.com` → Vercel
- API: `https://api.yourdomain.com` → Railway/Render

Using `app.yourdomain.com` + `api.yourdomain.com` keeps auth cookies working (`SameSite=Lax`).  
Avoid pairing `*.vercel.app` with `*.railway.app` unless you change cookie settings in the API.

---

## Step 1 — Create PostgreSQL

### Option A: Neon (recommended)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **connection string** (pooled URL is fine), e.g.  
   `postgresql://user:pass@ep-xxx.region.aws.neon.tech/fintrack?sslmode=require`
3. Keep it safe — you will use it as `DATABASE_URL`.

### Option B: Supabase / Railway Postgres

Create a PostgreSQL instance and copy its connection string the same way.

---

## Step 2 — Deploy the API

The web app calls the API using `NEXT_PUBLIC_API_URL`. Deploy the API **before** Vercel.

### Option A: Railway (Docker)

1. **New project** → **Deploy from GitHub repo** → select this repository.
2. Add a **service** using the Dockerfile:
   - **Root directory:** repository root
   - **Dockerfile path:** `api/Dockerfile`
3. Add **environment variables** (Railway → Variables):

   | Variable | Example |
   |----------|---------|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `DATABASE_URL` | your Neon connection string |
   | `SESSION_SECRET` | long random string (32+ chars) |
   | `APP_URL` | `https://app.yourdomain.com` |
   | `WEB_ORIGIN` | `https://app.yourdomain.com` |
   | `API_URL` | `https://api.yourdomain.com` |
   | `BKASH_PAYMENT_NUMBER` | `01XXXXXXXXX` (optional) |
   | `ADMIN_EMAIL` | `admin@yourdomain.com` |
   | `ADMIN_PASSWORD` | strong password |

4. Deploy. The Docker image runs `prisma migrate deploy` then starts the server.
5. Open **Settings → Networking → Generate domain** or add custom domain `api.yourdomain.com`.
6. Verify: visit  
   `https://api.yourdomain.com/api/v1/health`  
   You should see: `{"success":true,"data":{"status":"ok"}}`

### Option B: Render

1. **New → Web Service** → connect repo.
2. **Root directory:** leave as repo root.
3. **Runtime:** Docker, Dockerfile path `api/Dockerfile`.
4. Set the same environment variables as above.
5. Add custom domain and test `/api/v1/health`.

### Seed plans & admin (first time only)

From your machine (with `DATABASE_URL` pointing at production):

```bash
pnpm install
pnpm db:generate
cd api
DATABASE_URL="your-production-url" pnpm db:seed
```

This creates Free/Pro plans, ad plans, and the super admin user.

---

## Step 3 — Deploy the web app to Vercel

### 3.1 Import the project

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import** your Git repository.
3. Configure the project:

   | Setting | Value |
   |---------|--------|
   | **Framework Preset** | Next.js |
   | **Root Directory** | `web` |
   | **Node.js Version** | 20.x |

4. **Build & Development Settings** (expand):

   | Setting | Value |
   |---------|--------|
   | **Install Command** | `cd .. && pnpm install` |
   | **Build Command** | `cd .. && pnpm --filter @fintrack/shared build && pnpm --filter @fintrack/web build` |
   | **Output Directory** | leave default (`.next`) |

   > If you use the included `web/vercel.json`, Vercel may pick these up automatically.

### 3.2 Environment variables (Vercel)

In **Project → Settings → Environment Variables**, add:

| Name | Value | Environments |
|------|--------|--------------|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api/v1` | Production, Preview, Development |

Use your real API URL. It **must** end with `/api/v1`.

### 3.3 Deploy

1. Click **Deploy**.
2. Wait for the build to finish.
3. Open the Vercel URL (e.g. `https://fintrack-xxx.vercel.app`).

### 3.4 Custom domain (recommended)

1. Vercel → **Settings → Domains** → add `app.yourdomain.com`.
2. Add the DNS records Vercel shows (usually `CNAME` to `cname.vercel-dns.com`).
3. Update API env vars if you changed URLs:
   - `APP_URL=https://app.yourdomain.com`
   - `WEB_ORIGIN=https://app.yourdomain.com`
4. **Redeploy** the API after changing CORS origins.

---

## Step 4 — Post-deploy checklist

- [ ] API health: `GET /api/v1/health` returns `ok`
- [ ] Register a test user on the web app
- [ ] Login works (if not, check domains & `WEB_ORIGIN` — see Troubleshooting)
- [ ] Admin login at `/admin` with your seeded super admin
- [ ] **Admin → Settings** → set bKash payment number for Pro upgrades
- [ ] Approve a test payment under **Admin → Payments**

---

## Step 5 — Ongoing deploys

| Change | What happens |
|--------|----------------|
| Push to `main` | Vercel redeploys web automatically |
| API code change | Railway/Render redeploys API (auto if CI enabled) |
| Prisma schema change | Run `pnpm db:deploy` against production DB, then redeploy API |

Production migration (from your machine):

```bash
DATABASE_URL="your-production-url" pnpm db:deploy
```

---

## Environment variable reference

### Web (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Public API base URL, e.g. `https://api.yourdomain.com/api/v1` |

### API (Railway / Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Random secret for session cookies |
| `WEB_ORIGIN` | Yes | Exact web origin, e.g. `https://app.yourdomain.com` |
| `APP_URL` | Yes | Same as web URL (used in emails/links) |
| `API_URL` | Yes | Public API URL, e.g. `https://api.yourdomain.com` |
| `BKASH_PAYMENT_NUMBER` | No | Fallback bKash number (admin can override in dashboard) |
| `ADMIN_EMAIL` | No | Used only when running `db:seed` |
| `ADMIN_PASSWORD` | No | Used only when running `db:seed` |

See also: `api/.env.production.example`

---

## Troubleshooting

### “Cannot reach the API” on the web app

- Confirm `NEXT_PUBLIC_API_URL` is set on Vercel and ends with `/api/v1`.
- Redeploy Vercel after changing env vars (client bundle bakes in `NEXT_PUBLIC_*`).
- Check API health URL in the browser.

### Login succeeds locally but not in production

- `WEB_ORIGIN` on the API must **exactly** match the web URL (scheme + host, no trailing slash).
- Prefer `app.yourdomain.com` + `api.yourdomain.com` on the same domain.
- API must be served over **HTTPS** in production (`secure` cookies).

### CORS errors

- Set `WEB_ORIGIN` to the exact frontend origin.
- Redeploy the API after updating env vars.

### Build fails on Vercel (“Cannot find @fintrack/shared”)

- Root Directory must be `web`.
- Install/build commands must run from repo root (see Step 3.1).
- Ensure `pnpm-lock.yaml` is committed.

### Prisma / database errors on API start

- Check `DATABASE_URL` and SSL (`?sslmode=require` for Neon).
- Run `pnpm db:deploy` manually if migrations did not apply.

---

## Alternative: full stack with Docker

If you prefer one server instead of Vercel + Railway:

```bash
# Set env vars in a .env file next to docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d --build
```

See `docker-compose.prod.yml`. This runs Postgres + API + web on your VPS; use a reverse proxy (Caddy/Nginx) for HTTPS.

---

## Quick reference

```text
User browser
    ↓
https://app.yourdomain.com     (Vercel — Next.js web)
    ↓ NEXT_PUBLIC_API_URL
https://api.yourdomain.com     (Railway — Express API)
    ↓ DATABASE_URL
PostgreSQL                     (Neon)
```

For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).
