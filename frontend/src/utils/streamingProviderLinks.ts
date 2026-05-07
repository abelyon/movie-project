/**
 * TMDB watch-provider responses do not include per-logo deep links to titles on each service.
 * We send users to that service’s own search/browse URL with the title, which usually lands on
 * the right page or close results. Unknown provider IDs return null so the UI can fall back.
 */

const enc = (s: string) => encodeURIComponent(s.trim());

type Kind = keyof typeof URL_KIND_BUILDERS;

/** TMDB `provider_id` → internal kind (several IDs can map to the same streaming brand). */
const PROVIDER_ID_KIND: Record<number, Kind> = {
  // Netflix
  8: "netflix",
  1796: "netflix",
  // Amazon Prime / Prime Video
  9: "primevideo",
  119: "primevideo",
  582: "primevideo",
  613: "primevideo",
  // Disney+
  337: "disneyplus",
  390: "disneyplus",
  // Apple TV+
  350: "appletv",
  // Hulu
  15: "hulu",
  372: "hulu",
  // Max / HBO Max
  1899: "max",
  384: "max",
  385: "max",
  // Paramount+
  531: "paramountplus",
  // Peacock
  387: "peacock",
  // Crunchyroll
  283: "crunchyroll",
  1967: "crunchyroll",
  // discovery+
  510: "discoveryplus",
};

const URL_KIND_BUILDERS = {
  netflix: (title: string) => `https://www.netflix.com/search?q=${enc(title)}`,
  primevideo: (title: string) =>
    `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${enc(title)}`,
  disneyplus: (title: string) => `https://www.disneyplus.com/search?q=${enc(title)}`,
  appletv: (title: string) => `https://tv.apple.com/search?term=${enc(title)}`,
  hulu: (title: string) => `https://www.hulu.com/search?q=${enc(title)}`,
  max: (title: string) => `https://play.max.com/search?q=${enc(title)}`,
  paramountplus: (title: string) =>
    `https://www.paramountplus.com/search/?q=${enc(title)}`,
  peacock: (title: string) => `https://www.peacocktv.com/search?q=${enc(title)}`,
  crunchyroll: (title: string) =>
    `https://www.crunchyroll.com/search?q=${enc(title)}`,
  discoveryplus: (title: string) =>
    `https://www.discoveryplus.com/search?q=${enc(title)}`,
} as const;

/**
 * Returns a URL on the streaming site’s domain (usually site search with the title), or null
 * if we don’t have a safe pattern for that TMDB provider id.
 */
export function providerMediaBrowseUrl(providerId: number, title: string): string | null {
  const t = title.trim();
  if (!t) return null;
  const kind = PROVIDER_ID_KIND[providerId];
  if (!kind) return null;
  const build = URL_KIND_BUILDERS[kind];
  return build(t);
}
