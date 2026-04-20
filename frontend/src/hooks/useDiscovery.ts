import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import type { TmdbMedia } from "../types/tmdb";

export function useDiscovery(searchQuery: string, genreIds: number[]) {
  const [media, setMedia] = useState<TmdbMedia[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const prevSearchRef = useRef(searchQuery);
  const prevGenreIdsRef = useRef<number[]>(genreIds);

  useEffect(() => {
    const searchChanged = prevSearchRef.current !== searchQuery;
    const genreIdsChanged =
      JSON.stringify(prevGenreIdsRef.current) !== JSON.stringify(genreIds);
    if (searchChanged || genreIdsChanged) {
      setMedia([]);
      setPage(1);
      setHasMore(true);
    }
  }, [searchQuery, genreIds]);

  useEffect(() => {
    const searchChanged = prevSearchRef.current !== searchQuery;
    const genreIdsChanged =
      JSON.stringify(prevGenreIdsRef.current) !== JSON.stringify(genreIds);
    const pageToLoad = searchChanged || genreIdsChanged ? 1 : page;
    if (!hasMore && pageToLoad > 1) return;

    let cancelled = false;
    setLoading(true);
    prevSearchRef.current = searchQuery;
    prevGenreIdsRef.current = genreIds;

    const query = searchQuery.trim();
    const load = query
      ? api.search(query, pageToLoad)
      : genreIds.length > 0
        ? api.getDiscover(genreIds, pageToLoad)
        : api.getPopular(pageToLoad);

    load
      .then((data: { results?: TmdbMedia[]; total_pages?: number }) => {
        if (cancelled) return;
        setMedia((prev) =>
          pageToLoad === 1 ? [...(data.results ?? [])] : [...prev, ...(data.results ?? [])]
        );
        setHasMore(pageToLoad < (data.total_pages ?? 1));
      })
      .catch(() => {
        if (!cancelled) setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, searchQuery, genreIds, hasMore]);

  const loadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || !hasMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = null;
      if (node) {
        observerRef.current = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && hasMore) loadMore();
        });
        observerRef.current.observe(node);
      }
    },
    [loading, hasMore, loadMore]
  );

  return { media, loading, hasMore, lastItemRef };
}
