import Image from 'next/image';
import Link from 'next/link';
import { Film, Star } from 'lucide-react';
import { getImageUrl, type TMDBMovie } from '@/lib/tmdb';
import type { AnilistMedia } from '@/lib/anilist';

export function MediaCard({ item, mediaType, source = 'tmdb' }: { item: TMDBMovie | AnilistMedia; mediaType: 'movie' | 'tv' | 'anime'; source?: 'tmdb' | 'anilist' }) {
  const isAnime = source === 'anilist';
  const anime = item as AnilistMedia, media = item as TMDBMovie;
  const title = isAnime ? anime.title.romaji || anime.title.english || 'Anime' : media.title || media.name || 'Tanpa judul';
  const poster = isAnime ? anime.coverImage.large : getImageUrl(media.poster_path, 'w500');
  const score = isAnime ? (anime.averageScore || 0) / 10 : media.vote_average;
  const year = isAnime ? anime.seasonYear : (media.release_date || media.first_air_date)?.slice(0, 4);
  return <Link href={`/${mediaType}/${item.id}`} className="media-card" aria-label={`Lihat ${title}`}><div className="media-card-poster">{poster ? <Image src={poster} alt={`Poster ${title}`} fill sizes="(max-width: 640px) 50vw, (max-width: 900px) 33vw, 17vw" className="object-cover" /> : <div className="h-full grid place-items-center"><Film size={30} className="text-muted-foreground" /></div>}{score > 0 && <span className="media-card-score"><Star size={11} fill="currentColor" />{score.toFixed(1)}</span>}</div><h3 className="media-card-title">{title}</h3><p className="media-card-meta">{mediaType === 'movie' ? 'Film' : mediaType === 'tv' ? 'Serial' : 'Anime'}{year ? ` · ${year}` : ''}</p></Link>;
}
