import { useQuery } from "@tanstack/react-query";
import { fetchSearch } from "../api/tmdb";

export function searchQueryKey(query: string) {
  return ["tmdb", "search", query] as const;
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: searchQueryKey(query),
    queryFn: () => fetchSearch({ query }),
    enabled: query.length > 0,
  });
}