'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  animeId: number;
  totalEpisodes: number | null;
  episodeNumbers: number[];
}

export function AnimeEpisodeList({ animeId, totalEpisodes, episodeNumbers }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [requestedEpisode, setRequestedEpisode] = useState('');
  const router = useRouter();
  const numbers = episodeNumbers.length ? episodeNumbers : totalEpisodes && totalEpisodes > 0 ? Array.from({ length: Math.min(totalEpisodes, 2000) }, (_, index) => totalEpisodes - index) : [];
  const shown = expanded ? numbers : numbers.slice(0, 24);

  function openEpisode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const number = Number(requestedEpisode);
    if (Number.isInteger(number) && number > 0 && number < 10000 && (!totalEpisodes || number <= totalEpisodes)) router.push(`/anime/${animeId}/episode/${number}`);
  }

  return <section className="episodes-panel" id="episodes">
    <div className="episodes-heading"><h2>Episode</h2><p>{episodeNumbers.length ? `${episodeNumbers.length} episode ditemukan dari sumber` : totalEpisodes ? `${totalEpisodes} episode · sumber diperiksa saat dibuka` : 'Cari episode berdasarkan nomor'}</p></div>
    {shown.length > 0 && <div className="episode-grid">{shown.map(number => <Link key={number} href={`/anime/${animeId}/episode/${number}`} className="episode-tile"><span>Episode {String(number).padStart(2, '0')}</span><small><Play size={13} /> Periksa video</small></Link>)}</div>}
    {numbers.length > 24 && <Button variant="outline" onClick={() => setExpanded(!expanded)} className="episode-more">{expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}{expanded ? 'Tampilkan lebih sedikit' : `Lihat semua ${numbers.length} episode`}</Button>}
    <form className="episode-jump" onSubmit={openEpisode}><label htmlFor="episode-number">Buka nomor episode</label><input id="episode-number" type="number" min="1" max={totalEpisodes || 9999} value={requestedEpisode} onChange={event => setRequestedEpisode(event.target.value)} placeholder="Nomor episode" /><Button type="submit" variant="outline">Buka</Button></form>
  </section>;
}
