import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDonghuaDetail } from '@/lib/sanka-donghua';

export default async function DonghuaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await getDonghuaDetail(slug);
  if (!detail) notFound();

  return <main className="container source-film-page">
    <Link href="/donghua" className="text-link">← Katalog Donghua</Link>
    <div className="source-film-header"><div className="source-film-poster">{detail.poster && <Image src={detail.poster} alt={`Poster ${detail.title}`} fill sizes="(max-width: 640px) 35vw, 210px" className="object-cover" />}</div><div><p className="overline">Donghua</p><h1>{detail.title}</h1>{detail.synopsis && <p>{detail.synopsis.replace(/<[^>]*>/g, '')}</p>}</div></div>
    <section className="detail-section episodes-panel"><h2>Episode</h2>{detail.episodes.length ? <div className="episode-grid">{detail.episodes.map(item => <Link href={`/donghua/episode/${item.slug}`} key={item.slug} className="episode-tile"><span>{item.title}</span><small>Putar episode</small></Link>)}</div> : <p>Daftar episode belum tersedia dari sumber.</p>}</section>
  </main>;
}
