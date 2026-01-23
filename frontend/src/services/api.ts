const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  getPopular: async (page = 1) => {
    const res = await fetch(`${API_BASE_URL}/tmdb/popular?page=${page}`);
    return res.json();
  },
  search: async (query: string, page = 1) => {
    const res = await fetch(
      `${API_BASE_URL}/tmdb/search?query=${encodeURIComponent(query)}&page=${page}`
    );
    return res.json();
  },
  getReleaseDates: async (mediaType: string, mediaId: number) => {
    const res = await fetch(
      `${API_BASE_URL}/${mediaType}/${mediaId}/release_dates`
    );
    return res.json();
  }
};