import { useMemo, useRef, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useInfiniteTrending } from "../../hooks/useTrending";
import { useSearch } from "../../hooks/useSearch";
import { useMediaStateMap, useSavedList } from "../../hooks/useMedia";
import { stateKey } from "../../api/userMedia";
import MediaCard from "./MediaCard";

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
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    data,
    isLoading,
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
    if (showSearch) {
      searchInputRef.current?.focus();
    }
  }, [showSearch]);

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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const rawTrending = data?.pages.flatMap((p) => p.results) ?? [];
  const rawSearch = searchData?.results ?? [];
  const raw = canSearch ? rawSearch : rawTrending;
  const seen = new Set<string>();
  const results = raw.filter((item) => {
    if (item.media_type !== "movie" && item.media_type !== "tv") return false;
    const key = `${item.media_type}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const { data: stateMap } = useMediaStateMap(results);
  const { data: savedList } = useSavedList();
  const savedSet = useMemo(
    () => new Set((savedList ?? []).map((item) => stateKey(item.id, item.media_type))),
    [savedList],
  );

  if (isLoading) {
    return (
      <div>
        <h1 className="px-5 pt-5 text-xl font-space-grotesk font-bold text-neutral-200">Trending</h1>
        <SkeletonCards />
      </div>
    );
  }
  if (isError) return <p>Error: {error?.message}</p>;

  const isShowingSearchHint = showSearch && trimmedQuery.length > 0 && trimmedQuery.length < 2;
  const isShowingSearchResults = showSearch && trimmedQuery.length >= 2;
  const resultsTitle = isShowingSearchResults ? `Search: ${trimmedQuery}` : "Trending";

  const actionButtonClass =
    "fixed right-5 bottom-5 z-50 flex items-center justify-center bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md rounded-4xl p-3 text-neutral-300 hover:text-white transition-colors";

  return (
    <div>
      <AnimatePresence>
        {showSearch && (
          <motion.div
            key="search-bar"
            className="fixed top-0 left-0 right-0 z-50 p-5"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="mx-auto max-w-4xl">
              <motion.div
                className="bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md rounded-4xl px-4 py-3"
                initial={{ scale: 0.98 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.98 }}
                transition={{ duration: 0.18 }}
              >
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search movies or TV..."
                  className="w-full bg-transparent text-neutral-100 placeholder:text-neutral-400 outline-none font-space-grotesk"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="px-5 pt-5 text-xl font-space-grotesk font-bold text-neutral-200">
        {resultsTitle}
      </h1>

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

      <button
        onClick={() => {
          if (showSearch) {
            setShowSearch(false);
            setQuery("");
            return;
          }
          setShowSearch(true);
        }}
        className={actionButtonClass}
        title={showSearch ? "Close search" : "Search"}
      >
        {showSearch ? <X size={20} strokeWidth={2.5} /> : <Search size={20} strokeWidth={2.5} />}
      </button>
    </div>
  );
};

export default DiscoveryPage;
