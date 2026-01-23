export type MediaType = "movie" | "tv";

export interface TmdbMedia {
  id: number;
  media_type: MediaType;

  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  original_language: string;
  popularity: number;
  vote_average: number;
  vote_count: number;

  title?: string;
  name?: string;

  original_title?: string;
  original_name?: string;

  release_dates?: string;
  content_ratings?: string;
  first_air_date?: string;
  results?: string;
}
