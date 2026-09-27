import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { CatalogView } from '@/components/media/catalog-view';
import { KebioskopFilmCard } from '@/components/media/kebioskop-film-card';
import { getKebioskopFilms } from '@/lib/kebioskop21';
import { getPopular, getTopRated, getNowPlaying, getUpcoming } from '@/lib/tmdb';

export default async function MoviesPage() {
  const [playing, popular, top, upcoming, kebioskop] = await Promise.all([
    getNowPlaying('movie'), getPopular('movie'), getTopRated('movie'), getUpcoming('movie'), getKebioskopFilms(),
  ]);
  return <>
    <CatalogView title="Film untuk setiap suasana." description="Temukan cerita baru, lihat detailnya, lalu simpan yang ingin Anda tonton." type="movie" sections={[{ title: 'Sedang tayang', description: 'Pilihan terbaru di bioskop', items: playing?.results || [] }, { title: 'Paling dicari', description: 'Film populer saat ini', items: popular?.results || [] }, { title: 'Pilihan penonton', description: 'Rating tertinggi dari komunitas', items: top?.results || [] }, { title: 'Segera hadir', description: 'Yang patut masuk daftar Anda', items: upcoming?.results || [] }]} />
    {kebioskop.items.length > 0 && <section className="container catalog-section source-preview"><div className="section-title"><div className="section-title-text"><h2>Film dari KeBioskop21</h2><p>Judul terbaru dari kategori film sumber</p></div><Link href="/movies/kebioskop21" className="text-link">Lihat semua <ArrowUpRight size={16} /></Link></div><div className="media-grid">{kebioskop.items.slice(0, 12).map(film => <KebioskopFilmCard key={film.slug} film={film} />)}</div></section>}
  </>;
}
