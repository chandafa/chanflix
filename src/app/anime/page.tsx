import { CatalogView } from '@/components/media/catalog-view';
import { getTrendingAnime, getPopularAnime, getTopRatedAnime, getUpcomingAnime } from '@/lib/anilist';

export default async function AnimePage() {
  const [trending, popular, top, upcoming] = await Promise.all([getTrendingAnime(), getPopularAnime(), getTopRatedAnime(), getUpcomingAnime()]);
  return <CatalogView title="Dunia tanpa batas." description="Jelajahi anime, pilih episode, dan temukan sumber menonton yang tersedia." type="anime" sections={[{ title: 'Sedang ramai', description: 'Anime yang paling sering dicari', items: trending?.media || [] }, { title: 'Favorit penonton', description: 'Serial anime paling populer', items: popular?.media || [] }, { title: 'Rating tertinggi', description: 'Pilihan dengan skor terbaik', items: top?.media || [] }, { title: 'Segera hadir', description: 'Cerita berikutnya', items: upcoming?.media || [] }]} />;
}
