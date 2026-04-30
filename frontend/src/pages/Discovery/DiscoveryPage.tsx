import { useMemo, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useInfiniteTrending } from "../../hooks/useTrending";
import { useSearch } from "../../hooks/useSearch";
import { useMediaStateMap, useSavedList } from "../../hooks/useMedia";
import { stateKey } from "../../api/userMedia";
import { fetchDiscover, fetchPeopleSearch, type PersonSearchResult } from "../../api/tmdb";
import MediaCard from "./MediaCard";
import type { MainLayoutOutletContext } from "../../layout/MainLayout";

const SkeletonCards = ({ count = 12 }: { count?: number }) => (
  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-5">
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className="aspect-2/3 w-full rounded-4xl bg-neutral-800/70 animate-pulse"
      />
    ))}
  </div>
);

const DiscoveryPage = () => {
  const outletContext = useOutletContext<MainLayoutOutletContext | undefined>();
  const discoveryControls = outletContext?.discoveryControls ?? {
    showSearch: false,
    query: "",
    sortBy: "default" as const,
    filterType: "all" as const,
    selectedGenreIds: [] as number[],
    minRating: 0 as const,
    watchedFilter: "all" as const,
    favoriteFilter: "all" as const,
    yearFrom: "",
  };
  const { showSearch, query, sortBy, filterType, selectedGenreIds, minRating, watchedFilter, favoriteFilter, yearFrom } = discoveryControls;
  const {
    data,
    isPending,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTrending();

  const sentinelRef = useRef<HTMLDivElement>(null);
  const trimmedQuery = query.trim();
  const canSearch = showSearch && trimmedQuery.length >= 2;
  const { data: searchData, isLoading: isSearchLoading } = useSearch(
    canSearch ? trimmedQuery : "",
  );
  const { data: peopleSearchData, isLoading: isPeopleSearchLoading } = useQuery({
    queryKey: ["tmdb", "people", "search", "discovery", trimmedQuery],
    queryFn: () => fetchPeopleSearch({ query: trimmedQuery }),
    enabled: canSearch,
    staleTime: 60_000,
  });
  const matchedPerson: PersonSearchResult | null = useMemo(() => {
    if (!canSearch) return null;
    const people = peopleSearchData?.results ?? [];
    if (people.length === 0) return null;
    const q = trimmedQuery.toLowerCase();
    return (
      people.find((p) => p.name.toLowerCase() === q) ??
      people.find((p) => p.name.toLowerCase().startsWith(q)) ??
      people.find((p) => p.name.toLowerCase().includes(q)) ??
      people[0] ??
      null
    );
  }, [canSearch, peopleSearchData?.results, trimmedQuery]);
  const actorMode = canSearch && matchedPerson !== null;
  const { data: actorMovieData, isLoading: isActorMovieLoading } = useQuery({
    queryKey: ["tmdb", "discover", "movie", "actor-search", matchedPerson?.id ?? null],
    queryFn: () => fetchDiscover("movie", { person_id: matchedPerson!.id }),
    enabled: actorMode,
  });
  const { data: actorTvData, isLoading: isActorTvLoading } = useQuery({
    queryKey: ["tmdb", "discover", "tv", "actor-search", matchedPerson?.id ?? null],
    queryFn: () => fetchDiscover("tv", { person_id: matchedPerson!.id }),
    enabled: actorMode,
  });

  useEffect(() => {
    if (showSearch || actorMode) return;
    if (!hasNextPage || isFetchingNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "0px 0px 1500px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [actorMode, fetchNextPage, hasNextPage, isFetchingNextPage, showSearch]);

  const rawTrending = data?.pages.flatMap((p) => p.results) ?? [];
  const rawSearch = searchData?.results ?? [];
  const actorResults = actorMode
    ? [
        ...(actorMovieData?.results ?? []),
        ...(actorTvData?.results ?? []),
      ]
    : [];
  const actorSearchFiltered = canSearch
    ? actorResults.filter((item) =>
        (item.title ?? item.name ?? "").toLowerCase().includes(trimmedQuery.toLowerCase()),
      )
    : actorResults;
  const raw = actorMode ? actorSearchFiltered : (canSearch ? rawSearch : rawTrending);
  const seen = new Set<string>();
  const dedupedResults = raw.filter((item) => {
    if (item.media_type !== "movie" && item.media_type !== "tv") return false;
    const key = `${item.media_type}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const filteredResults = useMemo(
    () =>
      dedupedResults.filter((item) => {
        if (filterType !== "all" && item.media_type !== filterType) return false;
        if (selectedGenreIds.length > 0) {
          const itemGenres = item.genre_ids ?? [];
          if (!selectedGenreIds.some((genreId) => itemGenres.includes(genreId))) return false;
        }
        if ((item.vote_average ?? 0) < minRating) return false;

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
    [dedupedResults, filterType, minRating, selectedGenreIds, yearFrom],
  );
  const results = useMemo(() => {
    if (sortBy === "default") return filteredResults;
    const sorted = [...filteredResults];

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
  }, [filteredResults, sortBy]);

  const { data: stateMap } = useMediaStateMap(results);
  const { data: savedList } = useSavedList();
  const savedBadgeCacheRef = useRef<Record<string, boolean>>({});
  const hasStateMap = stateMap !== undefined;
  const hasSavedList = savedList !== undefined;
  const savedSet = useMemo(
    () => new Set((savedList ?? []).map((item) => stateKey(item.id, item.media_type))),
    [savedList],
  );
  const visibleResults = useMemo(
    () =>
      results.filter((item) => {
        const key = stateKey(item.id, item.media_type);
        if (favoriteFilter === "favorited" && !stateMap?.[key]?.is_favorited) return false;
        if (watchedFilter === "all") return true;
        const watched = Boolean(stateMap?.[key]?.watched_at);
        return watchedFilter === "watched" ? watched : !watched;
      }),
    [favoriteFilter, results, stateMap, watchedFilter],
  );

  if (
    (canSearch && isPeopleSearchLoading) ||
    (actorMode && (isActorMovieLoading || isActorTvLoading)) ||
    (isPending && !data)
  ) {
    return (
      <div>
        <SkeletonCards count={8} />
      </div>
    );
  }
  if (isError) return <p>Error: {error?.message}</p>;

  const isShowingSearchHint = showSearch && trimmedQuery.length > 0 && trimmedQuery.length < 2;
  const isShowingSearchResults = showSearch && trimmedQuery.length >= 2;

  return (
    <div>
      {isShowingSearchHint && (
        <p className="px-5 pt-2 text-sm text-neutral-400">Type at least 2 characters to search.</p>
      )}

      {isShowingSearchResults && isSearchLoading && visibleResults.length === 0 && <SkeletonCards count={8} />}
      {isShowingSearchResults && !isSearchLoading && visibleResults.length === 0 && (
        <div className="px-5 pt-2">
          <p role="alert" className="text-sm text-neutral-400">
            No results found for "{trimmedQuery}". Try another title or clear some filters.
          </p>
        </div>
      )}
      {isShowingSearchResults && actorMode && visibleResults.length === 0 && (
        <div className="px-5 pt-2">
          <p role="alert" className="text-sm text-neutral-400">
            No movie or TV results found for actor "{matchedPerson?.name}".
          </p>
        </div>
      )}

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-5">
        {visibleResults.map((item) => (
          (() => {
            const key = stateKey(item.id, item.media_type);
            const savedFromSources = Boolean(stateMap?.[key]?.is_saved) || savedSet.has(key);
            const prevSaved = savedBadgeCacheRef.current[key] ?? false;
            const canFinalizeFalse = hasStateMap && hasSavedList;
            const isSaved = savedFromSources || (!canFinalizeFalse && prevSaved);
            savedBadgeCacheRef.current[key] = isSaved;
            return (
          <MediaCard
            key={`${item.media_type}-${item.id}`}
            item={item}
            isSaved={isSaved}
          />
            );
          })()
        ))}
      </div>

      {!showSearch && !actorMode && (
        <>
          <div ref={sentinelRef} style={{ height: 20 }} />
          {isFetchingNextPage && (
            <div className="px-5 pb-2">
              <div className="h-4 w-40 rounded bg-neutral-800/70 animate-pulse" />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DiscoveryPage;
