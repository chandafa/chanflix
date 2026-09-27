export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: string;
  popularity: number;
  adult: boolean;
}

export interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBDetails extends TMDBMovie {
  genres: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status: string;
  tagline: string;
  production_companies: { id: number; name: string; logo_path: string | null }[];
  spoken_languages: { english_name: string; iso_639_1: string; name: string }[];
  homepage: string;
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TMDBCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBCredits {
  id: number;
  cast: TMDBCast[];
  crew: TMDBCrew[];
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBWatchProviderResult {
  link: string;
  flatrate?: { provider_id: number; provider_name: string; logo_path: string | null }[];
  rent?: { provider_id: number; provider_name: string; logo_path: string | null }[];
  buy?: { provider_id: number; provider_name: string; logo_path: string | null }[];
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

/**
 * Low-level helper to call the TMDB API with API key auth (v3).
 * Returns the parsed JSON payload, or `null` when the request fails.
 */
async function fetchTMDB<T>(endpoint: string): Promise<T | null> {
  if (!TMDB_API_KEY) {
    console.error('TMDB_API_KEY environment variable is not set');
    return null;
  }

  try {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${TMDB_BASE_URL}${endpoint}${separator}api_key=${TMDB_API_KEY}&language=id-ID`;
    
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${response.statusText} (${endpoint})`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`TMDB API fetch error (${endpoint}):`, error);
    return null;
  }
}

export async function getTrending(
  mediaType: 'movie' | 'tv',
  timeWindow: 'day' | 'week',
): Promise<TMDBResponse | null> {
  return fetchTMDB<TMDBResponse>(`/trending/${mediaType}/${timeWindow}`);
}

export async function getPopular(
  mediaType: 'movie' | 'tv',
  page: number = 1,
): Promise<TMDBResponse | null> {
  return fetchTMDB<TMDBResponse>(`/${mediaType}/popular?page=${page}`);
}

export async function getTopRated(
  mediaType: 'movie' | 'tv',
  page: number = 1,
): Promise<TMDBResponse | null> {
  return fetchTMDB<TMDBResponse>(`/${mediaType}/top_rated?page=${page}`);
}

export async function getDetails(
  mediaType: 'movie' | 'tv',
  id: number,
): Promise<TMDBDetails | null> {
  return fetchTMDB<TMDBDetails>(`/${mediaType}/${id}`);
}

export async function getCredits(
  mediaType: 'movie' | 'tv',
  id: number,
): Promise<TMDBCredits | null> {
  return fetchTMDB<TMDBCredits>(`/${mediaType}/${id}/credits`);
}

export async function getSimilar(
  mediaType: 'movie' | 'tv',
  id: number,
): Promise<TMDBResponse | null> {
  return fetchTMDB<TMDBResponse>(`/${mediaType}/${id}/recommendations`);
}

/**
 * Returns official YouTube trailers/teasers for the given title.
 * Falls back to an empty array when the request fails.
 */
export async function getVideos(
  mediaType: 'movie' | 'tv',
  id: number,
): Promise<TMDBVideo[]> {
  const data = await fetchTMDB<{ id: number; results: TMDBVideo[] }>(
    `/${mediaType}/${id}/videos`,
  );

  if (!data?.results) return [];

  return data.results
    .filter((video) => video.site === 'YouTube')
    .sort((a, b) => {
      // Prioritise official trailers, then teasers, then everything else.
      const rank = (v: TMDBVideo) => {
        if (v.type === 'Trailer' && v.official) return 0;
        if (v.type === 'Trailer') return 1;
        if (v.type === 'Teaser') return 2;
        return 3;
      };
      return rank(a) - rank(b);
    });
}

export async function searchMulti(
  query: string,
  page: number = 1,
): Promise<TMDBResponse | null> {
  if (!query.trim()) return null;
  const encodedQuery = encodeURIComponent(query);
  return fetchTMDB<TMDBResponse>(`/search/multi?query=${encodedQuery}&page=${page}`);
}

export async function getGenres(
  mediaType: 'movie' | 'tv',
): Promise<TMDBGenre[]> {
  const data = await fetchTMDB<{ genres: TMDBGenre[] }>(`/genre/${mediaType}/list`);
  return data?.genres ?? [];
}

export async function getNowPlaying(
  mediaType: 'movie' | 'tv',
  page: number = 1,
): Promise<TMDBResponse | null> {
  if (mediaType === 'tv') return getOnTheAir(mediaType, page);
  return fetchTMDB<TMDBResponse>(`/movie/now_playing?page=${page}`);
}

export async function getUpcoming(
  mediaType: 'movie' | 'tv',
  page: number = 1,
): Promise<TMDBResponse | null> {
  if (mediaType === 'tv') return null;
  return fetchTMDB<TMDBResponse>(`/movie/upcoming?page=${page}`);
}

export async function getOnTheAir(
  mediaType: 'movie' | 'tv',
  page: number = 1,
): Promise<TMDBResponse | null> {
  if (mediaType === 'movie') return null;
  return fetchTMDB<TMDBResponse>(`/tv/on_the_air?page=${page}`);
}

export async function getAiringToday(
  mediaType: 'movie' | 'tv',
  page: number = 1,
): Promise<TMDBResponse | null> {
  if (mediaType === 'movie') return null;
  return fetchTMDB<TMDBResponse>(`/tv/airing_today?page=${page}`);
}

export async function discoverByGenre(
  mediaType: 'movie' | 'tv',
  genreId: number,
  page: number = 1,
): Promise<TMDBResponse | null> {
  return fetchTMDB<TMDBResponse>(
    `/discover/${mediaType}?with_genres=${genreId}&page=${page}&sort_by=popularity.desc`,
  );
}

export async function getWatchProviders(
  mediaType: 'movie' | 'tv',
  id: number,
): Promise<Record<string, TMDBWatchProviderResult>> {
  const data = await fetchTMDB<{
    id: number;
    results: Record<string, TMDBWatchProviderResult>;
  }>(`/${mediaType}/${id}/watch/providers`);
  return data?.results ?? {};
}

export const getImageUrl = (path: string | null, size: string = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;