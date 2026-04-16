# Projekt dokumentáció

## 1. Felhasználói dokumentáció

### 1.1 Feladat
A rendszer egy film- és sorozatböngésző webalkalmazás, amely lehetővé teszi:
- trendelő tartalmak böngészését,
- keresést cím alapján,
- részletes adatlap megtekintését,
- mentés / kedvelés / nem kedvelés jelölést,
- mentett lista kezelését,
- felhasználói bejelentkezést és regisztrációt.

### 1.2 Környezet
- Böngésző: Chrome, Edge vagy Firefox (modern verzió)
- Frontend URL: `http://localhost:5173`
- Backend API URL: `http://localhost:8000`

### 1.3 Használat

#### 1.3.1 A program indítása
1. Indítsd a backendet:
   - `cd backend`
   - `php artisan serve --host=0.0.0.0 --port=8000`
2. Indítsd a frontendet:
   - `cd frontend`
   - `npm run dev -- --host 0.0.0.0`
3. Nyisd meg a böngészőben: `http://localhost:5173`

#### 1.3.2 Bejelentkezés / regisztráció
- Új felhasználó esetén regisztráció a `/register` oldalon.
- Meglévő felhasználóval belépés a `/login` oldalon.

#### 1.3.3 Fő funkciók
- **Discovery oldal**: trendelő tartalmak kártyás listában.
- **Keresés**: jobb alsó kereső gombbal, minimum 2 karakter.
- **Detail oldal**:
  - cím, év, műfajok, leírás,
  - streaming szolgáltatói logók,
  - szereplők listája (kép + név + karakter),
  - mentés, like/dislike gombok.
- **Saved oldal**: mentett tartalmak listája.

#### 1.3.4 Várt kimenet
- Mentés után a tartalom azonnal megjelenik a Saved listában.
- Like/dislike állapot azonnal frissül (optimistic UI).
- Detail oldalon a streaming és cast szekció adatokkal töltődik (ha TMDB adja).

### 1.4 Hiba lehetőségek
- Érvénytelen belépési adatok.
- Hiányzó vagy hibás `TMDB_API_KEY` esetén nincs tartalom.
- Hálózati hiba esetén API válasz késik vagy hibát ad.

### 1.5 Példa felhasználói folyamat
1. Belépés (`/login`).
2. Discovery oldalon film kiválasztása.
3. Detail oldalon mentés + like.
4. Saved oldalra váltás, mentett film ellenőrzése.

---

## 2. Fejlesztői dokumentáció

### 2.1 Feladat és specifikáció
A rendszer egy SPA (Single Page Application):
- Frontend: React + TypeScript + Vite
- Backend: Laravel API + Sanctum/Fortify
- Adatforrás: TMDB API proxyzás backend oldalon
- Adatbázis: MySQL

### 2.2 Architektúra
- **Frontend (`frontend/`)**
  - Route-ok: login/register/discovery/detail/saved/profile
  - Állapotkezelés: TanStack Query
  - API kliens: Axios
- **Backend (`backend/`)**
  - REST endpointok a TMDB-hez és user media állapothoz
  - Auth: Sanctum session + Fortify auth végpontok
  - ORM: Eloquent modellek

### 2.3 Környezet és függőségek
#### 2.3.1 Backend
- PHP 8.2+
- Composer
- Laravel 12
- MySQL 8+

#### 2.3.2 Frontend
- Node.js 22+
- npm 10+
- React 19
- TypeScript 5
- Vite 7

### 2.4 Konfiguráció
`backend/.env` főbb változók:
- `DB_CONNECTION=mysql`
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_DATABASE=movie_project`
- `DB_USERNAME=movie_user`
- `DB_PASSWORD=movie_pass`
- `TMDB_API_KEY=<secret>`
- `TMDB_URL=https://api.themoviedb.org/3`
- `FRONTEND_URL=http://localhost:5173`

### 2.5 Forráskód és fontos modulok
#### 2.5.1 Backend
- `routes/api.php` – API route definíciók
- `app/Http/Controllers/TmdbController.php` – TMDB proxy
- `app/Http/Controllers/MediaController.php` – mentés/like/dislike logika
- `app/Models/Media.php` – média állapot modell

#### 2.5.2 Frontend
- `src/pages/Discovery/DiscoveryPage.tsx`
- `src/pages/Detail/DetailPage.tsx`
- `src/pages/Saved/SavedPage.tsx`
- `src/hooks/useMedia.ts`
- `src/hooks/useDetail.ts`
- `src/api/tmdb.ts`

### 2.6 Megoldás leírás
- Detail oldal gyorsítás:
  - prefetch kártyáról,
  - navigation preview state,
  - cache tuning (stale/gc idő).
- Optimistic UI:
  - save/like/dislike azonnali vizuális visszajelzés,
  - rollback hiba esetén.
- Streaming/Cast:
  - backend TMDB `watch/providers` + `credits` endpointból építkezik,
  - frontend logókat és cast kártyákat renderel.

### 2.7 API végpontok
- `GET /api/trending`
- `GET /api/discover/{type}`
- `GET /api/search`
- `GET /api/movie/{id}`
- `GET /api/tv/{id}`
- `GET /api/user`
- `GET /api/user/media/state`
- `GET /api/user/media/saved`
- `POST /api/user/media/save`
- `DELETE /api/user/media/save`
- `POST /api/user/media/like`
- `DELETE /api/user/media/like`
- `POST /api/user/media/dislike`
- `DELETE /api/user/media/dislike`

### 2.8 Tesztelés
#### 2.8.1 Automatizált
- Backend: `cd backend && php artisan test`
- Frontend build: `cd frontend && npx vite build`

#### 2.8.2 Manuális
- Login/regisztráció
- Discovery lista és keresés
- Detail mentés/like/dislike működés
- Saved lista azonnali frissülés
- Streaming és cast megjelenítés

### 2.9 Fejlesztési lehetőségek
- Profil oldal funkcionális bővítése.
- Liked oldal külön route + UI.
- E2E tesztek (Playwright/Cypress).
- Internationalization (i18n) támogatás.
- Részletes backend/feature tesztek bővítése.
