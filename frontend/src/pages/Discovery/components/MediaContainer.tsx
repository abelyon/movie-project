import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../services/api";
import type { TmdbMedia } from "../../../types/tmdb";
import MediaCard from "./MediaCard";
import LoadingSpinner from "../../../components/LoadingSpinner";

interface MediaContainerProps {
  searchQuery?: string;
  genreIds?: number[];
  savedIds?: Set<string>;
  onSavedChange?: () => void;
}

const MediaContainer = ({
  searchQuery = "",
  genreIds = [],
  savedIds = new Set(),
  onSavedChange,
}: MediaContainerProps) => {
  const [media, setMedia] = useState<TmdbMedia[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || !hasMore) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  const prevSearchQueryRef = useRef(searchQuery);
  const prevGenreIdsRef = useRef<number[]>(genreIds);

  useEffect(() => {
    if (
      prevSearchQueryRef.current !== searchQuery ||
      JSON.stringify(prevGenreIdsRef.current) !== JSON.stringify(genreIds)
    ) {
      setMedia([]);
      setPage(1);
      setHasMore(true);
    }
  }, [searchQuery, genreIds]);

  useEffect(() => {
    const searchChanged = prevSearchQueryRef.current !== searchQuery;
    const genreIdsChanged =
      JSON.stringify(prevGenreIdsRef.current) !== JSON.stringify(genreIds);
    const pageToLoad = searchChanged || genreIdsChanged ? 1 : page;
    if (!hasMore && pageToLoad > 1) return;

    const load = async () => {
      setLoading(true);
      prevSearchQueryRef.current = searchQuery;
      prevGenreIdsRef.current = genreIds;

      const query = searchQuery.trim();
      let data: { results?: TmdbMedia[]; total_pages?: number };
      if (query) {
        data = await api.search(query, pageToLoad);
      } else if (genreIds.length > 0) {
        data = await api.getDiscover(genreIds, pageToLoad);
      } else {
        data = await api.getPopular(pageToLoad);
      }

      setMedia((prev) => [...prev, ...(data.results ?? [])]);
      setHasMore(pageToLoad < (data.total_pages ?? 1));

      setLoading(false);
    };

    load();
  }, [page, searchQuery, genreIds]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 p-4 sm:p-5 md:p-6 max-w-7xl mx-auto">
      {media.map((item, index) => {
        const isLast = index === media.length - 1;

        return (
          <MediaCard
            key={`${item.media_type}-${item.id}`}
            item={item}
            ref={isLast ? lastItemRef : null}
            isSaved={savedIds.has(`${item.media_type}-${item.id}`)}
            onSavedChange={onSavedChange}
          />
        );
      })}

      {loading && (
        <div className="flex justify-center p-8 w-full">
          <LoadingSpinner size={44} />
        </div>
      )}
    </div>
  );
};

export default MediaContainer;