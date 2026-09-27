'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { addToWatchlist, removeFromWatchlist, subscribeToWatchlist } from '@/lib/watchlist';

interface AddToWatchlistButtonProps {
  mediaId: number;
  mediaType: 'movie' | 'tv' | 'anime';
  title: string;
  posterUrl: string | null;
}

export function AddToWatchlistButton({
  mediaId,
  mediaType,
  title,
  posterUrl,
}: AddToWatchlistButtonProps) {
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const [inList, setInList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const itemId = `${mediaType}_${mediaId}`;
  const checking = !!user && checkedUserId !== user.uid;
  const saved = !!user && !checking && inList;

  useEffect(() => {
    if (!initialized) return;
    if (!user) return;

    return subscribeToWatchlist(user.uid, items => {
      setInList(items.some(item => item.id === itemId));
      setCheckedUserId(user.uid);
      setError('');
    }, () => { setCheckedUserId(user.uid); setError('Wishlist gagal dimuat.'); });
  }, [user, initialized, itemId]);

  const handleToggle = async () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      setLoading(true);
      if (saved) {
        await removeFromWatchlist(user.uid, itemId);
        setInList(false);
      } else {
        await addToWatchlist(user.uid, {
          id: itemId,
          mediaId,
          mediaType,
          title,
          posterUrl,
        });
        setInList(true);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      setError('Wishlist gagal diperbarui. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || (!!user && checking);

  return (
    <div><Button
      variant="outline"
      className="w-full"
      onClick={handleToggle}
      disabled={isDisabled}
    >
      {loading || checking ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : saved ? (
        <Check className="w-5 h-5 mr-2 text-green-500" />
      ) : (
        <Plus className="w-5 h-5 mr-2" />
      )}
      {saved ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
    </Button>{user && error && <p role="alert" className="form-error mt-2">{error}</p>}</div>
  );
}
