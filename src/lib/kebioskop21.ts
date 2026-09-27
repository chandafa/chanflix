import 'server-only';

export interface KebioskopFilm {
  slug: string;
  title: string;
  year: string | null;
  posterUrl: string;
  pageUrl: string;
}

export interface KebioskopFilmDetail extends KebioskopFilm {
  embedUrl: string | null;
}

const configuredBase = process.env.SOURCE_KEBIOSKOP_URL || 'https://kebioskop21.cfd/';
const base = /^https:\/\/kebioskop21\.cfd\/$/i.test(configuredBase) ? configuredBase : 'https://kebioskop21.cfd/';

function decode(value: string) {
  return value.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code: string) => {
    const point = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
    return point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '';
  })
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#039;|&apos;/gi, "'").replace(/&nbsp;/gi, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function sourceUrl(value: string): string | null {
  try {
    const url = new URL(decode(value), base);
    return url.protocol === 'https:' && url.hostname === 'kebioskop21.cfd' ? url.toString() : null;
  } catch { return null; }
}

async function fetchPage(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Accept: 'text/html' }, next: { revalidate: 60 * 60 * 3 } });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return null;
    const length = Number(response.headers.get('content-length'));
    if (Number.isFinite(length) && length > 500_000) return null;
    const html = await response.text();
    return html.length < 500_000 ? html : null;
  } catch { return null; }
}

function filmFromMarkup(href: string, poster: string, rawTitle: string): KebioskopFilm | null {
  const pageUrl = sourceUrl(href);
  const posterUrl = sourceUrl(poster);
  if (!pageUrl || !posterUrl) return null;
  const slug = new URL(pageUrl).pathname.split('/').filter(Boolean).at(-1);
  if (!slug || !/^nonton-[a-z0-9-]+$/.test(slug)) return null;
  const raw = decode(rawTitle);
  const year = raw.match(/\((\d{4})\)/)?.[1] || null;
  const title = raw.replace(/\s*\(\d{4}\)\s*$/, '').trim();
  if (!title) return null;
  return { slug, title, year, posterUrl: posterUrl.replace(/-\d+x\d+(?=\.[^/.]+$)/, ''), pageUrl };
}

export async function getKebioskopFilms(page = 1): Promise<{ items: KebioskopFilm[]; hasNext: boolean }> {
  if (!Number.isInteger(page) || page < 1 || page > 1000) return { items: [], hasNext: false };
  const url = new URL(page === 1 ? 'category/movie/' : `category/movie/page/${page}/`, base).toString();
  const html = await fetchPage(url);
  if (!html) return { items: [], hasNext: false };
  const matches = [...html.matchAll(/<div class="moviefilm">\s*<a href="([^"]+)">\s*<img\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/a>\s*<div class="movief"><a href="[^"]+">([\s\S]*?)<\/a><\/div>/gi)];
  const items = matches.map(match => filmFromMarkup(match[1], match[2], match[3])).filter((film): film is KebioskopFilm => film !== null);
  return { items, hasNext: new RegExp(`<link rel="next" href="https://kebioskop21\\.cfd/category/movie/page/${page + 1}/"`).test(html) };
}

async function embeddable(url: string) {
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000), next: { revalidate: 60 * 60 } });
    const frame = response.headers.get('x-frame-options');
    const csp = response.headers.get('content-security-policy');
    return response.ok && !frame && !csp?.includes('frame-ancestors');
  } catch { return false; }
}

export async function getKebioskopFilmDetail(slug: string): Promise<KebioskopFilmDetail | null> {
  if (!/^nonton-[a-z0-9-]{3,160}$/.test(slug)) return null;
  const pageUrl = new URL(`${slug}/`, base).toString();
  const html = await fetchPage(pageUrl);
  if (!html) return null;
  const titles = [...html.matchAll(/<meta property="og:title" content="([^"]+)"/gi)];
  const rawTitle = decode(titles.at(-1)?.[1] || slug.replace(/^nonton-film-/, '').replace(/-/g, ' ')).replace(/^Nonton Film\s+/i, '').replace(/\s+Sub Indo.*$/i, '');
  const year = rawTitle.match(/\((\d{4})\)/)?.[1] || null;
  const title = rawTitle.replace(/\s*\(\d{4}\)\s*$/, '').trim();
  const posters = [...html.matchAll(/<meta property="og:image" content="([^"]+)"/gi)];
  const posterUrl = sourceUrl(posters.at(-1)?.[1] || '') || '';
  const iframe = html.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1] || '';
  let embedUrl: string | null = null;
  try {
    const candidate = new URL(decode(iframe).replace(/^\/\//, 'https://'));
    if (candidate.protocol === 'https:' && candidate.hostname === 'abysscdn.com' && await embeddable(candidate.toString())) embedUrl = candidate.toString();
  } catch { /* Some film pages do not include a video iframe. */ }
  return { slug, title, year, posterUrl, pageUrl, embedUrl };
}
