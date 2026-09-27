import { notFound } from 'next/navigation';
import { getDetails, getCredits, getSimilar, getImageUrl } from '@/lib/tmdb';
import { MediaDetailClient } from './client';
import { getScrapedMovieStreams } from '@/lib/scraped-streams';

interface MediaDetailPageProps {
  params: Promise<{ mediaType: string; id: string }>;
}

export default async function MediaDetailPage({ params }: MediaDetailPageProps) {
  const { mediaType, id } = await params;
  
  if (mediaType !== 'movie' && mediaType !== 'tv') {
    notFound();
  }

  const [details, credits, similar] = await Promise.all([
    getDetails(mediaType, parseInt(id)).catch(() => null),
    getCredits(mediaType, parseInt(id)).catch(() => null),
    getSimilar(mediaType, parseInt(id)).catch(() => null),
  ]);

  if (!details) {
    notFound();
  }

  const cast = credits?.cast?.slice(0, 12) || [];
  const title = details.title || details.name || 'Untitled';
  const posterUrl = getImageUrl(details.poster_path, 'w342');
  const streams = await getScrapedMovieStreams(details.original_title || details.original_name || title, (details.release_date || details.first_air_date)?.slice(0, 4) || '');

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
