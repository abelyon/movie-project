import { useQuery } from "@tanstack/react-query";
import { fetchMovie, fetchTv, type MediaDetail } from "../api/tmdb";

export function detailQueryKey(mediaType: string, id: number | string): (string | number)[] {
  return ["tmdb", "detail", mediaType, Number(id)] as const;
}

export function fetchDetail(
  mediaType: "movie" | "tv",
  numericId: number,
): Promise<MediaDetail> {
  if (mediaType === "movie") return fetchMovie(numericId);
  return fetchTv(numericId);
}

export function useDetail(mediaType: string | undefined, id: string | undefined) {
  const numericId = id ? parseInt(id, 10) : NaN;
  const isValid =
    (mediaType === "movie" || mediaType === "tv") &&
    !Number.isNaN(numericId);
  return useQuery({
    queryKey: detailQueryKey(mediaType ?? "", numericId),
    queryFn: async (): Promise<MediaDetail> => {
      if (mediaType === "movie") return fetchMovie(numericId);
      if (mediaType === "tv") return fetchTv(numericId);
      throw new Error("Invalid media type");
    },
    enabled: isValid,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}