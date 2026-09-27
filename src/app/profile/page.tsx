'use client';

import Link from 'next/link';
import { Bookmark, LogOut, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

export default function ProfilePage() {
  const router = useRouter();
  const { user, initialized, signOut } = useAuthStore();
  async function logout() { await signOut(); router.replace('/'); }
  if (!initialized) return <div className="page-body container"><p className="muted">Memuat profil...</p></div>;
  if (!user) return <div className="page-body container"><div className="empty-state"><UserRound size={38} /><h1>Masuk untuk melihat profil</h1><p>Kelola akun dan wishlist Anda dari satu tempat.</p><Button asChild><Link href="/login?next=/profile">Masuk</Link></Button></div></div>;
  return <div className="page-body container"><header className="page-heading"><div><p className="overline">Akun Chanflix</p><h1>Profil saya</h1><p className="muted">Kelola daftar tontonan dan sesi akun Anda.</p></div><UserRound size={30} className="heading-icon" /></header><div className="profile-grid"><section className="profile-panel"><span className="profile-avatar">{(user.displayName || user.email || 'U').charAt(0).toUpperCase()}</span><h2>{user.displayName || 'Pengguna Chanflix'}</h2><p>{user.email}</p><Button variant="outline" onClick={logout}><LogOut size={16} /> Keluar dari akun</Button></section><section className="profile-panel profile-links"><h2>Koleksi Anda</h2><p>Semua judul tersimpan dapat dilihat di wishlist.</p><Link href="/watchlist"><Bookmark size={22} /><span>Wishlist saya</span><span>→</span></Link><Link href="/movies">Jelajahi film <span>→</span></Link></section></div></div>;
}
