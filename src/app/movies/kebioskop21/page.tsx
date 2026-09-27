import Link from 'next/link';
import { getKebioskopFilms } from '@/lib/kebioskop21';
import { KebioskopFilmCard } from '@/components/media/kebioskop-film-card';

export default async function KebioskopCatalogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Math.min(1000, Number(rawPage) || 1));
  const { items, hasNext } = await getKebioskopFilms(page);
  return <main className="container source-catalog-page">
    <Link href="/movies" className="text-link">← Semua film</Link>
    <header className="source-catalog-heading"><p className="overline">Katalog sumber</p><h1>Film dari KeBioskop21</h1><p>Daftar film diperbarui dari kategori film KeBioskop21. Buka judul untuk memeriksa sumber videonya.</p></header>
    {items.length ? <div className="media-grid">{items.map(film => <KebioskopFilmCard key={film.slug} film={film} />)}</div> : <div className="empty-state"><h2>Daftar film belum dapat dimuat</h2><p>Sumber sedang tidak tersedia. Coba lagi nanti.</p></div>}
    <nav className="source-pagination" aria-label="Halaman katalog">{page > 1 && <Link href={`/movies/kebioskop21?page=${page - 1}`}>← Sebelumnya</Link>}<span>Halaman {page}</span>{hasNext && <Link href={`/movies/kebioskop21?page=${page + 1}`}>Berikutnya →</Link>}</nav>
  </main>;
}
