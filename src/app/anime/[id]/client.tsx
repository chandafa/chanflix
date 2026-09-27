'use client';

import Link from 'next/link';
import { Play, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddToWatchlistButton } from '@/components/media/add-to-watchlist-button';
import type { AnilistMedia } from '@/lib/anilist';

export function AnimeDetailClient({ anime, title, firstEpisode }: { anime: AnilistMedia; title: string; firstEpisode: number }) {
  return <div className="detail-actions"><Button asChild size="lg"><Link href={`/anime/${anime.id}/episode/${firstEpisode}`}><Play size={17} /> Lihat episode</Link></Button><Button asChild size="lg" variant="outline"><Link href="#episodes"><Users size={17} /> Pilih episode untuk nobar</Link></Button><AddToWatchlistButton mediaId={anime.id} mediaType="anime" title={title} posterUrl={anime.coverImage.extraLarge || anime.coverImage.large} /></div>;
}
