import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getState,
  getSaved,
  getLiked,
  saveMedia,
  unsaveMedia,
  likeMedia,
  unlikeMedia,
  dislikeMedia,
  undislikeMedia,
  favoriteMedia,
  unfavoriteMedia,
  watchedMedia,
  unwatchedMedia,
  stateKey,
  type UserMediaState,
} from "../api/userMedia";
import type { MediaItem } from "../api/types";
import type { MediaDetail, MovieDetail, TvDetail } from "../api/tmdb";

export function mediaItemFromDetail(
  detail: MediaDetail,
  mediaType: "movie" | "tv",
): MediaItem {
  const base = {
    id: detail.id,
    media_type: mediaType,
    poster_path: detail.poster_path,
    backdrop_path: detail.backdrop_path,
    overview: detail.overview,
    vote_average: detail.vote_average,
  };
  if (mediaType === "movie") {
    const m = detail as MovieDetail;
    return { ...base, title: m.title, release_date: m.release_date };
  }
  const t = detail as TvDetail;
  return { ...base, name: t.name, first_air_date: t.first_air_date };
}

const DEFAULT_STATE: UserMediaState = {
  is_saved: false,
  is_liked: false,
  is_disliked: false,
  is_favorited: false,
  watched_at: null,
};

const stateQKey = (tmdbId: number, mediaType: string) =>
  ["user", "media", "state", stateKey(tmdbId, mediaType)] as const;

const isBatchStateQueryKey = (key: readonly unknown[]) =>
  key[0] === "user" &&
  key[1] === "media" &&
  key[2] === "state" &&
  key[3] === "batch";

const isSavedListQueryKey = (key: readonly unknown[]) =>
  key[0] === "user" &&
  key[1] === "media" &&
  key[2] === "saved";

/** Discovery/search grids read batched state; keep them in sync with detail actions */
const patchBatchStateMaps = (
  qc: ReturnType<typeof useQueryClient>,
  tmdbId: number,
  mediaType: string,
  updates: Partial<UserMediaState>,
) => {
  const mapKey = stateKey(tmdbId, mediaType);
  qc.setQueriesData<Record<string, UserMediaState>>(
    { predicate: (q) => isBatchStateQueryKey(q.queryKey) },
    (old) => {
      if (!old) return old;
      const prevRow = old[mapKey] ?? DEFAULT_STATE;
      return { ...old, [mapKey]: { ...prevRow, ...updates } };
    },
  );
};

const snapshotSavedLists = (
  qc: ReturnType<typeof useQueryClient>,
): Array<{ key: readonly unknown[]; data: MediaItem[] | undefined }> =>
  qc
    .getQueryCache()
    .findAll({ predicate: (q) => isSavedListQueryKey(q.queryKey) })
    .map((q) => {
      const data = q.state.data as MediaItem[] | undefined;
      return {
        key: q.queryKey,
        data: data?.map((item) => ({ ...item })),
      };
    });

/** Remove item from cached Saved list so Saved tab updates before refetch */
const optimisticRemoveFromSavedList = (
  qc: ReturnType<typeof useQueryClient>,
  tmdbId: number,
  mediaType: string,
) => {
  qc.setQueriesData<MediaItem[]>(
    { predicate: (q) => isSavedListQueryKey(q.queryKey) },
    (old) => {
      if (!old) return old;
      return old.filter(
        (item) => !(item.id === tmdbId && item.media_type === mediaType),
      );
    },
  );
};

/** Add or move item to front of Saved list cache (save / like / dislike) */
const optimisticUpsertSavedList = (
  qc: ReturnType<typeof useQueryClient>,
  preview: MediaItem,
) => {
  qc.setQueriesData<MediaItem[]>(
    { predicate: (q) => isSavedListQueryKey(q.queryKey) },
    (old) => {
      const rest = (old ?? []).filter(
        (item) =>
          !(item.id === preview.id && item.media_type === preview.media_type),
      );
      return [preview, ...rest];
    },
  );
};

const restoreSavedListsSnapshot = (
  qc: ReturnType<typeof useQueryClient>,
  prev: Array<{ key: readonly unknown[]; data: MediaItem[] | undefined }>,
) => {
  if (prev.length === 0) {
    return;
  }

  for (const { key, data } of prev) {
    if (data === undefined) {
      qc.removeQueries({ queryKey: key, exact: true });
    } else {
      qc.setQueryData(key, data);
    }
  }
};

