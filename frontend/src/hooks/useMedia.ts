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
  stateKey,
  type UserMediaState,
} from "../api/userMedia";

const DEFAULT_STATE: UserMediaState = {
  is_saved: false,
  is_liked: false,
  is_disliked: false,
  watched_at: null,
};

const stateQKey = (tmdbId: number, mediaType: string) =>
  ["user", "media", "state", stateKey(tmdbId, mediaType)] as const;

/** Invalidate saved list + all state queries so Discovery bookmarks update too */
const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["user", "media", "saved"] });
  qc.invalidateQueries({ queryKey: ["user", "media", "state"] });
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
    staleTime: 0,
    refetchOnMount: "always",
  });
};

export const useMediaActions = (tmdbId: number, mediaType: string) => {
  const qc = useQueryClient();
  const valid = !Number.isNaN(tmdbId) && (mediaType === "movie" || mediaType === "tv");
  const qKey = stateQKey(tmdbId, mediaType);

  const patch = (updates: Partial<UserMediaState>) =>
    qc.setQueryData<UserMediaState>(qKey, (prev) => ({
      ...(prev ?? DEFAULT_STATE),
      ...updates,
    }));

  const noop = async () => {};

  if (!valid) {
    return { save: noop, unsave: noop, like: noop, unlike: noop, dislike: noop, undislike: noop };
  }

  return {
    save: async () => {
      patch({ is_saved: true });
      try {
        await saveMedia(tmdbId, mediaType);
        invalidateAll(qc);
      } catch {
        patch({ is_saved: false });
      }
    },
    unsave: async () => {
      patch({ is_saved: false, is_liked: false, is_disliked: false });
      try {
        await unsaveMedia(tmdbId, mediaType);
        invalidateAll(qc);
        qc.invalidateQueries({ queryKey: ["user", "media", "liked"] });
      } catch {
        patch({ is_saved: true });
      }
    },
    like: async () => {
      patch({ is_saved: true, is_liked: true, is_disliked: false });
      try {
        await likeMedia(tmdbId, mediaType);
        invalidateAll(qc);
        qc.invalidateQueries({ queryKey: ["user", "media", "liked"] });
      } catch {
        patch({ is_liked: false, is_saved: false });
      }
    },
    unlike: async () => {
      patch({ is_liked: false });
      try {
        await unlikeMedia(tmdbId, mediaType);
        invalidateAll(qc);
        qc.invalidateQueries({ queryKey: ["user", "media", "liked"] });
      } catch {
        patch({ is_liked: true });
      }
    },
    dislike: async () => {
      patch({ is_saved: true, is_disliked: true, is_liked: false });
      try {
        await dislikeMedia(tmdbId, mediaType);
        invalidateAll(qc);
        qc.invalidateQueries({ queryKey: ["user", "media", "liked"] });
      } catch {
        patch({ is_disliked: false, is_saved: false });
      }
    },
    undislike: async () => {
      patch({ is_disliked: false });
      try {
        await undislikeMedia(tmdbId, mediaType);
        invalidateAll(qc);
      } catch {
        patch({ is_disliked: true });
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
    staleTime: 0,
    refetchOnMount: "always",
  });
};

export const useSavedList = () =>
  useQuery({
    queryKey: ["user", "media", "saved"],
    queryFn: getSaved,
    staleTime: 0,
    refetchOnMount: "always",
  });

export const useLikedList = () =>
  useQuery({
    queryKey: ["user", "media", "liked"],
    queryFn: getLiked,
    staleTime: 60_000,
  });
