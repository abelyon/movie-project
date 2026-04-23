export type MediaItem = {
  id: number;
  title?: string;
  name?: string;
  media_type: "movie" | "tv" | string;
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

export type TrendingResponse = {
  results: MediaItem[];
  page?: number;
  total_pages?: number;
};

export type SearchResponse = {
  results: MediaItem[];
  page?: number;
  total_pages?: number;
};

export type DiscoverResponse = {
  results: MediaItem[];
  page?: number;
  total_pages?: number;
};
