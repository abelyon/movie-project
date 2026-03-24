import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchTrending } from "../api/tmdb";

export const infiniteTrendingQueryKey = ["tmdb", "trending", "infinite"] as const;

export function useInfiniteTrending() {
  return useInfiniteQuery({
    queryKey: infiniteTrendingQueryKey,
    queryFn: ({ pageParam }) => fetchTrending({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage.page ?? 1;
      const total = lastPage.total_pages ?? 1;
      return page < total ? page + 1 : undefined;
    },
  });
}