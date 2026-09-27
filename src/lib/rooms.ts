import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Room {
  id: string;
  hostId: string;
  hostName: string;
  mediaId: number;
  mediaType: 'movie' | 'tv' | 'anime';
  mediaTitle: string;
  mediaPoster: string | null;
  mediaPath?: string;
  videoUrl: string;
  videoType: 'youtube' | 'custom' | 'embed';
  isPlaying: boolean;
  currentTime: number;
  videoDuration: number; // Durasi video
  videoProgress: number; // Progress dalam persen (0-100)
  updatedAt: number;
  createdAt: number;
}

export interface Participant {
  id: string;
  name: string;
  photoURL: string | null;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

export async function createRoom(data: Omit<Room, 'id' | 'isPlaying' | 'currentTime' | 'videoDuration' | 'videoProgress' | 'updatedAt' | 'createdAt'>) {
  const ref = doc(collection(db, 'rooms'));
  const now = Date.now();
  await setDoc(ref, { ...data, id: ref.id, isPlaying: false, currentTime: 0, videoDuration: 0, videoProgress: 0, updatedAt: now, createdAt: now });
  return ref.id;
}

export function subscribeRoom(id: string, onData: (room: Room | null) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(doc(db, 'rooms', id), snap => onData(snap.exists() ? snap.data() as Room : null), onError);
}

export function subscribeParticipants(roomId: string, onData: (people: Participant[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(query(collection(db, 'rooms', roomId, 'participants'), orderBy('joinedAt')), snap => onData(snap.docs.map(item => item.data() as Participant)), onError);
}

export function subscribeMessages(roomId: string, onData: (messages: ChatMessage[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(query(collection(db, 'rooms', roomId, 'messages'), orderBy('createdAt')), snap => onData(snap.docs.slice(-100).map(item => ({ ...item.data(), id: item.id }) as ChatMessage)), onError);
}

export async function joinRoom(roomId: string, participant: Participant) {
  await setDoc(doc(db, 'rooms', roomId, 'participants', participant.id), participant);
}

export async function leaveRoom(roomId: string, userId: string) {
  await deleteDoc(doc(db, 'rooms', roomId, 'participants', userId));
}

export async function sendMessage(roomId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>) {
  await addDoc(collection(db, 'rooms', roomId, 'messages'), { ...message, createdAt: Date.now() });
}

export async function updatePlayback(roomId: string, isPlaying: boolean, currentTime: number) {
  await updateDoc(doc(db, 'rooms', roomId), { isPlaying, currentTime: Math.max(0, currentTime), updatedAt: Date.now() });
}

export async function updateVideoProgress(roomId: string, currentTime: number, duration: number) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  await updateDoc(doc(db, 'rooms', roomId), { 
    currentTime: Math.max(0, currentTime),
    videoDuration: duration,
    videoProgress: Math.min(100, progress),
    updatedAt: Date.now()
  });
}
