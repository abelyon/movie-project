/** First character of the display name for avatar initials (uppercased). */
export function userNameInitial(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  const first = [...trimmed][0] ?? "?";
  return first.toLocaleUpperCase();
}
