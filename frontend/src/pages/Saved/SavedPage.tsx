import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMediaWatchProviderIds } from "../../api/tmdb";
import { stateKey } from "../../api/userMedia";
import { useMediaStateMap, useSavedList } from "../../hooks/useMedia";
import { getFriendOverview } from "../../api/friends";
import { useAuth } from "../../contexts/AuthContext";
import MediaCard from "../Discovery/MediaCard";
import type { MainLayoutOutletContext } from "../../layout/MainLayout";

const SavedPage = () => {
  const outletContext = useOutletContext<MainLayoutOutletContext | undefined>();
  const savedControls = outletContext?.savedControls ?? {
    sortBy: "default" as const,
    filterType: "all" as const,
    selectedGenreIds: [] as number[],
    minRating: 0 as const,
    watchedFilter: "all" as const,
    favoriteFilter: "all" as const,
    yearFrom: "",
    selectedWatchProviderIds: [] as number[],
    certification: "",
    watchRegion: "US",
    selectedFriendIds: [] as number[],
    showFriendsSocial: false,
    withFriendsSaved: false,
    setFilterType: () => {},
    setSelectedGenreIds: () => {},
    setMinRating: () => {},
    setYearFrom: () => {},
    setSelectedWatchProviderIds: () => {},
    setCertification: () => {},
  };
  const {
    sortBy,
    filterType,
    selectedGenreIds,
    minRating,
    watchedFilter,
    favoriteFilter,
    yearFrom,
    selectedWatchProviderIds,
    watchRegion,
    selectedFriendIds,
    showFriendsSocial,
    withFriendsSaved,
  } = savedControls;
  const { user } = useAuth();

  const { data: saved, isLoading, isError, error } = useSavedList({
    withFriendsSaved,
    withFriendsSocial: showFriendsSocial,
    friendIds: selectedFriendIds,
  });
  const friendsOverview = useQuery({
    queryKey: ["friends", "overview"],
    queryFn: getFriendOverview,
    staleTime: 60_000,
  });

  const filteredSaved = useMemo(
    () =>
      (saved ?? []).filter((item) => {
        if (filterType !== "all" && item.media_type !== filterType) return false;
        if ((item.vote_average ?? 0) < minRating) return false;

        if (selectedGenreIds.length > 0) {
          const itemGenreIds = item.genre_ids ?? item.genres?.map((g) => g.id) ?? [];
          if (!selectedGenreIds.some((genreId) => itemGenreIds.includes(genreId))) return false;
        }

        if (yearFrom.trim()) {
          const parsedYearFrom = Number.parseInt(yearFrom, 10);
          if (!Number.isNaN(parsedYearFrom)) {
            const dateString = item.media_type === "movie" ? item.release_date : item.first_air_date;
            const itemYear = dateString ? Number.parseInt(dateString.slice(0, 4), 10) : NaN;
            if (Number.isNaN(itemYear) || itemYear < parsedYearFrom) return false;
          }
        }

        return true;
      }),
    [filterType, minRating, saved, selectedGenreIds, yearFrom],
  );

  const streamingFilterActive = selectedWatchProviderIds.length > 0;
  const savedIdsKey = useMemo(
    () =>
      filteredSaved
        .filter((i) => i.media_type === "movie" || i.media_type === "tv")
        .map((i) => `${i.media_type}:${i.id}`)
        .sort()
        .join(","),
    [filteredSaved],
  );

  const savedWatchProviderMap = useQuery({
    queryKey: ["saved", "watch-providers", watchRegion, savedIdsKey],
    queryFn: async () => {
      const map = new Map<string, number[]>();
      const eligible = filteredSaved.filter(
        (i) => i.media_type === "movie" || i.media_type === "tv",
      );
      const chunk = 8;
      for (let i = 0; i < eligible.length; i += chunk) {
        const slice = eligible.slice(i, i + chunk);
        await Promise.all(
          slice.map(async (item) => {
            const ids = await fetchMediaWatchProviderIds(
              item.media_type as "movie" | "tv",
              item.id,
              watchRegion,
            );
            map.set(stateKey(item.id, item.media_type), ids);
          }),
        );
      }
      return map;
    },
    enabled:
      streamingFilterActive &&
      watchRegion.length === 2 &&
      filteredSaved.length > 0 &&
      filteredSaved.length <= 100,
    staleTime: 6 * 60 * 60 * 1000,
  });

  const afterStreamingFilter = useMemo(() => {
    if (!streamingFilterActive) return filteredSaved;
    if (filteredSaved.length > 100) return filteredSaved;
    const map = savedWatchProviderMap.data;
    if (!map) return filteredSaved;
    return filteredSaved.filter((item) => {
      if (item.media_type !== "movie" && item.media_type !== "tv") return false;
      const ids = map.get(stateKey(item.id, item.media_type)) ?? [];
      return selectedWatchProviderIds.some((pid) => ids.includes(pid));
    });
  }, [
    filteredSaved,
    selectedWatchProviderIds,
    streamingFilterActive,
    savedWatchProviderMap.data,
  ]);

  const processedSaved = useMemo(() => {
    if (sortBy === "default") return afterStreamingFilter;
    const sorted = [...afterStreamingFilter];

    if (sortBy === "title_asc") {
      sorted.sort((a, b) => {
        const aTitle = (a.title ?? a.name ?? "").toLowerCase();
        const bTitle = (b.title ?? b.name ?? "").toLowerCase();
        return aTitle.localeCompare(bTitle);
      });
      return sorted;
    }

    if (sortBy === "title_desc") {
      sorted.sort((a, b) => {
        const aTitle = (a.title ?? a.name ?? "").toLowerCase();
        const bTitle = (b.title ?? b.name ?? "").toLowerCase();
        return bTitle.localeCompare(aTitle);
      });
      return sorted;
    }

    sorted.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    return sorted;
  }, [afterStreamingFilter, sortBy]);

  const { data: stateMap } = useMediaStateMap(processedSaved);
  const watchTogetherNameMap = useMemo(() => {
    const map = new Map<number, string>();
    if (user) map.set(user.id, "You");
    for (const friend of friendsOverview.data?.friends ?? []) {
      map.set(friend.id, friend.name);
    }
    return map;
  }, [friendsOverview.data?.friends, user]);
  const visibleSaved = useMemo(
    () =>
      processedSaved.filter((item) => {
        const key = stateKey(item.id, item.media_type);
        if (favoriteFilter === "favorited" && !stateMap?.[key]?.is_favorited) return false;
        if (watchedFilter === "all") return true;
        const watched = Boolean(stateMap?.[key]?.watched_at);
        return watchedFilter === "watched" ? watched : !watched;
      }),
    [favoriteFilter, processedSaved, stateMap, watchedFilter],
  );

  const streamingFilterTooLarge =
    streamingFilterActive && filteredSaved.length > 100;
  if (isLoading && (saved ?? []).length === 0) {
    return (
      <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-5">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="aspect-2/3 w-full rounded-4xl bg-neutral-800/70 animate-pulse" />
        ))}
      </div>
    );
  }
  if (isError) return <p className="p-5 text-red-400">Error: {error?.message}</p>;

  return (
    <div>
      {streamingFilterTooLarge && (
        <p className="px-5 pt-5 text-sm text-amber-200/90">
          Streaming filter applies to at most 100 titles after your other filters. Narrow type, year, or genres, then
          try again.
        </p>
      )}
      {streamingFilterActive &&
        filteredSaved.length > 0 &&
        filteredSaved.length <= 100 &&
        savedWatchProviderMap.isFetching && (
          <p className="px-5 pt-3 text-xs text-neutral-400">Checking streaming availability…</p>
        )}
      {!visibleSaved.length ? (
        <div className="p-5">
          <p className="text-neutral-400">
            {saved?.length
              ? "No saved items match your current sort/filter settings."
              : showFriendsSocial
                ? "No shared saved/liked/favorited media found for you and your selected friends."
                : withFriendsSaved
                ? "No suggestions yet. Pick friends with overlapping saved or liked titles (dislikes are excluded for everyone)."
                : "No saved items yet. Tap the bookmark on any movie or show's detail page."}
          </p>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-5">
          {visibleSaved.map((item) => (
            <MediaCard
              key={`${item.media_type}-${item.id}`}
              item={item}
              watchTogetherMeta={
                withFriendsSaved && typeof item.watch_participant_count === "number"
                  ? {
                      wantCount: item.watch_want_count ?? 0,
                      participantCount: item.watch_participant_count,
                      wantedByNames: (item.watch_want_user_ids ?? []).map(
                        (userId) => watchTogetherNameMap.get(userId) ?? `User ${userId}`,
                      ),
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default SavedPage;
