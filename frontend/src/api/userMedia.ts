import api from "./client";
import { getCsrfCookie } from "./auth";
import type { MediaItem } from "./types";

export type UserMediaState = {
  is_saved: boolean;
  is_liked: boolean;
  is_disliked: boolean;
  watched_at: string | null;
};

export const stateKey = (tmdbId: number, mediaType: string) =>
  `${mediaType}-${tmdbId}`;

export async function getState(
  items: { id: number; media_type: string }[],
): Promise<Record<string, UserMediaState>> {
  if (!items.length) return {};
  const { data } = await api.get<Record<string, UserMediaState>>(
    "/user/media/state",
    { params: { ids: items.map((i) => i.id).join(","), types: items.map((i) => i.media_type).join(",") } },
  );
  return data ?? {};
}

export async function getSaved(): Promise<MediaItem[]> {
  const { data } = await api.get<{ results: MediaItem[] }>("/user/media/saved");
  return data?.results ?? [];
}

export async function getLiked(): Promise<MediaItem[]> {
  const { data } = await api.get<{ results: MediaItem[] }>("/user/media/liked");
  return data?.results ?? [];
}

export async function saveMedia(tmdbId: number, mediaType: string) {
  await getCsrfCookie();
  await api.post("/user/media/save", { tmdb_id: tmdbId, media_type: mediaType });
}
export async function unsaveMedia(tmdbId: number, mediaType: string) {
  await getCsrfCookie();
  await api.delete("/user/media/save", { data: { tmdb_id: tmdbId, media_type: mediaType } });
}
export async function likeMedia(tmdbId: number, mediaType: string) {
  await getCsrfCookie();
  await api.post("/user/media/like", { tmdb_id: tmdbId, media_type: mediaType });
}
export async function unlikeMedia(tmdbId: number, mediaType: string) {
  await getCsrfCookie();
  await api.delete("/user/media/like", { data: { tmdb_id: tmdbId, media_type: mediaType } });
}
export async function dislikeMedia(tmdbId: number, mediaType: string) {
  await getCsrfCookie();
  await api.post("/user/media/dislike", { tmdb_id: tmdbId, media_type: mediaType });
}
export async function undislikeMedia(tmdbId: number, mediaType: string) {
  await getCsrfCookie();
  await api.delete("/user/media/dislike", { data: { tmdb_id: tmdbId, media_type: mediaType } });
}
