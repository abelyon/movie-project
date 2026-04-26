import api from "./client";
import { getCsrfCookie } from "./auth";
import type { MediaItem } from "./types";

export type UserMediaState = {
  is_saved: boolean;
  is_liked: boolean;
  is_disliked: boolean;
  is_favorited: boolean;
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

export async function getSaved(options?: {
  withFriendsSaved?: boolean;
  withFriendsSocial?: boolean;
  friendIds?: number[];
}): Promise<MediaItem[]> {
  const friendIdsParam = options?.friendIds?.length
    ? { friend_ids: options.friendIds.join(",") }
    : {};

  const { data } = await api.get<{ results: MediaItem[] }>("/user/media/saved", {
    params: options?.withFriendsSaved || options?.withFriendsSocial
      ? {
          ...(options.withFriendsSaved ? { with_friends_saved: 1 } : {}),
          ...(options.withFriendsSocial ? { with_friends_social: 1 } : {}),
          ...friendIdsParam,
        }
      : undefined,
  });
  return data?.results ?? [];
}

export async function getLiked(): Promise<MediaItem[]> {
  const { data } = await api.get<{ results: MediaItem[] }>("/user/media/liked");
  return data?.results ?? [];
}

export async function getFavorited(): Promise<MediaItem[]> {
  const { data } = await api.get<{ results: MediaItem[] }>("/user/media/favorited");
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
export async function favoriteMedia(tmdbId: number, mediaType: string) {
  await getCsrfCookie();
  await api.post("/user/media/favorite", { tmdb_id: tmdbId, media_type: mediaType });
}
export async function unfavoriteMedia(tmdbId: number, mediaType: string) {
  await getCsrfCookie();
  await api.delete("/user/media/favorite", { data: { tmdb_id: tmdbId, media_type: mediaType } });
}
export async function watchedMedia(tmdbId: number, mediaType: string) {
  await getCsrfCookie();
  await api.post("/user/media/watched", { tmdb_id: tmdbId, media_type: mediaType });
}
export async function unwatchedMedia(tmdbId: number, mediaType: string) {
  await getCsrfCookie();
  await api.delete("/user/media/watched", { data: { tmdb_id: tmdbId, media_type: mediaType } });
}
