# SeeIt

SeeIt is a web app for discovering movies and TV shows, saving what you want to watch, and coordinating with friends. The UI is a React single-page application; the API is a Laravel application backed by a relational database, with metadata sourced from [The Movie Database (TMDB)](https://www.themoviedb.org/).

## Features

- Account registration, login, password reset, and email verification flows (Laravel Fortify)
- Session-based API access for the SPA (Laravel Sanctum)
- Discovery grid with search, filters, sorting, and infinite scroll
- Title detail pages: cast, trailer, watch providers, recommendations, personal states (saved, watched, favourite, like/dislike)
- Person (cast/crew) pages with filmography
- Saved list with filters, sorting, and friend-aware views
- Profile: display name, country/region (for TMDB region data), friend requests, logout
- Real-time layer via Laravel Reverb (see backend configuration)

## Repository layout

| Path | Description |
|------|-------------|
| `frontend/` | React 19, TypeScript, Vite 7, Tailwind CSS 4 |
| `backend/` | Laravel 12, Fortify, Sanctum, Reverb |
| `docs/` | Project documentation (including English sources and generated Word docs) |

## Requirements

- PHP 8.2+ and [Composer](https://getcomposer.org/)
- Node.js 22+ and npm 10+
- MySQL 8+ (or another database supported by Laravel; the example backend env defaults to SQLite for quick starts—adjust as needed)
- A TMDB API key ([TMDB settings](https://www.themoviedb.org/settings/api))

## Local development

### Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
```

Set at minimum:

- `APP_URL` — public URL of the Laravel app (e.g. `http://127.0.0.1:8000`)
- `FRONTEND_URL` — origin of the Vite dev server (e.g. `http://localhost:5173`)
- `TMDB_API_KEY` — your TMDB key
- Database credentials if you use MySQL instead of SQLite

Then run migrations (and seed if your workflow uses seeders):

```bash
php artisan migrate
php artisan serve
```

For cookie authentication from the SPA, keep `FRONTEND_URL` and `SANCTUM_STATEFUL_DOMAINS` aligned with where the frontend runs. See comments in `backend/.env.example`.

### Frontend

```bash
cd frontend
cp .env.example .env
```

Set `VITE_API_BASE_URL` to your Laravel API base (must include the `/api` prefix as used by the client), for example:

`http://127.0.0.1:8000/api`

Match Reverb-related `VITE_*` values with `REVERB_*` in the backend when testing realtime features.

```bash
npm install
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

### Production build (frontend)

```bash
cd frontend
npm run build
```

Serve the `frontend/dist` assets with your hosting setup, or integrate static hosting with your API deployment.

## Split frontend and API (e.g. two hosts)

If the SPA and Laravel run on different HTTPS origins, configure Sanctum and session cookies for cross-site credentialed requests (see Laravel Sanctum SPA documentation). In practice this usually includes:

- `SESSION_SAME_SITE=none` and `SESSION_SECURE_COOKIE=true` over HTTPS
- `SANCTUM_STATEFUL_DOMAINS` including the SPA host
- `FRONTEND_URL` set to the SPA origin
- CORS allowing the SPA origin with credentials

Rebuild frontend assets after changing any `VITE_*` variable.

## Documentation

Additional developer and user documentation lives under `docs/` (Markdown and Word formats).

## Authors

Ábel Lehotai, Ádám Nagy (see project documentation for details).
