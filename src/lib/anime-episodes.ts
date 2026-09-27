export function episodeNumber(title: string): number | null {
  const match = title.match(/(?:episode|ep\.?|#)\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}
