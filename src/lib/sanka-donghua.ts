import 'server-only';

type Data = Record<string, unknown>;

export interface DonghuaItem {
  title: string;
  slug: string;
  poster: string | null;
  episode: string | null;
}

export interface DonghuaEpisodeLink { title: string; slug: string }
export interface DonghuaStream { id: string; label: string; url: string }

export interface DonghuaEpisodeData {
  title: string;
  seriesTitle: string;
  seriesSlug: string | null;
  poster: string | null;
  episodes: DonghuaEpisodeLink[];
  streams: DonghuaStream[];
}

export interface DonghuaDetailData {
  title: string;
  poster: string | null;
  synopsis: string | null;
  episodes: DonghuaEpisodeLink[];
}

const requests: number[] = [];

function object(value: unknown): Data | null { return value && typeof value === 'object' && !Array.isArray(value) ? value as Data : null; }
function string(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function validSlug(value: unknown): string | null { const text = string(value); return text && /^[a-z0-9-]{3,180}$/.test(text) ? text : null; }

function posterUrl(value: unknown): string | null {
  try { const url = new URL(string(value) || ''); return url.protocol === 'https:' && url.hostname === 'anichin.moe' ? url.toString() : null; }
  catch { return null; }
}

function streamUrl(value: unknown): string | null {
  try {
    const url = new URL(string(value) || '');
    if (url.protocol !== 'https:') return null;
    if (url.hostname === 'ok.ru' && url.pathname.startsWith('/videoembed/')) return url.toString();
    if (url.hostname === 'play.d.tube' && url.searchParams.has('v')) return url.toString();
    return null;
  } catch { return null; }
}

async function playable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000), next: { revalidate: 60 * 60 } });
    const frame = response.headers.get('x-frame-options')?.toUpperCase();
    const ancestors = response.headers.get('content-security-policy')?.match(/frame-ancestors\s+([^;]+)/i)?.[1];
    return response.ok && (!frame || frame === 'ALLOWALL') && (!ancestors || ancestors.includes('*'));
  } catch { return false; }
}

async function request(path: string): Promise<Data | null> {
  const now = Date.now();
  while (requests.length && requests[0] < now - 60_000) requests.shift();
  if (requests.length >= 10) return null;
  requests.push(now);
  const base = process.env.SANKA_ANIME_API_URL || 'https://www.sankavollerei.web.id/anime/';
  try {
    const url = new URL(path, base.endsWith('/') ? base : `${base}/`);
    if (url.hostname !== 'www.sankavollerei.web.id' || url.protocol !== 'https:') return null;
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6500), next: { revalidate: 60 * 30 } });
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) return null;
    const length = Number(response.headers.get('content-length'));
    if (Number.isFinite(length) && length > 650_000) return null;
    return object(await response.json());
  } catch { return null; }
}

function items(value: unknown): DonghuaItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 80).flatMap(entry => {
    const item = object(entry);
    const title = string(item?.title);
    const slug = validSlug(item?.slug);
    if (!title || !slug) return [];
    return [{ title, slug, poster: posterUrl(item?.poster), episode: string(item?.current_episode) }];
  });
}

function episodes(value: unknown): DonghuaEpisodeLink[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 500).flatMap(entry => {
    const item = object(entry);
    const slug = validSlug(item?.slug);
    const title = string(item?.episode) || string(item?.title);
    return slug && title ? [{ title, slug }] : [];
  });
}

export async function getDonghuaHome(page = 1): Promise<{ latest: DonghuaItem[]; completed: DonghuaItem[] }> {
  if (!Number.isInteger(page) || page < 1 || page > 20) return { latest: [], completed: [] };
  const data = await request(`donghua/home/${page}`);
  return { latest: items(data?.latest_release), completed: items(data?.completed_donghua) };
}

export async function getDonghuaDetail(slug: string): Promise<DonghuaDetailData | null> {
  if (!validSlug(slug)) return null;
  const data = await request(`donghua/detail/${encodeURIComponent(slug)}`);
  const title = string(data?.title);
  if (!title) return null;
  return { title, poster: posterUrl(data?.poster), synopsis: string(data?.synopsis), episodes: episodes(data?.episodes_list) };
}

export async function getDonghuaEpisode(slug: string): Promise<DonghuaEpisodeData | null> {
  if (!validSlug(slug)) return null;
  const data = await request(`donghua/episode/${encodeURIComponent(slug)}`);
  const title = string(data?.episode);
  if (!title) return null;
  const details = object(data?.donghua_details);
  const streaming = object(data?.streaming);
  const candidates = [streaming?.main_url, ...(Array.isArray(streaming?.servers) ? streaming.servers : [])];
  const candidatesWithUrls = candidates.flatMap((entry, index) => {
    const server = object(entry);
    const url = streamUrl(server?.url);
    if (!url) return [];
    return [{ id: `donghua-${index}`, label: string(server?.name) || 'Player', url }];
  }).filter((item, index, all) => all.findIndex(other => other.url === item.url) === index).slice(0, 3);
  const verified = await Promise.all(candidatesWithUrls.map(async stream => ({ stream, allowed: await playable(stream.url) })));
  const streams = verified.filter(item => item.allowed).map(item => item.stream);
  return {
    title,
    seriesTitle: string(details?.title) || title,
    seriesSlug: validSlug(details?.slug),
    poster: posterUrl(details?.poster),
    episodes: episodes(data?.episodes_list),
    streams,
  };
}
