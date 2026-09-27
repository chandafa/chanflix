'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bookmark, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { removeFromWatchlist, subscribeToWatchlist, type WatchlistItem } from '@/lib/watchlist';
import { Button } from '@/components/ui/button';

export default function WatchlistPage() {
  const { user, initialized } = useAuthStore();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) return;
    if (!user) return;
    return subscribeToWatchlist(user.uid, data => { setItems(data); setLoadedUserId(user.uid); setError(''); }, () => { setError('Wishlist gagal dimuat. Periksa koneksi dan aturan Firestore.'); setLoadedUserId(user.uid); });
  }, [initialized, user]);

  async function remove(itemId: string) {
    if (!user) return;
    setDeleting(itemId);
    try { await removeFromWatchlist(user.uid, itemId); }
    catch { setError('Judul belum dapat dihapus. Coba lagi.'); }
    finally { setDeleting(null); }
  }

  return <div className="page-body container">
    <header className="page-heading"><div><p className="overline">Koleksi pribadi</p><h1>Wishlist saya</h1><p className="muted">Simpan judul untuk dilihat lagi kapan saja.</p></div><Bookmark size={30} className="heading-icon" /></header>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!initialized || (user && loadedUserId !== user.uid) ? <p className="muted">Memuat wishlist...</p> : !user ? <div className="empty-state"><Bookmark size={38} /><h2>Masuk untuk melihat wishlist</h2><p>Judul yang Anda simpan akan muncul di sini dan tersinkron dengan akun.</p><Button asChild><Link href="/login?next=/watchlist">Masuk</Link></Button></div> : items.length === 0 ? <div className="empty-state"><Bookmark size={38} /><h2>Belum ada judul tersimpan</h2><p>Temukan film, serial, atau anime lalu pilih “Tambah ke wishlist”.</p><Button asChild><Link href="/movies">Jelajahi film</Link></Button></div> : <div className="media-grid">{items.map(item => <article className="saved-card" key={item.id}><Link href={`/${item.mediaType}/${item.mediaId}`} className="saved-card-link"><div className="saved-poster">{item.posterUrl ? <Image src={item.posterUrl} alt="" fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover" /> : <Bookmark size={32} />}</div><span className="saved-type">{item.mediaType === 'movie' ? 'Film' : item.mediaType === 'tv' ? 'Serial' : 'Anime'}</span><h2>{item.title}</h2></Link><button className="saved-remove" type="button" onClick={() => remove(item.id)} disabled={deleting === item.id} aria-label={`Hapus ${item.title} dari wishlist`}><Trash2 size={17} /> Hapus</button></article>)}</div>}
  </div>;
}
