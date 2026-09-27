import Image from 'next/image';
import Link from 'next/link';
import type { KebioskopFilm } from '@/lib/kebioskop21';

export function KebioskopFilmCard({ film }: { film: KebioskopFilm }) {
  return <Link href={`/movies/kebioskop21/${film.slug}`} className="media-card" aria-label={`Lihat ${film.title}`}>
    <div className="media-card-poster"><Image src={film.posterUrl} alt={`Poster ${film.title}`} fill sizes="(max-width: 640px) 50vw, (max-width: 900px) 33vw, 17vw" className="object-cover" /></div>
    <h3 className="media-card-title">{film.title}</h3>
    <p className="media-card-meta">KeBioskop21{film.year ? ` · ${film.year}` : ''}</p>
  </Link>;
}
