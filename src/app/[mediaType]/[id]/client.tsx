'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaCard } from '@/components/media/media-card';
import { AddToWatchlistButton } from '@/components/media/add-to-watchlist-button';
import { AutoRoomButton } from '@/components/watch-party/auto-room-button';
import { getImageUrl, type TMDBDetails, type TMDBCast, type TMDBResponse } from '@/lib/tmdb';
import type { ScrapedStream } from '@/lib/scraped-streams';
import { MoviePlayer } from '@/components/media/movie-player';

interface Props {
  details: TMDBDetails;
  mediaType: 'movie' | 'tv';
  cast: TMDBCast[];
  similar: TMDBResponse | null;
  posterUrl: string | null;
  streams: ScrapedStream[];
}

export function MediaDetailClient({ details, mediaType, cast, similar, posterUrl, streams }: Props) {
  const title = details.title || details.name || 'Tanpa judul';
  const backdrop = getImageUrl(details.backdrop_path, 'original');
  const embedUrl = streams.find(stream => stream.embedUrl)?.embedUrl || null;

  return <div className="detail-page">
    <div className="detail-backdrop">{backdrop && <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover" />}<div className="detail-backdrop-shade" /></div>
    <div className="container detail-content">
      <div className="detail-poster">{posterUrl ? <Image src={posterUrl} alt={`Poster ${title}`} fill sizes="(max-width: 768px) 44vw, 300px" className="object-cover" /> : <div className="h-full grid place-items-center">Tanpa poster</div>}</div>
      <main className="detail-main">
        <p className="overline">{mediaType === 'movie' ? 'Film' : 'Serial'} · {(details.release_date || details.first_air_date)?.slice(0, 4) || 'Tahun belum tersedia'}</p>
        <h1>{title}</h1>
        {details.tagline && <p className="detail-original">{details.tagline}</p>}
        <div className="detail-meta">{details.vote_average > 0 && <span><Star size={16} /> {details.vote_average.toFixed(1)}</span>}{details.runtime && <span>{details.runtime} menit</span>}{details.number_of_seasons && <span>{details.number_of_seasons} musim</span>}</div>
        <div className="tag-list">{details.genres?.map(genre => <span key={genre.id}>{genre.name}</span>)}</div>
        <div className="detail-actions">
          <Button asChild size="lg"><a href="#play-film"><Play size={17} /> {embedUrl ? 'Coba putar di sini' : 'Periksa sumber video'}</a></Button>
          <AutoRoomButton media={{ id: details.id, title, posterPath: posterUrl, mediaType }} source={embedUrl ? { url: embedUrl, kind: 'embed' } : null} />
          <AddToWatchlistButton mediaId={details.id} mediaType={mediaType} title={title} posterUrl={posterUrl} />
        </div>
        <section id="play-film" className="detail-section"><h2>{mediaType === 'movie' ? 'Putar film' : 'Putar serial'}</h2><MoviePlayer title={title} streams={streams} /></section>
        <section className="detail-section"><h2>Sinopsis</h2><p>{details.overview || 'Sinopsis belum tersedia.'}</p></section>
        {cast.length > 0 && <section className="detail-section"><h2>Pemeran</h2><div className="cast-strip">{cast.slice(0, 8).map(person => <div key={person.id}><strong>{person.name}</strong><small>{person.character}</small></div>)}</div></section>}
        {similar?.results?.length ? <section className="detail-section"><div className="home-section-head"><h2>Anda mungkin suka</h2><Link href="/search">Cari lainnya</Link></div><div className="media-grid">{similar.results.slice(0, 6).map(item => <MediaCard key={item.id} item={item} mediaType={mediaType} />)}</div></section> : null}
      </main>
    </div>
  </div>;
}
