import { notFound } from 'next/navigation';
import { getDetails, getCredits, getSimilar, getVideos, getImageUrl } from '@/lib/tmdb';
import { MediaDetailClient } from './client';
import { getScrapedMovieStreams, type ScrapedStream } from '@/lib/scraped-streams';

interface MediaDetailPageProps {
  params: Promise<{ mediaType: string; id: string }>;
}

export default async function MediaDetailPage({ params }: MediaDetailPageProps) {
  const { mediaType, id } = await params;
  
  if (mediaType !== 'movie' && mediaType !== 'tv') {
    notFound();
  }

  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    notFound();
  }

  const [details, credits, similar, videos] = await Promise.all([
    getDetails(mediaType, numericId).catch(() => null),
    getCredits(mediaType, numericId).catch(() => null),
    getSimilar(mediaType, numericId).catch(() => null),
    getVideos(mediaType, numericId).catch(() => []),
  ]);

  if (!details) {
    notFound();
  }

  const cast = credits?.cast?.slice(0, 12) || [];
  const title = details.title || details.name || 'Tanpa judul';
  const year = (details.release_date || details.first_air_date)?.slice(0, 4) || '';
  const posterUrl = getImageUrl(details.poster_path, 'w342');

  // Stream scraping dari sumber eksternal (dengan validasi judul strictly matching)
  const scrapedStreams = await getScrapedMovieStreams(
    details.original_title || details.original_name || title,
    year
  );

  // Video resmi TMDB (Trailer/Preview HD YouTube yang 100% PASTI SESUAI DENGAN COVER & THUMBNAIL FILM)
  const tmdbStreams: ScrapedStream[] = (videos || [])
    .filter(v => v.site === 'YouTube' && v.key)
    .map(v => ({
      id: `tmdb-${v.id}`,
      label: v.name ? `Trailer Resmi: ${v.name}` : `${v.type || 'Trailer'} Resmi (YouTube)`,
      embedUrl: `https://www.youtube.com/embed/${v.key}?autoplay=0&rel=0`,
      pageUrl: `https://www.youtube.com/watch?v=${v.key}`,
    }));

  // Jika ada stream scraper terverifikasi yang cocok, gabungkan dengan TMDB Official Videos
  // Trailer Resmi TMDB akan ditempatkan sebagai opsi utama agar pasti sesuai dengan cover/thumbnail film.
  const streams: ScrapedStream[] = [...tmdbStreams, ...scrapedStreams];

  return (
    <MediaDetailClient
      details={details}
      mediaType={mediaType}
      cast={cast}
      similar={similar}
      posterUrl={posterUrl}
      streams={streams}
    />
  );
}
