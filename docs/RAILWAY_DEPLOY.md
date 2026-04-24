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
3. Add 2 services from the same repo:
  - Service A root directory: `backend`
  - Service B root directory: `frontend`

This repo does **not** use Nixpacks config files. Railway infers build and start from each root (for example Node/Vite for `frontend`, PHP/Laravel for `backend`). If a service needs an override, set **Build Command**, **Start Command**, or **Release Command** (for migrations) in that service’s **Settings** in the Railway dashboard—for example a backend release: `php artisan migrate --force`.

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

Optional but recommended:

- `SESSION_SECURE_COOKIE=true`
- `LOG_CHANNEL=stack`
- `LOG_LEVEL=info`

## 5) Configure frontend environment variables

Vite reads `VITE_*` variables **when `npm run build` runs**, and replaces them in the JavaScript bundle. They are **not** read at runtime from the server. If the production URL is missing during that build, the app can end up calling `localhost` (and the browser will block that from a public site as **loopback / private network** access).

Set this on the `frontend` Railway service (same value the build step must see):

- `VITE_API_BASE_URL=https://<your-backend-domain>` **or** `https://<your-backend-domain>/api` (both work; `/api` is added automatically if omitted)

Do **not** rely on a committed `frontend/.env` for production; keep secrets and machine-specific URLs out of git. Use Railway **Variables** (or a build-time secret store) so the backend URL is present when Railpack runs `npm run build`.

On the **backend** service, set **`FRONTEND_URL`** to your SPA origin (for example `https://<your-frontend-service>.up.railway.app`). CORS uses this value so the API allows credentialed requests from that origin.

## 6) Deploy order

1. Deploy backend first. Run database migrations via a **Release Command** or your chosen start workflow (see section 2).
2. After the backend has a public URL, set **`VITE_API_BASE_URL`** on the **frontend** service, then **redeploy the frontend** so a new build picks it up.
3. Changing this variable alone does not update an old deploy until you trigger a new build.

## 7) Sanctum / cookies note

This app uses cookie-based auth (`withCredentials: true`).

For login/session to work correctly:

- `FRONTEND_URL` must match your frontend URL exactly
- `SANCTUM_STATEFUL_DOMAINS` must contain frontend host (no protocol), e.g. `my-app.up.railway.app`
- if frontend and backend are different subdomains, set `SESSION_DOMAIN` to a shared parent domain (for Railway, typically `.up.railway.app`)
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

If auth fails, re-check `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, and CORS-related values.