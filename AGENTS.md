# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

This is a decoupled SPA: a **React/TypeScript frontend** (`frontend/`) communicating via REST API with a **Laravel/PHP backend** (`backend/`). The backend proxies TMDB API requests and manages user auth + media state in MySQL.

### Prerequisites (system-level, installed in VM snapshot)

- PHP 8.2+ with extensions: cli, curl, mbstring, xml, zip, sqlite3, mysql, bcmath, dom
- Composer (global at `/usr/local/bin/composer`)
- Node.js 22.x / npm 10.x
- MySQL Server 8.0+

### Running services

| Service | Directory | Command | Port |
|---------|-----------|---------|------|
| Laravel API | `backend/` | `php artisan serve --host=0.0.0.0 --port=8000` | 8000 |
| Frontend Vite dev | `frontend/` | `npm run dev -- --host 0.0.0.0` | 5173 |

### Environment setup notes

- Backend `.env`: Copy from `.env.example`, then add `TMDB_API_KEY`, `TMDB_URL=https://api.themoviedb.org/3`, `FRONTEND_URL=http://localhost:5173`, `SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost,127.0.0.1`, `SESSION_DOMAIN=localhost`. Run `php artisan key:generate` if `APP_KEY` is empty.
- Database (MySQL): configure `DB_CONNECTION=mysql`, `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_DATABASE=movie_project`, `DB_USERNAME=movie_user`, `DB_PASSWORD=movie_pass`, then run `php artisan migrate --force`.
- The `TMDB_API_KEY` environment secret is required for movie/TV data to load. Without it, the app runs but TMDB endpoints return 401.

### Lint / Test / Build

| Check | Command | Notes |
|-------|---------|-------|
| Backend tests | `cd backend && php artisan test` | PHPUnit; 2 tests pass |
| Frontend lint | `cd frontend && npx eslint .` | Some unrelated legacy warnings may remain; changed files pass lint |
| Frontend type-check | `cd frontend && npx tsc -b` | Pre-existing TS error in `SavedPage.tsx` |
| Frontend build | `cd frontend && npx vite build` | Succeeds (bypasses tsc) |
| Backend lint | `cd backend && vendor/bin/pint` | Laravel Pint (code style) |

### Known current issues

- TMDB watch providers are region-specific; UI currently displays US providers only.
- TypeScript strict build (`tsc -b`) fails on `SavedPage.tsx` line 7 (`Property 'length' does not exist on type 'never'`).
