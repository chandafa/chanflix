'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createRoom } from '@/lib/rooms';
import { useAuthStore } from '@/stores/auth-store';

interface Props {
  media: { id: number; title: string; posterPath: string | null; mediaType: 'movie' | 'tv' | 'anime'; path?: string };
  source: { url: string; kind: 'video' | 'embed' } | null;
}

export function AutoRoomButton({ media, source }: Props) {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function create() {
    if (!source) return;
    if (!user) { router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`); return; }
    setBusy(true);
    setError('');
    const isYouTube = source.url.includes('youtube.com') || source.url.includes('youtu.be');
    const videoType: 'youtube' | 'custom' | 'embed' = isYouTube
      ? 'youtube'
      : source.kind === 'video'
        ? 'custom'
        : 'embed';

    try {
      const roomId = await createRoom({
        hostId: user.uid,
        hostName: user.displayName || user.email || 'Host',
        mediaId: media.id,
        mediaType: media.mediaType,
        mediaTitle: media.title,
        mediaPoster: media.posterPath,
        ...(media.path ? { mediaPath: media.path } : {}),
        videoUrl: source.url,
        videoType,
      });
      router.push(`/room/${roomId}`);
    } catch { setError('Room gagal dibuat. Periksa koneksi dan aturan Firestore.'); }
    finally { setBusy(false); }
  }

  return <div className="auto-room-action"><Button size="lg" variant="outline" onClick={create} disabled={!source || busy}><Users size={17} /> {busy ? 'Membuat room...' : 'Nonton bareng'}</Button>{!source && <small>Room tersedia setelah sumber video yang dapat diputar ditemukan.</small>}{error && <small role="alert" className="form-error">{error}</small>}</div>;
}
