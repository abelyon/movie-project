import type { TmdbMedia } from "../types/tmdb";

export const getPegi = (media: TmdbMedia, country = "FR"): string => {
  if (media.media_type === "movie" && media.release_dates?.results) {
    const countryData = media.release_dates.results.find(
      (r) => r.iso_3166_1 === country
    );
    if (countryData?.release_dates?.length) {
      return countryData.release_dates[0].certification || "--";
    }
  }

  if (media.media_type === "tv" && media.content_ratings?.results) {
    const countryData = media.content_ratings.results.find(
      (r) => r.iso_3166_1 === country
    );
    return countryData?.rating || "--";
  }
};
