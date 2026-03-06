import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import type { TmdbMedia } from "../../types/tmdb";
import MediaCard from "../Discovery/components/MediaCard";
import LoadingSpinner from "../../components/LoadingSpinner";

interface SavedItem {
  id: number;
  media_type: string;
  tmdb_id: number;
}

const Saved = () => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [mediaDetails, setMediaDetails] = useState<Record<string, TmdbMedia>>({});
  const [loading, setLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getSavedWithDetails();
      const items = (data.saved ?? []) as (SavedItem & { detail?: TmdbMedia })[];
      setSavedItems(items);

      const details: Record<string, TmdbMedia> = {};
      for (const item of items) {
        const d = item.detail;
        if (d) {
          details[`${item.media_type}-${item.tmdb_id}`] = {
            ...d,
            id: item.tmdb_id,
            media_type: item.media_type as "movie" | "tv",
          };
        }
      }
      setMediaDetails(details);
    } catch {
      setSavedItems([]);
      setMediaDetails({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const savedIds = new Set(savedItems.map((s) => `${s.media_type}-${s.tmdb_id}`));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#252422]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  const items = savedItems
    .map((s) => mediaDetails[`${s.media_type}-${s.tmdb_id}`])
    .filter(Boolean);

  return (
    <div className="min-h-screen p-4 sm:p-5 md:p-6 bg-[#252422] pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-7xl mx-auto">
        {items.length === 0 ? (
          <p className="text-light-gray text-sm sm:text-base">No saved items yet. Add some from Discovery!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
          {items.map((item) => (
            <MediaCard
              key={`${item.media_type}-${item.id}`}
              item={item}
              isSaved={savedIds.has(`${item.media_type}-${item.id}`)}
              onSavedChange={loadSaved}
            />
          ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Saved;
