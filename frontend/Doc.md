# WatchIt! – Közös film- és sorozatnézés egyszerűen

## Áttekintés

A WatchIt! egy olyan webalkalmazás, amely a közös film- és sorozatnézés során felmerülő döntéshozatali nehézségekre nyújt megoldást. Amikor barátokkal vagy családdal szeretnénk tartalmat fogyasztani, gyakran akadály, hogy nem találunk mindenki számára megfelelő darabot. A platform lehetővé teszi a felhasználók számára, hogy közösen fedezzenek fel, véleményezzenek és válasszanak ki mozgóképes tartalmakat.

## A Probléma

- Nehéz közös döntést hozni arról, hogy mit nézzünk.
- Túl sok idő megy el a válogatással a tényleges tartalomfogyasztás helyett.
- Eltérő ízlések és preferenciák ütközése a csoporton belül.
- Hiányzik egy egyszerű, központi módszer a közös válogatásra.

## Megoldás

A WatchIt! egy intuitív felületet biztosít, ahol:

- A felhasználók felfedezhetnek új filmeket és sorozatokat.
- Menthetik kedvenc tartalmaikat.
- Megoszthatják listáikat és közösen szavazhatnak.
- Személyre szabott ajánlásokat kaphatnak.

## Funkciók

### Felfedezés (Discovery)

- Filmek és sorozatok böngészése.
- Kategóriák (műfajok) szerinti szűrés.
- Keresési funkció.
- Népszerű tartalmak listázása.

### Film / sorozat részletek

- Részletes információk a kiválasztott tartalomról.
- Értékelések és like/dislike véleményezés.
- Kapcsolódó ajánlások.

### Mentett tartalmak

- Saját watchlist létrehozása.
- Tartalmak mentése későbbi megtekintésre.
- Mentett tételek szervezése és kezelése.

### Profil

- Felhasználói profil testreszabása.
- Preferenciák beállítása.

## Használati útmutató

1. **Regisztráció és bejelentkezés**
  Hozzon létre egy fiókot (felhasználónév és e-mail). Állítsa be a profilját, majd kezdje el a tartalmak felfedezését.
2. **Tartalom felfedezése**
  Böngésszen a főoldalon a népszerű tartalmak között. Használja a szűrőket és műfajokat a pontosabb találatokért. Kattintson a borítóképekre a részletekért, és mentse el a kedvenceit.
3. **Közös nézés szervezése**
  Minden tag mentse el az őt érdeklő tartalmakat, szavazzanak közösen, és élvezzék együtt a kiválasztott filmet vagy sorozatot.

---

## Technológiai stack

### Backend (API)

- **Laravel 12** – RESTful API
- **Laravel Sanctum** – SPA autentikáció (token-alapú)
- **Laravel Fortify** – regisztráció, bejelentkezés, jelszókezelés
- **CSRF token** – védett SPA kérések
- **MySQL** – adatbázis (táblák és relációk: [backend docs/DATABASE.md](../backend/docs/DATABASE.md))

### Frontend (SPA)

- **Vite** – build eszköz és dev szerver
- **React 18** + **TypeScript**
- **React Router DOM** – kliens oldali útválasztás (SPA)
- **TanStack Query** – szerveri adatok lekérése, cache és állapotkezelés
- **Tailwind CSS** – stílusok és reszponzív dizájn
- **Motion (motion.dev)** – animációk és átmenetek

### Integráció

- **TMDb API** – film- és sorozatadatok, plakátok, műfajok

---

## Tervezett funkciók

- Csoportos szavazási rendszer fejlesztése.
- Valós idejű értesítések küldése.
- Barátok meghívása és közös listák kezelése.
- Streaming platform elérhetőségének (pl. Netflix, HBO) jelzése.
- Kibővített közösségi funkciók.

# Adatbázis: táblák és relációk (Database schema & relations)

WatchIt! backend MySQL/SQLite sémája és táblák kapcsolatai.

---

## Áttekintés (ER jelleg)

```
users (1) ──┬── (*) saved         (felhasználó → mentett filmek/sorozatok)
            ├── (*) reactions     (felhasználó → like/dislike)
            └── (*) personal_access_tokens  (SPA tokenek)

password_reset_tokens, sessions, cache, cache_locks: Laravel alap
```

---

## Táblák

### `users`

