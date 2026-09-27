import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getKebioskopFilmDetail } from '@/lib/kebioskop21';
import { MoviePlayer } from '@/components/media/movie-player';
import { AutoRoomButton } from '@/components/watch-party/auto-room-button';

export default async function KebioskopFilmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const film = await getKebioskopFilmDetail(slug);
  if (!film) notFound();
  const mediaId = [...slug].reduce((hash, character) => (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0, 0);
  return <main className="container source-film-page">
    <Link href="/movies/kebioskop21" className="text-link">← Daftar KeBioskop21</Link>
    <div className="source-film-header"><div className="source-film-poster">{film.posterUrl && <Image src={film.posterUrl} alt={`Poster ${film.title}`} fill sizes="(max-width: 640px) 35vw, 210px" className="object-cover" />}</div><div><p className="overline">Film · KeBioskop21{film.year ? ` · ${film.year}` : ''}</p><h1>{film.title}</h1><p>Player dari sumber akan tampil jika situs video mengizinkan pemutaran di Chanflix.</p></div></div>
    <section className="detail-section"><h2>Putar film</h2><MoviePlayer title={film.title} streams={[{ id: 'kebioskop21', label: 'KeBioskop21', embedUrl: film.embedUrl, pageUrl: film.pageUrl }]} /><div className="source-room-action"><AutoRoomButton media={{ id: mediaId, title: film.title, posterPath: film.posterUrl, mediaType: 'movie', path: `/movies/kebioskop21/${slug}` }} source={film.embedUrl ? { url: film.embedUrl, kind: 'embed' } : null} /></div></section>
  </main>;
}
