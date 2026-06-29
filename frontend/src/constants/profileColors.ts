export const PROFILE_COLOR_IDS = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

export type ProfileColorId = (typeof PROFILE_COLOR_IDS)[number];

export const DEFAULT_PROFILE_COLOR: ProfileColorId = "neutral";

export const PROFILE_COLOR_BG_CLASSES: Record<ProfileColorId, string> = {
  slate: "bg-slate-500",
  gray: "bg-gray-500",
  zinc: "bg-zinc-500",
  neutral: "bg-neutral-500",
  stone: "bg-stone-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  yellow: "bg-yellow-500",
  lime: "bg-lime-500",
  green: "bg-green-500",
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
  sky: "bg-sky-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  purple: "bg-purple-500",
  fuchsia: "bg-fuchsia-500",
  pink: "bg-pink-500",
  rose: "bg-rose-500",
};

export function isProfileColorId(value: string): value is ProfileColorId {
  return (PROFILE_COLOR_IDS as readonly string[]).includes(value);
}

export function profileColorBgClass(color: string | null | undefined): string {
  if (color && isProfileColorId(color)) {
    return PROFILE_COLOR_BG_CLASSES[color];
  }
  return PROFILE_COLOR_BG_CLASSES[DEFAULT_PROFILE_COLOR];
}

export function resolveProfileColor(color: string | null | undefined): ProfileColorId {
  if (color && isProfileColorId(color)) {
    return color;
  }
  return DEFAULT_PROFILE_COLOR;
}
