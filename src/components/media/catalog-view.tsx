import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { MediaCard } from './media-card';
import { getImageUrl, type TMDBMovie } from '@/lib/tmdb';
import type { AnilistMedia } from '@/lib/anilist';

type Section = { title: string; description: string; items: (TMDBMovie | AnilistMedia)[] };

export function CatalogView({ title, description, type, sections }: { title: string; description: string; type: 'movie' | 'tv' | 'anime'; sections: Section[] }) {
  const first = sections.flatMap(section => section.items)[0];
  const isAnime = type === 'anime';
  const feature = first && (isAnime ? first as AnilistMedia : first as TMDBMovie);
  const image = feature ? isAnime ? (feature as AnilistMedia).bannerImage || (feature as AnilistMedia).coverImage.extraLarge : getImageUrl((feature as TMDBMovie).backdrop_path || (feature as TMDBMovie).poster_path, 'original') : null;
  const featureTitle = feature ? isAnime ? (feature as AnilistMedia).title.romaji : (feature as TMDBMovie).title || (feature as TMDBMovie).name : '';
  return <div className="catalog-page"><header className="catalog-hero"><div className="container catalog-hero-inner"><div className="catalog-hero-copy"><p className="overline">Jelajahi Chanflix</p><h1>{title}</h1><p>{description}</p><div className="catalog-pills"><Link href="/search">Cari judul <ArrowUpRight size={15} /></Link><Link href="/watchlist">Wishlist saya <ArrowUpRight size={15} /></Link></div></div>{image && <Link href={`/${type}/${first.id}`} className="catalog-feature"><Image src={image} alt="" fill priority sizes="(max-width: 700px) 100vw, 50vw" className="object-cover" /><div className="catalog-feature-shade" /><span>Pilihan saat ini <strong>{featureTitle}</strong></span></Link>}</div></header><div className="container catalog-sections">{sections.filter(section => section.items.length > 0).map(section => <section key={section.title} className="catalog-section"><div className="section-title"><div className="section-title-text"><h2>{section.title}</h2><p>{section.description}</p></div></div><div className="media-grid">{section.items.slice(0, 12).map(item => <MediaCard key={item.id} item={item} mediaType={type} source={isAnime ? 'anilist' : 'tmdb'} />)}</div></section>)}{sections.every(section => !section.items.length) && <div className="empty-state"><h2>Katalog belum dapat dimuat</h2><p>Periksa koneksi atau konfigurasi API, lalu coba muat ulang halaman.</p></div>}</div></div>;
}
