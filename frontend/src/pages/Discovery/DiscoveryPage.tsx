import { useMemo, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useInfiniteTrending } from "../../hooks/useTrending";
import { useSearch } from "../../hooks/useSearch";
import { useMediaStateMap, useSavedList } from "../../hooks/useMedia";
import { stateKey } from "../../api/userMedia";
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
    yearFrom: "",
  };
  const { showSearch, query, sortBy, filterType, selectedGenreIds, minRating, yearFrom } = discoveryControls;
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

  useEffect(() => {
    if (showSearch) return;
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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, showSearch]);

  const rawTrending = data?.pages.flatMap((p) => p.results) ?? [];
  const rawSearch = searchData?.results ?? [];
  const raw = canSearch ? rawSearch : rawTrending;
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
  const savedSet = useMemo(
    () => new Set((savedList ?? []).map((item) => stateKey(item.id, item.media_type))),
    [savedList],
  );

  if (isPending && !data) {
    return (
      <div>
        <SkeletonCards count={8} />
      </div>
    );
  }
  if (isError) return <p>Error: {error?.message}</p>;

  const isShowingSearchHint = showSearch && trimmedQuery.length > 0 && trimmedQuery.length < 2;
  const isShowingSearchResults = showSearch && trimmedQuery.length >= 2;
  const resultsTitle = isShowingSearchResults ? `Search: ${trimmedQuery}` : "";

  return (
    <div>
      {resultsTitle ? (
        <h1 className="px-5 pt-5 text-xl font-space-grotesk font-bold text-neutral-200">
          {resultsTitle}
        </h1>
      ) : null}

      {isShowingSearchHint && (
        <p className="px-5 pt-2 text-sm text-neutral-400">Type at least 2 characters to search.</p>
      )}

      {isShowingSearchResults && isSearchLoading && results.length === 0 && <SkeletonCards count={8} />}

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-5">
        {results.map((item) => (
          (() => {
            const key = stateKey(item.id, item.media_type);
            const isSaved = (stateMap?.[key]?.is_saved ?? false) || savedSet.has(key);
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

      {!showSearch && (
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
