import api from "./client";
import type {
  TrendingResponse,
  SearchResponse,
  DiscoverResponse,
} from "./types";

export async function fetchTrending(params?: {
  page?: number;
}): Promise<TrendingResponse> {
  const { data } = await api.get<TrendingResponse>("/trending", {
    params: params ?? {},
  });
  return data;
}

export async function fetchSearch(params: {
  query: string;
  page?: number;
}): Promise<SearchResponse> {
  const { data } = await api.get<SearchResponse>("/search", { params });
  return data;
}

export async function fetchDiscover(
  type: "movie" | "tv",
  params?: { page?: number; year?: number; sort_by?: string },
): Promise<DiscoverResponse> {
  const { data } = await api.get<DiscoverResponse>(`/discover/${type}`, {
    params: params ?? {},
  });
  return data;
}

export type MovieDetail = {
  id: number;
  title?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview?: string;
  release_date?: string;
  vote_average?: number;
  genres?: { id: number; name: string }[];
  watch_providers?: {
    flatrate?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path?: string | null;
    }>;
    rent?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path?: string | null;
    }>;
    buy?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path?: string | null;
    }>;
    link?: string;
  } | null;
  cast?: Array<{
    id: number;
    name: string;
    character?: string;
    profile_path?: string | null;
  }>;
  runtime?: number;
  media_type: "movie";
};
export type TvDetail = {
  id: number;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview?: string;
  first_air_date?: string;
  vote_average?: number;
  genres?: { id: number; name: string }[];
  watch_providers?: {
    flatrate?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path?: string | null;
    }>;
    rent?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path?: string | null;
    }>;
    buy?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path?: string | null;
    }>;
    link?: string;
  } | null;
  cast?: Array<{
    id: number;
    name: string;
    character?: string;
    profile_path?: string | null;
  }>;
  number_of_seasons?: number;
  media_type: "tv";
};

export type MediaDetail = MovieDetail | TvDetail;

export async function fetchMovie(id: number): Promise<MovieDetail> {
  const { data } = await api.get<MovieDetail>(`/movie/${id}`);
  return data;
}
export async function fetchTv(id: number): Promise<TvDetail> {
  const { data } = await api.get<TvDetail>(`/tv/${id}`);
  return data;
}
