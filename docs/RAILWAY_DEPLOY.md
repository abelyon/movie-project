# Railway Deployment Guide

This project is a monorepo with:

- `backend` (Laravel API)
- `frontend` (React + Vite SPA)

Deploy them as **two Railway services** in one Railway project.

## 1) Push code to GitHub

Railway deploys from a GitHub repo. Make sure your current branch is pushed.

## 2) Create a Railway project

1. In Railway, click **New Project**.
2. Choose **Deploy from GitHub repo** and select this repository.
3. Add **3** services from the same repo:
  - **API** — root directory: `backend` (Laravel HTTP API; use your usual PHP/Railpack or Dockerfile flow).
  - **Frontend** — root directory: `frontend` (Vite build).
  - **Reverb** — root directory: `backend`, with Docker build from **`Dockerfile.reverb`** (WebSocket server; see below).

This repo does **not** use Nixpacks config files in-repo. Railway infers build and start from each root. For **Reverb**, point the service at **`backend/Dockerfile.reverb`** (in the dashboard: set **Dockerfile path** to `Dockerfile.reverb` with root `backend`) so the image includes **`pcntl`** and runs `php artisan reverb:start` bound to Railway’s **`PORT`**. For the API and frontend, set **Build Command**, **Start Command**, or **Release Command** (for migrations) in that service’s **Settings** if needed—for example a backend release: `php artisan migrate --force`.

## 3) Add a MySQL database

1. In Railway, add **MySQL** plugin/service.
2. Copy its connection values into backend environment variables.

## 4) Configure backend environment variables

Set these on the `backend` Railway service:

- `APP_NAME=SeeIt` (or your app name)
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=<generate with: php artisan key:generate --show>`
- `APP_URL=https://<your-backend-domain>`
- `FRONTEND_URL=https://<your-frontend-domain>`
- `SANCTUM_STATEFUL_DOMAINS=<your-frontend-domain-without-https>`
- `SESSION_DRIVER=database`
- `CACHE_STORE=database`
- `QUEUE_CONNECTION=database`
- `DB_CONNECTION=mysql`
- `DB_HOST=<from Railway MySQL>`
- `DB_PORT=<from Railway MySQL>`
- `DB_DATABASE=<from Railway MySQL>`
- `DB_USERNAME=<from Railway MySQL>`
- `DB_PASSWORD=<from Railway MySQL>`
- `TMDB_API_KEY=<your tmdb key>`
- `TMDB_URL=https://api.themoviedb.org/3`

Realtime (must match the **Reverb** service and the **frontend** build):

- `BROADCAST_CONNECTION=reverb`
- `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` — generate strong values; use the **same three** on the API, on the Reverb container, and expose the key to the frontend as `VITE_REVERB_APP_KEY` at build time.
- `REVERB_HOST` — **public hostname** of the Reverb service only (no `https://`), e.g. `your-reverb.up.railway.app`.
- `REVERB_PORT=443` and `REVERB_SCHEME=https` in production so browsers use **`wss`**.
- `REVERB_SERVER_HOST=0.0.0.0` on the Reverb service. Prefer letting the start command use Railway’s **`PORT`** (the `Dockerfile.reverb` `CMD` passes `--port=${PORT:-8080}`).

Optional but recommended:

- `SESSION_SECURE_COOKIE=true`
- `LOG_CHANNEL=stack`
- `LOG_LEVEL=info`

## 5) Configure frontend environment variables

Vite reads `VITE_*` variables **when `npm run build` runs**, and replaces them in the JavaScript bundle. They are **not** read at runtime from the server. If the production URL is missing during that build, the app can end up calling `localhost` (and the browser will block that from a public site as **loopback / private network** access).

Set this on the `frontend` Railway service (same value the build step must see):

- `VITE_API_BASE_URL=https://<your-backend-domain>` **or** `https://<your-backend-domain>/api` (both work; `/api` is added automatically if omitted)
- `VITE_REVERB_APP_KEY` — same value as backend `REVERB_APP_KEY`.
- `VITE_REVERB_HOST` — same hostname as backend `REVERB_HOST` (Reverb service public host).
- `VITE_REVERB_PORT=443` and `VITE_REVERB_SCHEME=https` in production (typical for `wss` behind Railway HTTPS).

Do **not** rely on a committed `frontend/.env` for production; keep secrets and machine-specific URLs out of git. Use Railway **Variables** (or a build-time secret store) so the backend URL is present when Railpack runs `npm run build`.

On the **backend** service, set **FRONTEND_URL** to your SPA origin (for example `https://<your-frontend-service>.up.railway.app`). CORS uses this value so the API allows credentialed requests from that origin.

## 6) Deploy order

1. Deploy the **API** (`backend`) first. Run database migrations via a **Release Command** or your chosen start workflow (see section 2).
2. Add the **Reverb** service (Dockerfile `Dockerfile.reverb`), assign it a **public domain**, then set **`REVERB_HOST` / `REVERB_*`** on both **API** and **Reverb** to match. Redeploy the API if it was deployed before Reverb had a hostname.
3. After the API has a public URL, set **`VITE_API_BASE_URL`** and the **`VITE_REVERB_*`** variables on the **frontend** service, then **redeploy the frontend** so a new build picks them up.
4. Changing `VITE_*` variables alone does not update an old deploy until you trigger a new build.

## 7) Sanctum / cookies note

This app uses cookie-based auth (`withCredentials: true`).

For login/session to work correctly:

- `FRONTEND_URL` must match your frontend URL exactly
- `SANCTUM_STATEFUL_DOMAINS` must contain frontend host (no protocol), e.g. `my-app.up.railway.app`
- for Railway split frontend/backend hosts, use `SESSION_SAME_SITE=none`
- keep `SESSION_SECURE_COOKIE=true` in production

If you use custom domains, prefer using domains under the same parent domain for fewer cookie issues.

## 8) Quick verification

After deploy:

1. Open frontend URL.
2. Register/login.
3. Open browser devtools:
  - `/sanctum/csrf-cookie` succeeds
  - `/login` returns user JSON
  - Authenticated API routes return `200`
  - A **WebSocket** connection opens to your Reverb host (status **101** / `wss` in the Network tab) after login when realtime is active.

If auth fails, re-check `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, and CORS-related values. If the socket never connects, re-check **`VITE_REVERB_*`** (frontend must be **rebuilt** after changes), **`REVERB_HOST`** on API and Reverb, and that the Reverb service is running and publicly reachable.