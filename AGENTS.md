# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

This is a decoupled SPA: a **React/TypeScript frontend** (`frontend/`) communicating via REST API with a **Laravel/PHP backend** (`backend/`). The backend proxies TMDB API requests and manages user auth + media state in SQLite.

### Prerequisites (system-level, installed in VM snapshot)

- PHP 8.2+ with extensions: cli, curl, mbstring, xml, zip, sqlite3, bcmath, dom
- Composer (global at `/usr/local/bin/composer`)
- Node.js 22.x / npm 10.x

### Running services

| Service | Directory | Command | Port |
|---------|-----------|---------|------|
| Laravel API | `backend/` | `php artisan serve --host=0.0.0.0 --port=8000` | 8000 |
| Frontend Vite dev | `frontend/` | `npm run dev -- --host 0.0.0.0` | 5173 |

### Environment setup notes

- Backend `.env`: Copy from `.env.example`, then add `TMDB_API_KEY`, `TMDB_URL=https://api.themoviedb.org/3`, `FRONTEND_URL=http://localhost:5173`, `SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost,127.0.0.1`, `SESSION_DOMAIN=localhost`. Run `php artisan key:generate` if `APP_KEY` is empty.
- Database: SQLite file at `backend/database/database.sqlite`. Create with `touch` if missing, then `php artisan migrate --force`.
- The `TMDB_API_KEY` environment secret is required for movie/TV data to load. Without it, the app runs but TMDB endpoints return 401.

### Lint / Test / Build

| Check | Command | Notes |
|-------|---------|-------|
| Backend tests | `cd backend && php artisan test` | PHPUnit; 2 tests pass |
| Frontend lint | `cd frontend && npx eslint .` | Pre-existing errors in codebase (react-refresh, react-hooks) |
| Frontend type-check | `cd frontend && npx tsc -b` | Pre-existing TS error in `SavedPage.tsx` |
| Frontend build | `cd frontend && npx vite build` | Succeeds (bypasses tsc) |
| Backend lint | `cd backend && vendor/bin/pint` | Laravel Pint (code style) |

### Known pre-existing issues

- DB schema mismatch: migration uses `saved`/`liked` columns but model + controller reference `is_saved`/`is_liked`/`is_disliked`/`watched_at`. The second migration mentioned in `CHANGES.md` is missing from the repo.
- Frontend ESLint has 2 errors and 1 warning (react-refresh, react-hooks/static-components, exhaustive-deps).
- TypeScript strict build (`tsc -b`) fails on `SavedPage.tsx` line 7 (`Property 'length' does not exist on type 'never'`).
