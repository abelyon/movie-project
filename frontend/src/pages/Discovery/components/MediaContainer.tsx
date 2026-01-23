import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../services/api";
import type { TmdbMedia } from "../../../types/tmdb";
import MediaCard from "./MediaCard";

const MediaContainer = () => {
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

  useEffect(() => {
    const load = async () => {
      if (!hasMore) return;

      setLoading(true);

      const data = await api.getPopular(page);

      setMedia((prev) => [...prev, ...data.results]);
      setHasMore(page < data.total_pages);

      setLoading(false);
    };

    load();
  }, [page, hasMore]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 p-5">
      {media.map((item, index) => {
        const isLast = index === media.length - 1;

        return (
          <MediaCard
            key={`${item.media_type}-${item.id}`}
            item={item}
            ref={isLast ? lastItemRef : null}
          />
        );
      })}

      {loading && <p>Loading...</p>}
    </div>
  );
};

export default MediaContainer;