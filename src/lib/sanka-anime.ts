import 'server-only';
import type { AnilistMedia } from './anilist';
import { episodeNumber } from './anime-episodes';

type RecordValue = Record<string, unknown>;

export interface SankaEpisodeSource {
  provider: string;
  url: string;
  kind: 'video' | 'embed' | 'external';
}

const PROVIDERS = {
  otakudesu: 'Otakudesu',
  samehadaku: 'Samehadaku',
  donghua: 'Donghua',
  donghub: 'Donghub',
} as const;

const requestTimes: number[] = [];
let blockedUntil = 0;

function record(value: unknown): RecordValue | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function field(item: RecordValue, ...names: string[]) {
  for (const name of names) {
    const value = text(item[name]);
    if (value) return value;
  }
  return null;
}

function objects(value: unknown, depth = 0): RecordValue[] {
  if (depth > 5) return [];
  if (Array.isArray(value)) return value.slice(0, 1500).flatMap(item => objects(item, depth + 1));
  const item = record(value);
  if (!item) return [];
  return [item, ...Object.values(item).slice(0, 30).flatMap(child => objects(child, depth + 1))];
}

function normalizeTitle(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/\b(sub(?:title)?\s*indo(?:nesia)?|dub(?:bed)?|batch)\b/gi, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password && !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname) && !/\.(jpe?g|png|webp|gif|pdf|zip|rar)$/i.test(url.pathname) ? url.toString() : null;
  } catch { return null; }
}

function slug(value: string): string | null {
  const url = safeUrl(value);
  const path = url ? new URL(url).pathname : value;
  const last = path.split('/').filter(Boolean).at(-1);
  return last && /^[\w%-]{2,160}$/.test(last) ? last : null;
}

function endpoint(provider: keyof typeof PROVIDERS, action: 'search' | 'detail' | 'episode' | 'server', value: string) {
  if (provider === 'otakudesu') return `${action === 'detail' ? 'anime' : action}/${encodeURIComponent(value)}`;
  if (provider === 'samehadaku') return action === 'search' ? `samehadaku/search?q=${encodeURIComponent(value)}` : `samehadaku/${action === 'detail' ? 'anime' : action}/${encodeURIComponent(value)}`;
  return `${provider}/${action}/${encodeURIComponent(value)}`;
}

async function apiRequest(provider: keyof typeof PROVIDERS, action: 'search' | 'detail' | 'episode' | 'server', value: string): Promise<unknown> {
  const base = process.env.SANKA_ANIME_API_URL || 'https://www.sankavollerei.web.id/anime/';
  const now = Date.now();
  if (now < blockedUntil) return null;
  while (requestTimes.length && requestTimes[0] < now - 60_000) requestTimes.shift();
  // The published limit is 60/minute. Reserve headroom for other app instances.
  if (requestTimes.length >= 40) return null;
  requestTimes.push(now);
  const url = new URL(endpoint(provider, action, value), base.endsWith('/') ? base : `${base}/`);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3500),
      next: { revalidate: action === 'episode' ? 60 * 30 : 60 * 60 * 6 },
    });
    if (response.status === 429) { blockedUntil = Date.now() + 5 * 60_000; return null; }
    if (response.status === 403) {
      const message = await response.text();
      if (message.includes('Plana AI Detector')) blockedUntil = Date.now() + 5 * 60_000;
      return null;
    }
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) return null;
    const length = Number(response.headers.get('content-length'));
    if (Number.isFinite(length) && length > 500_000) return null;
    return await response.json();
  } catch { return null; }
}

function findAnime(data: unknown, anime: AnilistMedia) {
  const titles = [anime.title.romaji, anime.title.english, anime.title.native, ...(anime.synonyms || [])].filter((item): item is string => Boolean(item)).map(normalizeTitle);
  return objects(data).find(item => {
    const title = field(item, 'title', 'anime_title', 'animeTitle', 'name');
    const id = field(item, 'slug', 'anime_slug', 'animeSlug', 'anime_id', 'animeId', 'endpoint', 'href', 'url', 'link');
    return title && id && titles.includes(normalizeTitle(title));
  }) || null;
}

