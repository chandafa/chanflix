import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Play } from 'lucide-react';
import { getAnimeDetails } from '@/lib/anilist';
import { getSankaEpisodeSources } from '@/lib/sanka-anime';
import { DirectVideoPlayer } from '@/components/media/direct-video-player';
import { AutoRoomButton } from '@/components/watch-party/auto-room-button';

export default async function AnimeEpisodePage({ params }: { params: Promise<{ id: string; number: string }> }) {
  const { id, number } = await params;
  const mediaId = Number(id);
  const episode = Number(number);
  if (!Number.isInteger(mediaId) || !Number.isInteger(episode) || mediaId <= 0 || episode <= 0) notFound();

  const anime = await getAnimeDetails(mediaId);
  if (!anime || (anime.episodes && episode > anime.episodes)) notFound();

  const lookup = await getSankaEpisodeSources(anime, episode);
  const directVideo = lookup.sources.find(item => item.kind === 'video');
  const embedSource = lookup.sources.find(item => item.kind === 'embed');
  const title = anime.title.romaji || anime.title.english || 'Anime';

  return <div className="watch-page container">
    <Link href={`/anime/${id}#episodes`} className="text-link">← Semua episode</Link>
    <header className="watch-heading">
      <div><p className="overline">{title}</p><h1>Episode {episode}</h1></div>
      <span>{directVideo?.provider || embedSource?.provider || 'Sumber episode'}</span>
    </header>
    <div className="watch-actions"><AutoRoomButton media={{ id: anime.id, title: `${title} · Episode ${episode}`, posterPath: anime.coverImage.large, mediaType: 'anime' }} source={directVideo ? { url: directVideo.url, kind: 'video' } : embedSource ? { url: embedSource.url, kind: 'embed' } : null} /></div>
    <div className="watch-player">
      {directVideo ? <DirectVideoPlayer title={`${title} episode ${episode}`} url={directVideo.url} provider={directVideo.provider} />
        : embedSource ? <iframe src={embedSource.url} title={`${title} episode ${episode} dari ${embedSource.provider}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms allow-presentation" />
          : <div className="watch-placeholder"><Play size={38} />
            <h2>{lookup.blocked ? 'Sumber sedang menolak akses' : lookup.sources.length ? 'Video belum dapat diputar di Chanflix' : 'Video episode belum tersedia'}</h2>
            <p>{lookup.blocked ? 'API Sanka menolak permintaan server saat ini. Coba lagi nanti.' : lookup.sources.length ? 'Tautan ditemukan, tetapi sumber belum mengizinkan player di Chanflix.' : 'Belum ditemukan tautan yang cocok untuk episode ini.'}</p>
          </div>}
    </div>
    <p className="watch-note">Sumber episode: API Sanka. Ketersediaan video mengikuti server sumber.</p>
  </div>;
}
