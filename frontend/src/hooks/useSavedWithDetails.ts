import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { TmdbMedia } from "../types/tmdb";

interface SavedRow {
  id: number;
  media_type: string;
  tmdb_id: number;
  detail?: TmdbMedia;
}

export function useSavedWithDetails() {
  const [items, setItems] = useState<TmdbMedia[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getSavedWithDetails();
      const rows = (data.saved ?? []) as SavedRow[];
      const list: TmdbMedia[] = [];
      for (const row of rows) {
        const d = row.detail;
        if (d) {
          list.push({
            ...d,
            id: row.tmdb_id,
            media_type: row.media_type as "movie" | "tv",
          });
        }
      }
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, loading, refetch };
}
