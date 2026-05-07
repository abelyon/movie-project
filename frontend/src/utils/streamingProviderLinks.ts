const enc = (s: string) => encodeURIComponent(s.trim());

type Kind = keyof typeof URL_KIND_BUILDERS;

const PROVIDER_ID_KIND: Record<number, Kind> = {
  8: "netflix",
  1796: "netflix",
  9: "primevideo",
  119: "primevideo",
  582: "primevideo",
  613: "primevideo",
  337: "disneyplus",
  390: "disneyplus",
  350: "appletv",
  15: "hulu",
  372: "hulu",
  1899: "max",
  384: "max",
  385: "max",
  531: "paramountplus",
  387: "peacock",
  283: "crunchyroll",
  1967: "crunchyroll",
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

export function providerMediaBrowseUrl(providerId: number, title: string): string | null {
  const t = title.trim();
  if (!t) return null;
  const kind = PROVIDER_ID_KIND[providerId];
  if (!kind) return null;
  const build = URL_KIND_BUILDERS[kind];
  return build(t);
}
