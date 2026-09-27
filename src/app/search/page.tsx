'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MediaCard } from '@/components/media/media-card';
import type { TMDBMovie } from '@/lib/tmdb';
import type { AnilistMedia } from '@/lib/anilist';

type Filter = 'all' | 'movie' | 'tv' | 'anime';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [anime, setAnime] = useState<AnilistMedia[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!submitted.trim()) return;
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(submitted)}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Gagal mencari judul.');
      return response.json() as Promise<{ movies: TMDBMovie[]; anime: AnilistMedia[] }>;
    }).then(data => { setMovies(data.movies); setAnime(data.anime); setError(''); }).catch(cause => { if (cause.name !== 'AbortError') setError('Pencarian gagal. Periksa koneksi lalu coba lagi.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [submitted]);

  function submit(event: FormEvent) { event.preventDefault(); const value = query.trim(); setLoading(!!value); if (!value) { setMovies([]); setAnime([]); } setSubmitted(value); setFilter('all'); window.history.replaceState(null, '', value ? `/search?q=${encodeURIComponent(value)}` : '/search'); }
  const visibleMovies = movies.filter(item => filter === 'all' || filter === item.media_type || (filter === 'movie' && !item.media_type));
  const visibleAnime = filter === 'all' || filter === 'anime' ? anime : [];
  const count = visibleMovies.length + visibleAnime.length;

  return <div className="page-body container"><header className="page-heading"><div><p className="overline">Jelajahi katalog</p><h1>Cari cerita.</h1><p className="muted">Cari film, serial, atau anime berdasarkan judul.</p></div><Search className="heading-icon" size={30} /></header><form onSubmit={submit} className="search-form"><Search size={20} /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Contoh: Spirited Away" aria-label="Cari judul" /><Button type="submit">Cari</Button></form>{submitted && <div className="search-filters">{([{ id: 'all', label: 'Semua' }, { id: 'movie', label: 'Film' }, { id: 'tv', label: 'Serial' }, { id: 'anime', label: 'Anime' }] as { id: Filter; label: string }[]).map(item => <button type="button" key={item.id} onClick={() => setFilter(item.id)} className={filter === item.id ? 'active' : ''}>{item.label}</button>)}</div>}{error && <p className="form-error" role="alert">{error}</p>}{loading ? <p className="muted search-feedback">Mencari “{submitted}”...</p> : submitted ? count ? <><p className="muted search-feedback">{count} hasil untuk “{submitted}”</p><div className="media-grid">{visibleMovies.map(item => <MediaCard key={`tmdb-${item.id}`} item={item} mediaType={item.media_type === 'tv' ? 'tv' : 'movie'} />)}{visibleAnime.map(item => <MediaCard key={`anime-${item.id}`} item={item} mediaType="anime" source="anilist" />)}</div></> : <div className="empty-state"><Search size={34} /><h2>Belum ada hasil</h2><p>Coba judul lain atau gunakan kata yang lebih singkat.</p></div> : <div className="empty-state"><Search size={34} /><h2>Mulai dengan judul</h2><p>Semua film, serial, dan anime dapat dicari dari satu tempat.</p></div>}</div>;
}
