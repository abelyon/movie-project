export function formatVoteAverage(vote: number): string {
  if (vote >= 10) return "10";
  return vote.toFixed(1);
}
