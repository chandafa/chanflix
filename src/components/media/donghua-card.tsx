import Image from 'next/image';
import Link from 'next/link';
import { Film } from 'lucide-react';
import type { DonghuaItem } from '@/lib/sanka-donghua';

export function DonghuaCard({ item }: { item: DonghuaItem }) {
  return <Link href={`/donghua/episode/${item.slug}`} className="media-card" aria-label={`Tonton ${item.title}`}>
    <div className="media-card-poster">{item.poster ? <Image src={item.poster} alt={`Poster ${item.title}`} fill sizes="(max-width: 640px) 50vw, (max-width: 900px) 33vw, 17vw" className="object-cover" /> : <div className="h-full grid place-items-center"><Film size={30} /></div>}</div>
    <h3 className="media-card-title">{item.title}</h3>
    <p className="media-card-meta">Donghua{item.episode ? ` · ${item.episode}` : ''}</p>
  </Link>;
}
