'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import type { ScrapedStream } from '@/lib/scraped-streams';

export function MoviePlayer({ title, streams }: { title: string; streams: ScrapedStream[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(() => streams.find(stream => stream.embedUrl)?.id || null);
  const players = streams.filter((stream): stream is ScrapedStream & { embedUrl: string } => Boolean(stream.embedUrl));
  const selected = players.find(stream => stream.id === selectedId) || players[0] || null;
  if (!players.length) return <div className="watch-player"><div className="watch-placeholder"><Play size={38} /><h3>Video belum tersedia di Chanflix</h3><p>{streams.length ? 'Sumber ditemukan, tetapi server video menolak pemutaran di situs ini.' : 'Belum ada sumber video yang cocok untuk judul ini.'}</p></div></div>;
  return <div className="movie-player">
      <div className="watch-player">{selected ? <iframe key={selected.id} src={selected.embedUrl} title={`Pemutar ${title} dari ${selected.label}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms allow-presentation" /> : <div className="watch-placeholder"><Play size={40} /><h3>Coba putar di sini</h3><p>Pilih player yang tersedia. Pemutaran tetap bergantung pada server sumber.</p></div>}</div>
      <div className="server-list" aria-label="Pilihan player">{players.map(stream => <button type="button" key={stream.id} className={selected?.id === stream.id ? 'active' : ''} onClick={() => setSelectedId(stream.id)}>{stream.label}</button>)}</div>
  </div>;
}
