import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MoviePlayer } from '@/components/media/movie-player';
import { AutoRoomButton } from '@/components/watch-party/auto-room-button';
import { getDonghuaEpisode } from '@/lib/sanka-donghua';

export default async function DonghuaEpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const episode = await getDonghuaEpisode(slug);
  if (!episode) notFound();
  const mediaId = [...slug].reduce((hash, character) => (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0, 0);
  const source = episode.streams[0];

  return <main className="container watch-page">
    <Link href={episode.seriesSlug ? `/donghua/${episode.seriesSlug}` : '/donghua'} className="text-link">← Semua episode</Link>
    <header className="watch-heading"><div><p className="overline">{episode.seriesTitle}</p><h1>{episode.title}</h1></div><span>Donghua · API Sanka</span></header>
    <div className="watch-actions"><AutoRoomButton media={{ id: mediaId, title: episode.title, posterPath: episode.poster, mediaType: 'anime', path: `/donghua/episode/${slug}` }} source={source ? { url: source.url, kind: 'embed' } : null} /></div>
    <MoviePlayer title={episode.title} streams={episode.streams.map(item => ({ id: item.id, label: item.label, embedUrl: item.url, pageUrl: `https://www.sankavollerei.web.id/anime/donghua/episode/${slug}` }))} />
    {episode.episodes.length > 0 && <section className="episodes-panel"><h2>Episode lain</h2><div className="episode-grid">{episode.episodes.map(item => <Link href={`/donghua/episode/${item.slug}`} key={item.slug} className="episode-tile"><span>{item.title}</span><small>{item.slug === slug ? 'Sedang dibuka' : 'Putar episode'}</small></Link>)}</div></section>}
  </main>;
}
