import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchDiscover, type DiscoverQueryParams } from "../api/tmdb";
import type { DiscoverResponse, MediaItem } from "../api/types";
import type { FilterType, MinRating } from "../layout/MainLayout";

function buildParams(
  page: number,
  mediaType: "movie" | "tv",
  opts: {
    watchRegion: string;
    watchProviderIds: number[];
    certification: string;
    applyCertification: boolean;
    selectedGenreIds: number[];
    minRating: MinRating;
    yearFrom: string;
  },
): DiscoverQueryParams {
  const params: DiscoverQueryParams = {
    page,
    sort_by: "popularity.desc",
    "vote_count.gte": 80,
  };
  if (opts.minRating > 0) {
    params["vote_average.gte"] = opts.minRating;
  }
  if (opts.yearFrom.trim()) {
    const y = opts.yearFrom.trim();
    if (mediaType === "movie") {
      params["primary_release_date.gte"] = `${y}-01-01`;
    } else {
      params["first_air_date.gte"] = `${y}-01-01`;
    }
  }
  if (opts.selectedGenreIds.length > 0) {
    params.with_genres = opts.selectedGenreIds.join(",");
  }
  if (opts.watchProviderIds.length > 0) {
    params.watch_region = opts.watchRegion;
    params.with_watch_providers = opts.watchProviderIds.join("|");
  }
  if (opts.certification && opts.applyCertification) {
    params.certification_country = opts.watchRegion;
    params.certification = opts.certification;
  }
  return params;
}

export const regionalDiscoverBaseKey = ["tmdb", "discover", "regional"] as const;

export function useInfiniteRegionalDiscover(options: {
  enabled: boolean;
  filterType: FilterType;
  watchRegion: string;
  watchProviderIds: number[];
  certification: string;
  selectedGenreIds: number[];
  minRating: MinRating;
  yearFrom: string;
}) {
  const {
    enabled,
    filterType,
    watchRegion,
    watchProviderIds,
    certification,
    selectedGenreIds,
    minRating,
    yearFrom,
  } = options;

  /** When type is All, apply certification to both movie and TV so mature TV (e.g. TV-MA) is excluded alongside movies. */
  const applyCertMovie =
    certification !== "" && (filterType === "movie" || filterType === "all");
  const applyCertTv =
    certification !== "" && (filterType === "tv" || filterType === "all");

  const providerKey = [...watchProviderIds].sort((a, b) => a - b).join("|");

  return useInfiniteQuery({
    queryKey: [
      ...regionalDiscoverBaseKey,
      filterType,
      watchRegion,
      providerKey,
      certification,
      [...selectedGenreIds].sort((a, b) => a - b).join(","),
      minRating,
      yearFrom.trim(),
    ],
    queryFn: async ({ pageParam }): Promise<DiscoverResponse & { results: MediaItem[] }> => {
      const page = pageParam as number;
      if (filterType === "movie") {
        const res = await fetchDiscover(
          "movie",
          buildParams(page, "movie", {
            watchRegion,
            watchProviderIds,
            certification,
            applyCertification: applyCertMovie,
            selectedGenreIds,
            minRating,
            yearFrom,
          }),
        );
        const results = (res.results ?? []).map((r) => ({ ...r, media_type: "movie" as const }));
        return { ...res, results };
      }
      if (filterType === "tv") {
        const res = await fetchDiscover(
          "tv",
          buildParams(page, "tv", {
            watchRegion,
            watchProviderIds,
            certification,
            applyCertification: applyCertTv,
            selectedGenreIds,
            minRating,
            yearFrom,
          }),
        );
        const results = (res.results ?? []).map((r) => ({ ...r, media_type: "tv" as const }));
        return { ...res, results };
      }

      const [movie, tv] = await Promise.all([
        fetchDiscover(
          "movie",
          buildParams(page, "movie", {
            watchRegion,
            watchProviderIds,
            certification,
            applyCertification: applyCertMovie,
            selectedGenreIds,
            minRating,
            yearFrom,
          }),
        ),
        fetchDiscover(
          "tv",
          buildParams(page, "tv", {
            watchRegion,
            watchProviderIds,
            certification,
            applyCertification: applyCertTv,
            selectedGenreIds,
            minRating,
            yearFrom,
          }),
        ),
      ]);

      const movieResults = (movie.results ?? []).map((r) => ({ ...r, media_type: "movie" as const }));
      const tvResults = (tv.results ?? []).map((r) => ({ ...r, media_type: "tv" as const }));
      const merged = [...movieResults, ...tvResults].sort(
        (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
      );
      return {
        results: merged,
        page: movie.page ?? page,
        total_pages: Math.max(movie.total_pages ?? 1, tv.total_pages ?? 1),
        total_results: (movie.total_results ?? 0) + (tv.total_results ?? 0),
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage.page ?? 1;
      const total = lastPage.total_pages ?? 1;
      return page < total ? page + 1 : undefined;
    },
    enabled: enabled && watchRegion.length === 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
