import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface WatchlistItem {
  id: string;           // format: "movie_123" or "anime_456"
  mediaType: 'movie' | 'tv' | 'anime';
  mediaId: number;
  title: string;
  posterUrl: string | null;  // FULL URL, not path
  addedAt: number;
}

export async function addToWatchlist(userId: string, item: Omit<WatchlistItem, 'addedAt'>): Promise<void> {
  const ref = doc(db, 'users', userId, 'watchlist', item.id);
  await setDoc(ref, { ...item, addedAt: Date.now() });
}

export async function removeFromWatchlist(userId: string, itemId: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'watchlist', itemId);
  await deleteDoc(ref);
}

export function subscribeToWatchlist(userId: string, callback: (items: WatchlistItem[]) => void, onError?: (error: Error) => void): Unsubscribe {
  const q = query(collection(db, 'users', userId, 'watchlist'), orderBy('addedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => doc.data() as WatchlistItem);
    callback(items);
  }, onError);
}

export async function isInWatchlist(userId: string, itemId: string): Promise<boolean> {
  const { getDoc } = await import('firebase/firestore');
  const ref = doc(db, 'users', userId, 'watchlist', itemId);
  const snap = await getDoc(ref);
  return snap.exists();
}
