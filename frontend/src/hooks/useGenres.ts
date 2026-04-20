import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { TmdbGenreOption } from "../types/tmdb";

export function useGenres() {
  const [genres, setGenres] = useState<TmdbGenreOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getGenres();
      setGenres(data.genres ?? []);
    } catch {
      setGenres([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { genres, isLoading, refetch };
}
