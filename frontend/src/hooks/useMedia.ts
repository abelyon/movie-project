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

const isBatchStateQueryKey = (key: readonly unknown[]) =>
  key[0] === "user" &&
  key[1] === "media" &&
  key[2] === "state" &&
  key[3] === "batch";

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

/** Defer list refetch so React paints optimistic cache updates first */
const scheduleListSync = (qc: ReturnType<typeof useQueryClient>) => {
  queueMicrotask(() => {
    void qc.invalidateQueries({ queryKey: ["user", "media", "saved"] });
    void qc.invalidateQueries({ queryKey: ["user", "media", "liked"] });
  });
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
    return { save: noop, unsave: noop, like: noop, unlike: noop, dislike: noop, undislike: noop };
  }

  return {
    save: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      patchLocalAndGrid({ is_saved: true });
      try {
        await saveMedia(tmdbId, mediaType);
        scheduleListSync(qc);
      } catch {
        qc.setQueryData(qKey, prev);
        for (const { key, data } of prevBatches) {
          qc.setQueryData(key, data);
        }
      }
    },
    unsave: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      patchLocalAndGrid({ is_saved: false, is_liked: false, is_disliked: false });
      try {
        await unsaveMedia(tmdbId, mediaType);
        scheduleListSync(qc);
      } catch {
        qc.setQueryData(qKey, prev);
        for (const { key, data } of prevBatches) {
          qc.setQueryData(key, data);
        }
      }
    },
    like: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      patchLocalAndGrid({
        is_saved: true,
        is_liked: true,
        is_disliked: false,
        watched_at: new Date().toISOString(),
      });
      try {
        await likeMedia(tmdbId, mediaType);
        scheduleListSync(qc);
      } catch {
        qc.setQueryData(qKey, prev);
        for (const { key, data } of prevBatches) {
          qc.setQueryData(key, data);
        }
      }
    },
    unlike: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      patchLocalAndGrid({ is_liked: false });
      try {
        await unlikeMedia(tmdbId, mediaType);
        scheduleListSync(qc);
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
      patchLocalAndGrid({
        is_saved: true,
        is_disliked: true,
        is_liked: false,
        watched_at: new Date().toISOString(),
      });
      try {
        await dislikeMedia(tmdbId, mediaType);
        scheduleListSync(qc);
      } catch {
        qc.setQueryData(qKey, prev);
        for (const { key, data } of prevBatches) {
          qc.setQueryData(key, data);
        }
      }
    },
    undislike: async () => {
      const prev = qc.getQueryData<UserMediaState>(qKey) ?? DEFAULT_STATE;
      const prevBatches = snapshotBatchMaps();
      patchLocalAndGrid({ is_disliked: false });
      try {
        await undislikeMedia(tmdbId, mediaType);
        scheduleListSync(qc);
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