| Oszlop               | Típus           | Megjegyzés                    |
|----------------------|-----------------|-------------------------------|
| `id`                 | bigint PK       |                               |
| `username`           | string(255)     |                               |
| `email`              | string(255)     | UNIQUE                        |
| `email_verified_at`  | timestamp       | nullable                      |
| `password`           | string(255)     |                               |
| `two_factor_secret`  | text            | nullable (migration)          |
| `two_factor_recovery_codes` | text   | nullable                      |
| `two_factor_confirmed_at`   | timestamp | nullable                      |
| `remember_token`     | string(100)     | nullable                      |
| `created_at`         | timestamp       |                               |
| `updated_at`         | timestamp       |                               |

---

### `saved`

Mentett filmek/sorozatok felhasználónként (TMDB `media_type` + `tmdb_id`).

| Oszlop       | Típus        | Megjegyzés                    |
|--------------|--------------|-------------------------------|
| `id`         | bigint PK    |                               |
| `user_id`    | bigint FK     | → `users.id` (cascade delete) |
| `media_type` | string(10)   | `movie` \| `tv`               |
| `tmdb_id`    | unsigned bigint | TMDB azonosító              |
| `created_at` | timestamp    |                               |
| `updated_at` | timestamp    |                               |

- **UNIQUE** `(user_id, media_type, tmdb_id)` — egy user egy adott film/sorozatot csak egyszer mentheti.

**Reláció:** `User` hasMany `Saved` (`saved()`).

---

### `reactions`

Like/dislike felhasználónként, média szerint.

| Oszlop       | Típus        | Megjegyzés                    |
|--------------|--------------|-------------------------------|
| `id`         | bigint PK    |                               |
| `user_id`    | bigint FK     | → `users.id` (cascade delete) |
| `media_type` | string(10)   | `movie` \| `tv`               |
| `tmdb_id`    | unsigned bigint | TMDB azonosító              |
| `reaction`   | enum         | `like` \| `dislike`           |
| `created_at` | timestamp    |                               |
| `updated_at` | timestamp    |                               |

- **UNIQUE** `(user_id, media_type, tmdb_id)` — egy user egy adott film/sorozatra csak egy reakciót adhat (frissíthető).

**Reláció:** `User` hasMany `Reaction` (`reactions()`).

---

### `personal_access_tokens`

SPA (Sanctum) tokenek bejelentkezett felhasználóhoz.

| Oszlop       | Típus        | Megjegyzés                    |
|--------------|--------------|-------------------------------|
| `id`         | bigint PK    |                               |
| `user_id`    | bigint FK     | → `users.id` (cascade delete) |
| `token`      | string(64)   | UNIQUE                        |
| `created_at` | timestamp    |                               |
| `updated_at` | timestamp    |                               |

**Reláció:** `User` hasMany token (modell függvénytől függően).

---

### `password_reset_tokens`

Laravel alap: jelszó visszaállító tokenek (email alapú).

| Oszlop       | Típus   | Megjegyzés   |
|--------------|---------|--------------|
| `email`      | string PK |             |
| `token`      | string  |              |
| `created_at` | timestamp nullable |   |

---

### `sessions`

Laravel alap: session tárolás.

| Oszlop          | Típus   | Megjegyzés   |
|-----------------|---------|--------------|
| `id`            | string PK |             |
| `user_id`       | bigint nullable, index |  |
| `ip_address`    | string(45) nullable |   |
| `user_agent`    | text nullable |        |
| `payload`       | longText |              |
| `last_activity` | int index |             |

---

### `cache` / `cache_locks`

Laravel cache táblák (kulcs–érték, lock).

| cache          | cache_locks    |
|----------------|----------------|
| `key` PK       | `key` PK       |
| `value` (mediumText) | `owner`  |
| `expiration`   | `expiration`   |

---

## Kapcsolatok összefoglalva

| Szülő   | Gyerek tábla              | Reláció   | FK        |
|---------|---------------------------|-----------|-----------|
| users   | saved                     | hasMany   | user_id   |
| users   | reactions                 | hasMany   | user_id   |
| users   | personal_access_tokens    | hasMany   | user_id   |
| users   | sessions                  | (user_id nullable) | user_id |

A film/sorozat adatok (pl. cím, műfaj) nem tároltak lokálisan; a `saved` és `reactions` csak `media_type` + `tmdb_id` alapján hivatkoznak a TMDb API-ra.
w
