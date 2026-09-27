import { CatalogView } from '@/components/media/catalog-view';
import { getPopular, getTopRated, getOnTheAir, getAiringToday } from '@/lib/tmdb';

export default async function SeriesPage() {
  const [airing, popular, top, today] = await Promise.all([getOnTheAir('tv'), getPopular('tv'), getTopRated('tv'), getAiringToday('tv')]);
  return <CatalogView title="Cerita yang berlanjut." description="Dari episode baru hingga serial favorit, cari kisah untuk maraton berikutnya." type="tv" sections={[{ title: 'Sedang tayang', description: 'Serial yang masih berlangsung', items: airing?.results || [] }, { title: 'Populer sekarang', description: 'Yang ramai dibicarakan', items: popular?.results || [] }, { title: 'Rating tertinggi', description: 'Kisah dengan penilaian terbaik', items: top?.results || [] }, { title: 'Tayang hari ini', description: 'Episode baru yang dinanti', items: today?.results || [] }]} />;
}
