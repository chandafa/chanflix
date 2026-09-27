import Link from 'next/link';

export function Footer() {
  return <footer className="site-footer"><div className="container footer-inner"><div><Link href="/" className="footer-brand">chanflix</Link><p>Film, serial, anime, dan donghua dalam satu tempat.</p></div><nav aria-label="Navigasi footer"><Link href="/movies">Film</Link><Link href="/series">Serial</Link><Link href="/anime">Anime</Link><Link href="/donghua">Donghua</Link><Link href="/search">Cari</Link><Link href="/watchlist">Wishlist</Link></nav></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Chanflix</span><span>Data katalog: <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a>, <a href="https://anilist.co/" target="_blank" rel="noopener noreferrer">AniList</a>, dan API Sanka. Video berasal dari server pihak ketiga.</span></div></footer>;
}
