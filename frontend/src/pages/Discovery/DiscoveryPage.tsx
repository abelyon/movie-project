import { useMemo, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useInfiniteTrending } from "../../hooks/useTrending";
import { useSearch } from "../../hooks/useSearch";
import { useMediaStateMap, useSavedList } from "../../hooks/useMedia";
import { stateKey } from "../../api/userMedia";
import { fetchDiscover, fetchPeopleSearch, type PersonSearchResult } from "../../api/tmdb";
import MediaCard from "./MediaCard";
import PeopleCard from "./PeopleCard";
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
  const rawPeople = canSearch ? (peopleSearchData?.results ?? []) : [];
  const actorResults = actorMode
    ? [
        ...(actorMovieData?.results ?? []),
        ...(actorTvData?.results ?? []),
      ]
    : [];
  const actorHasMatches = actorResults.length > 0;
  const raw = canSearch
    ? (actorMode && actorHasMatches ? actorResults : rawSearch)
    : rawTrending;
  const seenMedia = new Set<string>();
  const dedupedMediaResults = raw.filter((item) => {
    if (item.media_type !== "movie" && item.media_type !== "tv") return false;
    const key = `${item.media_type}-${item.id}`;
    if (seenMedia.has(key)) return false;
    seenMedia.add(key);
    return true;
  });
  const seenPeople = new Set<number>();
  const dedupedPeopleResults = rawPeople.filter((person) => {
    if (seenPeople.has(person.id)) return false;
    seenPeople.add(person.id);
    return true;
  });
  const filteredResults = useMemo(
    () =>
      dedupedMediaResults.filter((item) => {
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
    [dedupedMediaResults, filterType, minRating, selectedGenreIds, yearFrom],
  );
  const mediaResults = useMemo(() => {
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

  const { data: stateMap } = useMediaStateMap(mediaResults);
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
      mediaResults.filter((item) => {
        const key = stateKey(item.id, item.media_type);
        if (favoriteFilter === "favorited" && !stateMap?.[key]?.is_favorited) return false;
        if (watchedFilter === "all") return true;
        const watched = Boolean(stateMap?.[key]?.watched_at);
        return watchedFilter === "watched" ? watched : !watched;
      }),
    [favoriteFilter, mediaResults, stateMap, watchedFilter],
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
  const visiblePeople = isShowingSearchResults ? dedupedPeopleResults : [];
  const hasAnySearchResults = visibleResults.length > 0 || visiblePeople.length > 0;
  const searchNotice = isShowingSearchHint
    ? "Type at least 2 characters to search."
    : isShowingSearchResults && actorMode && actorHasMatches && visibleResults.length === 0
      ? `No movie or TV results found for actor "${matchedPerson?.name}".`
      : isShowingSearchResults && !isSearchLoading && !isPeopleSearchLoading && !hasAnySearchResults
        ? `No results found for "${trimmedQuery}". Try another title or clear some filters.`
        : null;
  const showPinnedSearchNotice = showSearch && searchNotice !== null;
  const cardsTopSpacingClass = showSearch && !showPinnedSearchNotice ? "pt-5" : "";
  const mediaCardsToRender = isShowingSearchHint ? [] : visibleResults;
  const peopleCardsToRender = isShowingSearchHint ? [] : visiblePeople;

  return (
    <div className={showSearch ? "pt-20" : ""}>
      {showPinnedSearchNotice && (
        <div className="px-5 pb-5">
          <p role="status" className="mx-5 text-left text-sm text-neutral-300 font-space-grotesk">
            {searchNotice}
          </p>
        </div>
      )}

      {isShowingSearchResults && isSearchLoading && isPeopleSearchLoading && !hasAnySearchResults && <SkeletonCards count={8} />}

      <div className={`p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-5 ${cardsTopSpacingClass}`}>
        {peopleCardsToRender.map((person) => (
          <PeopleCard key={`person-${person.id}`} person={person} />
        ))}
        {mediaCardsToRender.map((item) => (
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
