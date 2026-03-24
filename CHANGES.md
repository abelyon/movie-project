# Changelog

All changes made in this development session.

---

## Backend

### New: `database/migrations/2026_03_10_213921_create_media_table.php`
- Table `media` with columns: `user_id`, `tmdb_id`, `type` (movie|tv), `is_saved`, `is_liked`, `is_disliked`, `watched_at`, `timestamps`.
- Unique constraint on `(user_id, tmdb_id, type)`.

### New: `database/migrations/2026_03_10_220000_add_disliked_watched_to_media_table.php`
- Adds `is_disliked` and `watched_at` to existing `media` table if columns are missing (safe to run on top of the base migration).

### Updated: `app/Models/Media.php`
- Fillable: `user_id`, `tmdb_id`, `type`, `is_saved`, `is_liked`, `is_disliked`, `watched_at`.
- Casts: booleans for flags, `datetime` for `watched_at`.
- `user()` belongsTo relation.

### Updated: `app/Models/User.php`
- Added `media()` hasMany `Media` relation.

### New: `app/Http/Requests/MediaIdRequest.php`
- Validates `tmdb_id` (required integer ≥ 1) and `media_type` (required, `in:movie,tv`).
- Used by all media mutation endpoints.

### Replaced: `app/Http/Controllers/MediaController.php`
Old controller had a single `save()` action with `action`/`value` inputs and bugs (`is_liked` set for dislike). Replaced entirely with:

| Method       | Description |
|--------------|-------------|
| `index()`    | List user's media rows; optional `?saved=1 / ?liked=1 / ?disliked=1` filters. |
| `state()`    | Batch state lookup: `GET /user/media/state?ids=1,2&types=movie,tv` → map of `type-id → {is_saved, is_liked, is_disliked, watched_at}`. |
| `saved()`    | Saved items with full TMDB data → `{results:[...]}`. |
| `liked()`    | Liked items with full TMDB data → `{results:[...]}`. *(new)* |
| `save()`     | Set `is_saved = true`. |
| `unsave()`   | Set `is_saved = false`. |
| `like()`     | Set `is_liked = true`, `is_disliked = false`, `watched_at = now()`. |
| `unlike()`   | Set `is_liked = false`. |
| `dislike()`  | Set `is_disliked = true`, `is_liked = false`, `watched_at = now()`. |
| `undislike()`| Set `is_disliked = false`. |
| `watched()`  | Set `watched_at = now()`. |

All mutations use `updateOrCreate` on `(user_id, tmdb_id, type)`.

### Updated: `app/Policies/MediaPolicy.php`
- `viewAny` / `create` → `true` for any authenticated user.
- `view` / `update` / `delete` / `restore` / `forceDelete` → only the owner (`$media->user_id === $user->id`).

### Updated: `routes/api.php`
Removed the single `POST /media` route. Added a full group under `auth:sanctum` and prefix `user/media`:

```
GET    /user/media          → index
GET    /user/media/state    → state
GET    /user/media/saved    → saved
GET    /user/media/liked    → liked
POST   /user/media/save     → save
DELETE /user/media/save     → unsave
POST   /user/media/like     → like
DELETE /user/media/like     → unlike
POST   /user/media/dislike  → dislike
DELETE /user/media/dislike  → undislike
POST   /user/media/watched  → watched
```

---

## Frontend

### New: `src/api/userMedia.ts`
- `UserMediaState` type.
- `stateKey(tmdbId, mediaType)` helper.
- `getState(items)` — batch state from `/user/media/state`.
- `getSaved()` — saved list from `/user/media/saved`.
- `getLiked()` — liked list from `/user/media/liked`.
- `saveMedia / unsaveMedia / likeMedia / unlikeMedia / dislikeMedia / undislikeMedia` — thin wrappers around the API.

### New: `src/hooks/useMedia.ts`
- `useMediaState(tmdbId, mediaType)` — single-item state query (`staleTime: 0`).
- `useMediaStateMap(items)` — batch state for a list of items (used by Discovery grid).
- `useMediaActions(tmdbId, mediaType)` — returns `save/unsave/like/unlike/dislike/undislike`. Each action does:
  1. Optimistic `setQueryData` patch for instant UI response.
  2. API call.
  3. `refetchQueries` to sync server state back.
  4. Invalidates the saved/liked list queries as needed.
- `useSavedList()` — saved list query (`staleTime: 0`, `refetchOnMount: true`).
- `useLikedList()` — liked list query.

### Updated: `src/main.tsx`
- Removed `<StrictMode>` (was causing double-fetch in development).
- Added global React Query defaults: `staleTime: 2min`, `refetchOnMount: false`, `refetchOnWindowFocus: false`.

### Updated: `src/pages/Discovery/DiscoveryPage.tsx`
- Re-added `useMediaStateMap` so each card receives the correct `isSaved` prop.
- Infinite scroll `rootMargin` set to `"0px"` so next pages only load on actual scroll.

### Updated: `src/pages/Discovery/MediaCard.tsx`
- Installed and integrated **Motion (motion.dev)**.
- Card entrance: `whileInView` fade-up animation (once, scroll-triggered).
- `isSaved?: boolean` prop — renders filled amber Bookmark badge bottom-left when true.
- Image loading shimmer: neutral skeleton + shimmer sweep while the poster loads, then fades in.
- Rating badge hidden when `vote_average` is null or 0.
- `loading="eager"` on poster image.
- Hover scale (`1.02`) and tap scale (`0.98`).

### Replaced: `src/pages/Detail/DetailPage.tsx`
- Integrated **Motion (motion.dev)**.
- Poster slides in from left; info panel slides in from right.
- Poster has image-load shimmer (same pattern as MediaCard).
- Genre chips stagger in one by one.
- Overview fades up with a delay.
- `overflow-hidden` on wrapper to prevent layout shift during slide-in animations.
- Media-type icon (Clapperboard / Tv) and rating badge overlaid on the poster.
- Title row: title + runtime/seasons badge (left) + year (right).
- Bugs fixed: `getTitle`, `getDate`, `getRuntime`, `getSeasonsLabel` now use URL param `media_type` instead of `detail.media_type` (TMDB movie endpoint doesn't return `media_type`).
- **Save / Like / Dislike action buttons** — fixed bottom-right, frosted-glass pill style matching the nav bar:
  - Save (Bookmark) — always visible; amber + filled when saved.
  - Like (ThumbsUp) + Dislike (ThumbsDown) — appear with `AnimatePresence` only when media is saved; green / red when active.
  - Liking or disliking also marks the media as watched on the backend.

### Updated: `src/pages/Saved/SavedPage.tsx`
- Uses `useSavedList()` to show all saved items (previously was a stub).
- Renders saved items as a responsive `MediaCard` grid (1 / 3 / 6 columns).
- Empty state message guides user to the detail page.

---

## Packages installed

| Package | Where | Purpose |
|---------|-------|---------|
| `motion` | frontend | Motion for React (motion.dev) — animations |
