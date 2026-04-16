import type { MediaItem } from "../api/types";
import type { MediaDetail, MovieDetail, TvDetail } from "../api/tmdb";

/** Build minimal detail from list/search card data for instant detail UI before fetch completes */
export function previewItemToDetail(
  preview: MediaItem,
  mediaType: "movie" | "tv",
): MediaDetail {
  if (mediaType === "movie") {
    const d: MovieDetail = {
      id: preview.id,
      title: preview.title,
      poster_path: preview.poster_path,
      backdrop_path: preview.backdrop_path ?? null,
      overview: preview.overview,
      release_date: preview.release_date,
      vote_average: preview.vote_average,
      genres: [],
      media_type: "movie",
    };
    return d;
  }
  const d: TvDetail = {
    id: preview.id,
    name: preview.name,
    poster_path: preview.poster_path,
    backdrop_path: preview.backdrop_path ?? null,
    overview: preview.overview,
    first_air_date: preview.first_air_date,
    vote_average: preview.vote_average,
    genres: [],
    media_type: "tv",
  };
  return d;
}
