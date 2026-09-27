import { NextResponse } from 'next/server';
import { searchMulti } from '@/lib/tmdb';
import { searchAnime } from '@/lib/anilist';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || !q.trim()) {
    return NextResponse.json({ movies: [], anime: [] });
  }

  try {
    const [tmdbRes, anilistRes] = await Promise.all([
      searchMulti(q, 1).catch(() => null),
      searchAnime(q, 1, 20).catch(() => null),
    ]);

    const movies = (tmdbRes?.results || []).filter(
      (item) => item.media_type === 'movie' || item.media_type === 'tv'
    );
    const anime = anilistRes?.media || [];

    return NextResponse.json({
      movies,
      anime,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan pencarian', movies: [], anime: [] },
      { status: 500 }
    );
  }
}
