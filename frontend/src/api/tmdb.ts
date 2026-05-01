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

export type DiscoverQueryParams = {
  page?: number;
  year?: number;
  sort_by?: string;
  person_id?: number;
  watch_region?: string;
  with_watch_providers?: string;
  certification?: string;
  certification_country?: string;
  with_genres?: string;
  "vote_average.gte"?: number;
  "vote_count.gte"?: number;
  "primary_release_date.gte"?: string;
  "first_air_date.gte"?: string;
};

export async function fetchDiscover(
  type: "movie" | "tv",
  params?: DiscoverQueryParams,
): Promise<DiscoverResponse> {
  const { data } = await api.get<DiscoverResponse>(`/discover/${type}`, {
    params: params ?? {},
  });
  return data;
}

export type PersonSearchResult = {
  id: number;
  name: string;
  media_type?: "person";
  known_for_department?: string;
  profile_path?: string | null;
};

export type PersonSearchResponse = {
  results: PersonSearchResult[];
  page?: number;
  total_pages?: number;
  total_results?: number;
};

export async function fetchPeopleSearch(params: {
  query: string;
  page?: number;
}): Promise<PersonSearchResponse> {
  const { data } = await api.get<PersonSearchResponse>("/people/search", { params });
  return data;
}

export type PersonDetail = {
  id: number;
  name: string;
  profile_path?: string | null;
  biography?: string;
  birthday?: string | null;
  place_of_birth?: string | null;
  known_for_department?: string;
  credits: Array<{
    id: number;
    media_type: "movie" | "tv";
    title?: string;
    name?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    overview?: string;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
  }>;
};

export async function fetchPerson(id: number): Promise<PersonDetail> {
  const { data } = await api.get<PersonDetail>(`/person/${id}`);
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

export async function fetchMovie(
  id: number,
  params?: { watch_region?: string },
): Promise<MovieDetail> {
  const { data } = await api.get<MovieDetail>(`/movie/${id}`, { params });
  return data;
}
export async function fetchTv(
  id: number,
  params?: { watch_region?: string },
): Promise<TvDetail> {
  const { data } = await api.get<TvDetail>(`/tv/${id}`, { params });
  return data;
}

export type WatchProviderRow = {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
};

export type WatchProvidersCatalogResponse = {
  watch_region: string;
  flatrate: WatchProviderRow[];
  rent: WatchProviderRow[];
  buy: WatchProviderRow[];
};

export async function fetchWatchProvidersCatalog(params: {
  type: "movie" | "tv";
  watch_region: string;
}): Promise<WatchProvidersCatalogResponse> {
  const { data } = await api.get<WatchProvidersCatalogResponse>(
    `/catalog/watch-providers/${params.type}`,
    { params: { watch_region: params.watch_region } },
  );
  return data;
}

export type CertificationEntry = {
  certification: string;
  meaning: string;
  order: number;
};

export type CertificationsListResponse = {
  certifications: Record<string, CertificationEntry[]>;
};

export async function fetchCertificationsList(type: "movie" | "tv"): Promise<CertificationsListResponse> {
  const { data } = await api.get<CertificationsListResponse>(`/catalog/certifications/${type}`);
  return data;
}

export async function fetchMediaWatchProviderIds(
  mediaType: "movie" | "tv",
  id: number,
  watch_region: string,
): Promise<number[]> {
  const path = mediaType === "movie" ? `/movie/${id}/watch-providers` : `/tv/${id}/watch-providers`;
  const { data } = await api.get<{ provider_ids: number[] }>(path, {
    params: { watch_region },
  });
  return data.provider_ids ?? [];
}
