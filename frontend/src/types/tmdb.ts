export type MediaType = "movie" | "tv";

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbGenreOption {
  id: number;
  name: string;
  type: MediaType;
}

export interface TmdbMedia {
  id: number;
  media_type: MediaType;

  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  genres?: TmdbGenre[];
  original_language: string;
  popularity: number;
  vote_average: number;
  vote_count: number;

  title?: string;
  name?: string;

  original_title?: string;
  original_name?: string;

  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];

  release_dates?: string;
  content_ratings?: string;
  results?: string;

  certification?: string;
}