function findEpisode(data: unknown, number: number) {
  return objects(data).find(item => {
    const id = field(item, 'slug', 'episode_slug', 'episodeSlug', 'episode_id', 'episodeId', 'episode_endpoint', 'episodeEndpoint', 'endpoint', 'href', 'url', 'link');
    return id && episodeNumberFromItem(item) === number;
  }) || null;
}

function episodeNumberFromItem(item: RecordValue): number | null {
  const raw = item.eps ?? item.episode_number ?? item.episodeNumber ?? item.episode ?? item.number;
  if (typeof raw === 'number') return Number.isInteger(raw) && raw > 0 ? raw : null;
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) return Number(raw);
  return episodeNumber(`${typeof raw === 'string' ? raw : ''} ${field(item, 'title', 'episode_title', 'episodeTitle', 'name') || ''}`);
}

function episodeLinks(data: unknown, provider: string, fallback: RecordValue, allowGenericUrl = false): SankaEpisodeSource[] {
  const found: SankaEpisodeSource[] = [];
  for (const item of objects(data)) {
    const streamKeys = ['defaultStreamingUrl', 'streaming_link', 'streamingLink', 'streaming_url', 'streamingUrl', 'stream_url', 'streamUrl', 'video_url', 'videoUrl', 'embed_url', 'embedUrl', 'iframe_url', 'iframeUrl', 'player_url', 'playerUrl'];
    const values = [...streamKeys.map(key => text(item[key])), ...((allowGenericUrl || field(item, 'quality', 'server', 'server_name', 'serverName')) ? [field(item, 'url', 'link')] : [])];
    for (const value of values) {
      const url = value && safeUrl(value);
      if (url) found.push({ provider, url, kind: /\.(mp4|webm)(?:$|\?)/i.test(url) && url.startsWith('https:') ? 'video' : 'external' });
    }
    const iframe = field(item, 'iframe', 'embed');
    const src = iframe?.match(/<iframe\b[^>]*\bsrc=["']([^"']+)/i)?.[1];
    const iframeUrl = src && safeUrl(src);
    if (iframeUrl) found.push({ provider, url: iframeUrl, kind: 'external' });
  }
  const episodePage = field(fallback, 'anichinUrl', 'otakudesuUrl', 'samehadakuUrl', 'donghubUrl', 'url', 'link');
  const pageUrl = episodePage && safeUrl(episodePage);
  if (pageUrl && !new URL(pageUrl).hostname.endsWith('sankavollerei.web.id')) found.push({ provider, url: pageUrl, kind: 'external' });
  return found.filter((source, index) => found.findIndex(item => item.url === source.url) === index).slice(0, 4);
}

function serverId(data: unknown): { id: string; label: string } | null {
  const root = record(data);
  const payload = record(root?.data) || root;
  const server = record(payload?.server);
  const qualities = Array.isArray(server?.qualities) ? server.qualities : [];
  for (const resolution of ['720p', '480p', '360p']) {
    const quality = qualities.map(record).find(item => item && field(item, 'title', 'name')?.toLowerCase().includes(resolution));
    const list = quality && Array.isArray(quality.serverList) ? quality.serverList.map(record) : [];
    const filedon = list.find(item => item && /filedon/i.test(field(item, 'title', 'name') || ''));
    const id = filedon && field(filedon, 'serverId', 'server_id');
    if (id && /^[\w-]{3,90}$/.test(id)) return { id, label: `FileDon ${resolution}` };
  }
  const servers = objects(data).map(item => ({ id: field(item, 'serverId', 'server_id') || (field(item, 'quality', 'server', 'label') ? field(item, 'id') : null), quality: field(item, 'quality', 'label', 'name') || '' })).filter((item): item is { id: string; quality: string } => Boolean(item.id && /^[\w-]{3,90}$/.test(item.id)));
  const selected = servers.find(item => /720/.test(item.quality || item.id)) || servers[0];
  return selected ? { id: selected.id, label: selected.quality || 'Server' } : null;
}

async function verifyEmbed(source: SankaEpisodeSource): Promise<SankaEpisodeSource> {
  const url = new URL(source.url);
  if (url.protocol !== 'https:' || url.hostname !== 'filedon.co' || !url.pathname.startsWith('/embed/')) return source;
  try {
    const response = await fetch(source.url, { method: 'HEAD', signal: AbortSignal.timeout(2500), next: { revalidate: 60 * 60 } });
    const xFrameOptions = response.headers.get('x-frame-options');
    const csp = response.headers.get('content-security-policy');
    if (response.ok && !xFrameOptions && !csp?.includes('frame-ancestors')) return { ...source, kind: 'embed' };
  } catch { /* Keep an external link if the player cannot be checked. */ }
  return source;
}

async function fromProvider(provider: keyof typeof PROVIDERS, anime: AnilistMedia, number: number): Promise<SankaEpisodeSource[]> {
  const titles = anime.countryOfOrigin === 'CN' ? [anime.title.english, anime.title.romaji] : [anime.title.romaji, anime.title.english];
  const queries = [...new Set(titles.filter((item): item is string => Boolean(item)))].slice(0, 2);
  let match: RecordValue | null = null;
  for (const query of queries) {
    const search = await apiRequest(provider, 'search', query);
    match = findAnime(search, anime);
    if (match) break;
  }
  const animeSlug = match && slug(field(match, 'slug', 'anime_slug', 'animeSlug', 'anime_id', 'animeId', 'endpoint', 'href', 'url', 'link') || '');
  if (!animeSlug) return [];
  const details = await apiRequest(provider, 'detail', animeSlug);
  const episode = findEpisode(details, number);
  const episodeSlug = episode && slug(field(episode, 'slug', 'episode_slug', 'episodeSlug', 'episode_id', 'episodeId', 'episode_endpoint', 'episodeEndpoint', 'endpoint', 'href', 'url', 'link') || '');
  if (!episodeSlug || !episode) return [];
  const data = await apiRequest(provider, 'episode', episodeSlug);
  const direct = episodeLinks(data, PROVIDERS[provider], episode);
  if (direct.some(item => item.kind === 'video') || (provider !== 'otakudesu' && provider !== 'samehadaku')) return direct;
  const selectedServer = serverId(data);
  if (!selectedServer) return direct;
  const server = await apiRequest(provider, 'server', selectedServer.id);
  const resolved = await Promise.all(episodeLinks(server, `${PROVIDERS[provider]} · ${selectedServer.label}`, episode, true).map(verifyEmbed));
  return [...resolved, ...direct].filter((item, index, all) => all.findIndex(other => other.url === item.url) === index).slice(0, 5);
}

export async function getSankaEpisodeSources(anime: AnilistMedia, number: number): Promise<{ sources: SankaEpisodeSource[]; blocked: boolean }> {
  const providers: (keyof typeof PROVIDERS)[] = anime.countryOfOrigin === 'CN' ? ['donghua', 'donghub'] : ['otakudesu', 'samehadaku'];
  const results = await Promise.all(providers.map(provider => fromProvider(provider, anime, number)));
  const rank = { video: 2, embed: 1, external: 0 };
  return { sources: results.flat().sort((a, b) => rank[b.kind] - rank[a.kind]), blocked: blockedUntil > Date.now() };
}

export async function getSankaEpisodeNumbers(anime: AnilistMedia): Promise<number[]> {
  const providers: (keyof typeof PROVIDERS)[] = anime.countryOfOrigin === 'CN' ? ['donghua', 'donghub'] : ['otakudesu', 'samehadaku'];
  const titles = [anime.title.romaji, anime.title.english].filter((item): item is string => Boolean(item));
  for (const provider of providers) {
    for (const title of titles) {
      const match = findAnime(await apiRequest(provider, 'search', title), anime);
      const animeSlug = match && slug(field(match, 'slug', 'anime_id', 'animeId', 'href', 'url') || '');
      if (!animeSlug) continue;
      const details = await apiRequest(provider, 'detail', animeSlug);
      const numbers = [...new Set(objects(details).filter(item => field(item, 'episodeId', 'episode_id', 'episodeSlug', 'episode_slug', 'href')).map(item => episodeNumberFromItem(item)).filter((value): value is number => value !== null && value > 0 && value < 10000))];
      if (numbers.length) return numbers.sort((a, b) => b - a);
    }
  }
  return [];
}
