import 'server-only';

export interface ScrapedStream {
  id: string;
  label: string;
  embedUrl: string | null;
  pageUrl: string;
}

const allowedEmbedHosts = new Set(['playsobat.xyz']);

function slugify(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function plainTitle(html: string) {
  const match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return (match?.[1] || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();
}

function sameMovie(pageTitle: string, title: string, year: string) {
  const normalized = slugify(pageTitle.replace(/\(\d{4}\).*/, ''));
  return normalized === slugify(title) && pageTitle.includes(year);
}

function safeEmbed(url: string) {
  try { const parsed = new URL(url.replace(/&amp;/g, '&')); return parsed.protocol === 'https:' && allowedEmbedHosts.has(parsed.hostname) ? parsed.toString() : null; }
  catch { return null; }
}

async function fetchPage(url: string) {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chanflix/1.0' }, signal: AbortSignal.timeout(8000), next: { revalidate: 60 * 60 * 6 } });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return null;
    const html = await response.text();
    return html.length < 500_000 ? html : null;
  } catch { return null; }
}

async function fromLk21(title: string, year: string): Promise<ScrapedStream[]> {
  const base = process.env.SOURCE_LK21_URL || 'https://tv12.lk21official.cc/';
  const pageUrl = new URL(`${slugify(title)}-${year}`, base).toString();
  const html = await fetchPage(pageUrl);
  if (!html || !sameMovie(plainTitle(html), title, year)) return [];
  // The current videonode iframe responds with X-Frame-Options: SAMEORIGIN.
  // Keep the verified title page available without advertising broken embeds.
  return [{ id: 'lk21-page', label: 'LK21', embedUrl: null, pageUrl }];
}

async function fromIdlixIp(title: string, year: string): Promise<ScrapedStream[]> {
  const base = process.env.SOURCE_IP_URL || 'https://154.203.167.249/';
  const pageUrl = new URL(`${slugify(title)}-${year}/`, base).toString();
  const html = await fetchPage(pageUrl);
  if (!html || !sameMovie(plainTitle(html), title, year)) return [];
  const embedUrl = [...html.matchAll(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)]
    .map(match => safeEmbed(match[1])).find(Boolean);
  return embedUrl ? [{ id: 'idlix-ip', label: 'IDLIX', embedUrl, pageUrl }] : [{ id: 'idlix-ip-page', label: 'IDLIX', embedUrl: null, pageUrl }];
}

export async function getScrapedMovieStreams(title: string, year: string): Promise<ScrapedStream[]> {
  if (!title || !/^\d{4}$/.test(year)) return [];
  const [lk21, idlix] = await Promise.all([fromLk21(title, year), fromIdlixIp(title, year)]);
  return [...idlix, ...lk21];
}
