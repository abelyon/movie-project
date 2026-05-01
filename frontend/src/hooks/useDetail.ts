import { useQuery } from "@tanstack/react-query";
import { fetchMovie, fetchTv, type MediaDetail } from "../api/tmdb";

export function detailQueryKey(
  mediaType: string,
  id: number | string,
  watchRegion = "US",
): (string | number)[] {
  return ["tmdb", "detail", mediaType, Number(id), watchRegion] as const;
}

export function fetchDetail(
  mediaType: "movie" | "tv",
  numericId: number,
  watchRegion?: string,
): Promise<MediaDetail> {
  const region =
    watchRegion && watchRegion.length === 2 ? watchRegion : "US";
  const params = { watch_region: region };
  if (mediaType === "movie") return fetchMovie(numericId, params);
  return fetchTv(numericId, params);
}

export function useDetail(
  mediaType: string | undefined,
  id: string | undefined,
  watchRegion?: string | null,
) {
  const numericId = id ? parseInt(id, 10) : NaN;
  const region =
    watchRegion && watchRegion.length === 2 ? watchRegion.toUpperCase() : "US";
  const isValid =
    (mediaType === "movie" || mediaType === "tv") &&
    !Number.isNaN(numericId);
  return useQuery({
    queryKey: detailQueryKey(mediaType ?? "", numericId, region),
    queryFn: async (): Promise<MediaDetail> => {
      if (mediaType === "movie") return fetchMovie(numericId, { watch_region: region });
      if (mediaType === "tv") return fetchTv(numericId, { watch_region: region });
      throw new Error("Invalid media type");
    },
    enabled: isValid,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}