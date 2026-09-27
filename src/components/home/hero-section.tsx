import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Play, Star } from 'lucide-react';
import { getImageUrl, type TMDBMovie } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';

export function HeroSection({ media }: { media: TMDBMovie }) {
  const title = media.title || media.name || 'Film pilihan';
  const image = getImageUrl(media.backdrop_path || media.poster_path, 'original');
  return <section className="home-hero"><div className="container home-hero-inner"><div className="home-hero-copy"><p className="overline">Pilihan minggu ini</p><h1>{title}</h1><div className="home-hero-meta">{media.release_date?.slice(0, 4)}{media.vote_average > 0 && <span><Star size={15} fill="currentColor" /> {media.vote_average.toFixed(1)}</span>}</div><p className="home-hero-description">{media.overview || 'Temukan cerita pilihan dan simpan untuk ditonton nanti.'}</p><div className="home-hero-actions"><Button asChild size="lg"><Link href={`/movie/${media.id}`}><Play size={18} /> Lihat detail</Link></Button><Link href="/movies" className="hero-text-link">Jelajahi film <ArrowRight size={18} /></Link></div></div>{image && <div className="home-hero-art"><Image src={image} alt={`Cuplikan ${title}`} fill priority sizes="(max-width: 800px) 100vw, 60vw" className="object-cover" /></div>}</div></section>;
}
