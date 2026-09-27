'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, Menu, Search, UserRound, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Beranda' },
  { href: '/movies', label: 'Film' },
  { href: '/series', label: 'Serial' },
  { href: '/anime', label: 'Anime' },
  { href: '/donghua', label: 'Donghua' },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, initialized } = useAuthStore();

  return (
    <header className="site-header">
      <nav className="container nav-inner" aria-label="Navigasi utama">
        <Link href="/" className="brand" onClick={() => setOpen(false)} aria-label="Chanflix beranda"><span className="brand-symbol">C</span><span>chanflix</span></Link>
        <div className="nav-links">
          {links.map(link => <Link key={link.href} href={link.href} className={cn('nav-link', (pathname === link.href || (link.href !== '/' && pathname.startsWith(`${link.href}/`))) && 'active')}>{link.label}</Link>)}
        </div>
        <div className="nav-actions">
          <Link href="/search" className={cn('nav-icon', pathname === '/search' && 'active')} aria-label="Cari judul"><Search size={20} /></Link>
          <Link href="/watchlist" className={cn('nav-icon', pathname === '/watchlist' && 'active')} aria-label="Wishlist"><Bookmark size={20} /></Link>
          <Link href={user ? '/profile' : '/login'} className="nav-account"><UserRound size={17} /><span>{initialized && user ? user.displayName?.split(' ')[0] || 'Profil' : 'Masuk'}</span></Link>
          <button className="nav-menu" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Tutup menu' : 'Buka menu'}>{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </nav>
      {open && <div className="mobile-nav container">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={cn('mobile-nav-link', (pathname === link.href || (link.href !== '/' && pathname.startsWith(`${link.href}/`))) && 'active')}>{link.label}</Link>)}<Link href="/watchlist" onClick={() => setOpen(false)} className="mobile-nav-link">Wishlist</Link></div>}
    </header>
  );
}
