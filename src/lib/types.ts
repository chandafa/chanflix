export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface WatchlistItem {
  id: string;
  mediaType: 'movie' | 'tv' | 'anime';
  mediaId: number;
  title: string;
  posterPath: string | null;
  addedAt: number;
}

export interface Room {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  mediaType: 'movie' | 'tv' | 'anime';
  mediaId: number;
  mediaTitle: string;
  mediaPoster: string | null;
  videoUrl: string | null;
  videoType: 'youtube' | 'custom' | 'embed';
  isPlaying: boolean;
  currentTime: number;
  lastSyncAt: number;
  participants: Record<string, { name: string; photoURL: string | null; joinedAt: number }>;
  messages: Message[];
  createdAt: number;
  isActive: boolean;
  maxParticipants: number;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  text: string;
  timestamp: number;
}

export type MediaSource = 'tmdb' | 'anilist';

export interface NormalizedMedia {
  id: number;
  source: MediaSource;
  mediaType: 'movie' | 'tv' | 'anime';
  title: string;
  originalTitle?: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number;
  releaseDate?: string;
  genres: string[];
  trailerKey?: string;
}