/** Refresh saved/liked list variants right after a successful media mutation. */
const refreshListsNow = async (qc: ReturnType<typeof useQueryClient>) => {
  await Promise.allSettled([
    qc.invalidateQueries({
      queryKey: ["user", "media", "saved"],
      refetchType: "all",
    }),
    qc.invalidateQueries({
      queryKey: ["user", "media", "liked"],
      refetchType: "all",
    }),
  ]);
};

export const useMediaState = (tmdbId: number | undefined, mediaType: string | undefined) => {
  const valid =
    tmdbId != null &&
    !Number.isNaN(tmdbId) &&
    (mediaType === "movie" || mediaType === "tv");

  return useQuery({
    queryKey: stateQKey(tmdbId ?? 0, mediaType ?? ""),
    queryFn: async () => {
      const map = await getState([{ id: tmdbId!, media_type: mediaType! }]);
      return map[stateKey(tmdbId!, mediaType!)] ?? DEFAULT_STATE;
    },
    enabled: valid,
    staleTime: 30_000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};

export const useMediaActions = (
  tmdbId: number,
  mediaType: string,
  listPreview?: MediaItem | null,
) => {
  const qc = useQueryClient();
  const valid = !Number.isNaN(tmdbId) && (mediaType === "movie" || mediaType === "tv");
  const qKey = stateQKey(tmdbId, mediaType);

  const savedPreview = (): MediaItem =>
    listPreview ?? {
      id: tmdbId,
      media_type: mediaType,
      poster_path: null,
    };

  const patch = (updates: Partial<UserMediaState>) =>
    qc.setQueryData<UserMediaState>(qKey, (prev) => ({
      ...(prev ?? DEFAULT_STATE),
      ...updates,
    }));

  const patchLocalAndGrid = (updates: Partial<UserMediaState>) => {
    patch(updates);
    patchBatchStateMaps(qc, tmdbId, mediaType, updates);
  };

  const snapshotBatchMaps = () =>
    qc
      .getQueryCache()
      .findAll({ predicate: (q) => isBatchStateQueryKey(q.queryKey) })
      .map((q) => {
        const raw = q.state.data as Record<string, UserMediaState> | undefined;
        const data = raw
          ? Object.fromEntries(
              Object.entries(raw).map(([k, v]) => [k, { ...v }]),
            )
          : undefined;
        return { key: q.queryKey, data };
      });

  const noop = async () => {};

  if (!valid) {
    return {
      save: noop,
      unsave: noop,
      like: noop,
      unlike: noop,
      dislike: noop,
      undislike: noop,
      favorite: noop,
      unfavorite: noop,
      watched: noop,
      unwatched: noop,
    };
  }

  return {
    save: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      const prevSaved = snapshotSavedLists(qc);
      patchLocalAndGrid({ is_saved: true });
      optimisticUpsertSavedList(qc, savedPreview());
      try {
        await saveMedia(tmdbId, mediaType);
        await refreshListsNow(qc);
      } catch {
        qc.setQueryData(qKey, prev);
        for (const { key, data } of prevBatches) {
          qc.setQueryData(key, data);
        }
        restoreSavedListsSnapshot(qc, prevSaved);
      }
    },
    unsave: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      const prevSaved = snapshotSavedLists(qc);
      patchLocalAndGrid({
        is_saved: false,
        is_liked: false,
        is_disliked: false,
        is_favorited: false,
      });
      optimisticRemoveFromSavedList(qc, tmdbId, mediaType);
      try {
        await unsaveMedia(tmdbId, mediaType);
        await refreshListsNow(qc);
      } catch {
        qc.setQueryData(qKey, prev);
        for (const { key, data } of prevBatches) {
          qc.setQueryData(key, data);
        }
        restoreSavedListsSnapshot(qc, prevSaved);
      }
    },
    like: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      const prevSaved = snapshotSavedLists(qc);
      patchLocalAndGrid({
        is_saved: true,
        is_liked: true,
        is_disliked: false,
        watched_at: new Date().toISOString(),
      });
      optimisticUpsertSavedList(qc, savedPreview());
      try {
        await likeMedia(tmdbId, mediaType);
        await refreshListsNow(qc);
      } catch {
        qc.setQueryData(qKey, prev);
        for (const { key, data } of prevBatches) {
          qc.setQueryData(key, data);
        }
        restoreSavedListsSnapshot(qc, prevSaved);
      }
    },
    unlike: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      patchLocalAndGrid({ is_liked: false });
      try {
        await unlikeMedia(tmdbId, mediaType);
        await refreshListsNow(qc);
      } catch {
        qc.setQueryData(qKey, prev);
        for (const { key, data } of prevBatches) {
          qc.setQueryData(key, data);
        }
      }
    },
    dislike: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      const prevSaved = snapshotSavedLists(qc);
      patchLocalAndGrid({
        is_saved: true,
        is_disliked: true,
        is_liked: false,
        watched_at: new Date().toISOString(),
      });
      optimisticUpsertSavedList(qc, savedPreview());
      try {
        await dislikeMedia(tmdbId, mediaType);
        await refreshListsNow(qc);
      } catch {
        qc.setQueryData(qKey, prev);
        for (const { key, data } of prevBatches) {
          qc.setQueryData(key, data);
        }
        restoreSavedListsSnapshot(qc, prevSaved);
      }
    },
    undislike: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      patchLocalAndGrid({ is_disliked: false });
      try {
        await undislikeMedia(tmdbId, mediaType);
        await refreshListsNow(qc);
      } catch {
        qc.setQueryData(qKey, prev);
        for (const { key, data } of prevBatches) {
          qc.setQueryData(key, data);
        }
      }
    },
    favorite: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      const prevSaved = snapshotSavedLists(qc);
      patchLocalAndGrid({ is_saved: true, is_favorited: true });
      optimisticUpsertSavedList(qc, savedPreview());
      try {
        await favoriteMedia(tmdbId, mediaType);
        await refreshListsNow(qc);
      } catch {
        qc.setQueryData(qKey, prev);
        for (const { key, data } of prevBatches) {
          qc.setQueryData(key, data);
        }
        restoreSavedListsSnapshot(qc, prevSaved);
      }
    },
    unfavorite: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      patchLocalAndGrid({ is_favorited: false });
      try {
        await unfavoriteMedia(tmdbId, mediaType);
        await refreshListsNow(qc);
      } catch {
        qc.setQueryData(qKey, prev);
        for (const { key, data } of prevBatches) {
          qc.setQueryData(key, data);
        }
      }
    },
    watched: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      patchLocalAndGrid({ watched_at: new Date().toISOString() });
      try {
        await watchedMedia(tmdbId, mediaType);
        await refreshListsNow(qc);
      } catch {
        qc.setQueryData(qKey, prev);
        for (const { key, data } of prevBatches) {
          qc.setQueryData(key, data);
        }
      }
    },
    unwatched: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      patchLocalAndGrid({
        watched_at: null,
        is_liked: false,
        is_disliked: false,
      });
      try {
        await unwatchedMedia(tmdbId, mediaType);
        await refreshListsNow(qc);
      } catch {
        qc.setQueryData(qKey, prev);
        for (const { key, data } of prevBatches) {
          qc.setQueryData(key, data);
        }
      }
    },
  };
};

export const useMediaStateMap = (items: { id: number; media_type: string }[]) => {
  const keys = items.map((i) => stateKey(i.id, i.media_type)).sort().join(",");
  return useQuery({
    queryKey: ["user", "media", "state", "batch", keys],
    queryFn: () => getState(items),
    enabled: items.length > 0,
    staleTime: 30_000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};

export const useSavedList = (options?: {
  withFriendsSaved?: boolean;
  withFriendsSocial?: boolean;
  friendIds?: number[];
}) =>
  useQuery({
    queryKey: [
      "user",
      "media",
      "saved",
      options?.withFriendsSocial ? "with-friends-social" :
      options?.withFriendsSaved ? "with-friends" : "all",
      (options?.withFriendsSaved || options?.withFriendsSocial) && "friendIds" in (options ?? {})
        ? ((options as { friendIds?: number[] }).friendIds ?? []).slice().sort((a, b) => a - b).join(",")
        : "",
    ],
    queryFn: () => getSaved(options),
    staleTime: 30_000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

export const useLikedList = () =>
  useQuery({
    queryKey: ["user", "media", "liked"],
    queryFn: getLiked,
    staleTime: 60_000,
  });
