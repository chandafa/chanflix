export interface WatchmodeSource {
  source_id: number;
  name: string;
  type: string;
  region: string;
  web_url: string;
  format?: string;
}

const BASE = 'https://api.watchmode.com/v1';

async function watchmodeFetch<T>(path: string): Promise<T | null> {
  const key = process.env.WATCHMODE_API_KEY;
  if (!key) return null;
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('apiKey', key);
  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 * 6 } });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch { return null; }
}

export async function getWatchmodeSources(type: 'movie' | 'tv', tmdbId: number): Promise<WatchmodeSource[]> {
  const field = type === 'movie' ? 'tmdb_movie_id' : 'tmdb_tv_id';
  const search = await watchmodeFetch<{ title_results?: { id: number }[] }>(`/search/?search_field=${field}&search_value=${tmdbId}`);
  const id = search?.title_results?.[0]?.id;
  if (!id) return [];
  const sources = await watchmodeFetch<WatchmodeSource[]>(`/title/${id}/sources/`);
  const region = (process.env.WATCHMODE_REGION || 'ID').toUpperCase();
  return (sources || []).filter(source => source.region === region && /^https:\/\//.test(source.web_url)).slice(0, 12);
}
