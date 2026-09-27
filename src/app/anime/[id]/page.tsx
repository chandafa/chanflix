import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';
import { getAnimeDetails } from '@/lib/anilist';
import { getSankaEpisodeNumbers } from '@/lib/sanka-anime';
import { AnimeDetailClient } from './client';
import { AnimeEpisodeList } from '@/components/media/anime-episode-list';

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mediaId = Number(id);
  if (!Number.isInteger(mediaId) || mediaId <= 0) notFound();
  const anime = await getAnimeDetails(mediaId);
  if (!anime) notFound();
  const episodeNumbers = await getSankaEpisodeNumbers(anime);
  const title = anime.title.romaji || anime.title.english || 'Anime';
  const description = (anime.description || 'Sinopsis belum tersedia.').replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
  return <div className="detail-page"><div className="detail-backdrop">{anime.bannerImage && <Image src={anime.bannerImage} alt="" fill priority sizes="100vw" className="object-cover" />}<div className="detail-backdrop-shade" /></div><div className="container detail-content"><div className="detail-poster"><Image src={anime.coverImage.extraLarge || anime.coverImage.large} alt={`Poster ${title}`} fill sizes="(max-width: 768px) 44vw, 300px" className="object-cover" /></div><main className="detail-main"><p className="overline">Anime · {anime.seasonYear || 'Tahun belum tersedia'}</p><h1>{title}</h1>{anime.title.native && <p className="detail-original">{anime.title.native}</p>}<div className="detail-meta">{anime.averageScore && <span><Star size={16} /> {(anime.averageScore / 10).toFixed(1)}</span>}{anime.format && <span>{anime.format}</span>}{anime.episodes && <span>{anime.episodes} episode</span>}{anime.duration && <span>{anime.duration} menit / episode</span>}</div><div className="tag-list">{anime.genres.map(genre => <span key={genre}>{genre}</span>)}</div><AnimeDetailClient anime={anime} title={title} firstEpisode={episodeNumbers[0] || 1} /><section className="detail-section"><h2>Sinopsis</h2><p>{description}</p></section><AnimeEpisodeList animeId={anime.id} totalEpisodes={anime.episodes} episodeNumbers={episodeNumbers} /></main></div></div>;
}
