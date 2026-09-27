import Link from 'next/link';
import { DonghuaCard } from '@/components/media/donghua-card';
import { getDonghuaHome } from '@/lib/sanka-donghua';

export default async function DonghuaPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Math.min(20, Number(rawPage) || 1));
  const { latest, completed } = await getDonghuaHome(page);
  const latestSlugs = new Set(latest.map(item => item.slug));
  const finished = completed.filter(item => !latestSlugs.has(item.slug)).slice(0, 18);

  return <main className="container source-catalog-page">
    <header className="source-catalog-heading"><p className="overline">Anime China</p><h1>Donghua</h1><p>Pilih judul untuk memutar episode dari sumber yang tersedia di Chanflix.</p></header>
    {latest.length ? <section className="catalog-section"><div className="section-title"><div className="section-title-text"><h2>Episode terbaru</h2><p>Rilis terkini dari katalog Donghua</p></div></div><div className="media-grid">{latest.map(item => <DonghuaCard key={item.slug} item={item} />)}</div></section> : <div className="empty-state"><h2>Donghua belum dapat dimuat</h2><p>Sumber sedang tidak tersedia. Coba lagi nanti.</p></div>}
    {finished.length > 0 && <section className="catalog-section"><div className="section-title"><div className="section-title-text"><h2>Jelajahi lainnya</h2><p>Pilihan lain dari katalog sumber</p></div></div><div className="media-grid">{finished.map(item => <DonghuaCard key={item.slug} item={item} />)}</div></section>}
    <nav className="source-pagination" aria-label="Halaman donghua">{page > 1 && <Link href={`/donghua?page=${page - 1}`}>← Sebelumnya</Link>}<span>Halaman {page}</span>{latest.length >= 20 && page < 20 && <Link href={`/donghua?page=${page + 1}`}>Berikutnya →</Link>}</nav>
  </main>;
}
