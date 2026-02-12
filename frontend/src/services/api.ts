import { getAuthToken } from "../contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export const api = {
  getPopular: async (page = 1) => {
    const res = await fetch(`${API_BASE_URL}/tmdb/popular?page=${page}`);
    return res.json();
  },
  getGenres: async () => {
    const res = await fetch(`${API_BASE_URL}/tmdb/genres`);
    return res.json();
  },
  getDiscover: async (genreIds: number[], page = 1) => {
    const withGenres = genreIds.join(",");
    const res = await fetch(
      `${API_BASE_URL}/tmdb/discover?page=${page}&with_genres=${encodeURIComponent(withGenres)}`
    );
    return res.json();
  },
  search: async (query: string, page = 1) => {
    const res = await fetch(
      `${API_BASE_URL}/tmdb/search?query=${encodeURIComponent(query)}&page=${page}`
    );
    return res.json();
  },
  getDetail: async (mediaType: string, mediaId: number) => {
    const res = await fetch(`${API_BASE_URL}/tmdb/${mediaType}/${mediaId}`);
    return res.json();
  },
  getReleaseDates: async (mediaType: string, mediaId: number) => {
    const res = await fetch(
      `${API_BASE_URL}/${mediaType}/${mediaId}/release_dates`
    );
    return res.json();
  },
  getFavourites: async () => {
    const res = await fetch(`${API_BASE_URL}/favourites`, {
      headers: authHeaders(),
    });
    return res.json();
  },
  /** Favourites with TMDB details in one request (faster for Saved page). */
  getFavouritesWithDetails: async () => {
    const res = await fetch(`${API_BASE_URL}/favourites/with-details`, {
      headers: authHeaders(),
    });
    return res.json();
  },
  toggleFavourite: async (mediaType: string, tmdbId: number) => {
    const res = await fetch(`${API_BASE_URL}/favourites/toggle`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ media_type: mediaType, tmdb_id: tmdbId }),
    });
    return res.json();
  },
  addFavourite: async (mediaType: string, tmdbId: number) => {
    const res = await fetch(`${API_BASE_URL}/favourites`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ media_type: mediaType, tmdb_id: tmdbId }),
    });
    return res.json();
  },
  removeFavourite: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/favourites/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return res.json();
  },
  checkFavourite: async (mediaType: string, tmdbId: number) => {
    const res = await fetch(
      `${API_BASE_URL}/favourites/check?media_type=${mediaType}&tmdb_id=${tmdbId}`,
      { headers: authHeaders() }
    );
    return res.json();
  },

  getReaction: async (mediaType: string, tmdbId: number) => {
    const res = await fetch(
      `${API_BASE_URL}/reactions/check?media_type=${mediaType}&tmdb_id=${tmdbId}`,
      { headers: authHeaders() }
    );
    return res.json();
  },

  setReaction: async (
    mediaType: string,
    tmdbId: number,
    reaction: "like" | "dislike"
  ) => {
    const res = await fetch(`${API_BASE_URL}/reactions`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        media_type: mediaType,
        tmdb_id: tmdbId,
        reaction,
      }),
    });
    return res.json();
  },
};
