import { useQuery } from "@tanstack/react-query";
import { fetchDiscover } from "../api/tmdb";

type DiscoverParams = { page?: number; year?: number; sort_by?: string };

export function discoverQueryKey(type: "movie" | "tv", params?: DiscoverParams) {
  return ["tmdb", "discover", type, params ?? {}] as const;
}

export function useDiscover(type: "movie" | "tv", params?: DiscoverParams) {
  return useQuery({
    queryKey: discoverQueryKey(type, params),
    queryFn: () => fetchDiscover(type, params),
  });
}