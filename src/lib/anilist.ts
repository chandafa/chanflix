export interface AnilistMedia {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  synonyms: string[];
  countryOfOrigin: string | null;
  coverImage: { large: string; extraLarge: string; color: string | null };
  bannerImage: string | null;
  description: string | null;
  episodes: number | null;
  duration: number | null;
  status: string;
  season: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  genres: string[];
  studios: { nodes: { name: string }[] };
  format: string | null;
  type: string;
}

export interface AnilistPageResponse {
  pageInfo: {
    total: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
    perPage: number;
  };
  media: AnilistMedia[];
}

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

const MEDIA_FIELDS = `
  id
  title {
    romaji
    english
    native
  }
  synonyms
  countryOfOrigin
  coverImage {
    large
    extraLarge
    color
  }
  bannerImage
  description
  episodes
  duration
  status
  season
  seasonYear
  averageScore
  genres
  studios {
    nodes {
      name
    }
  }
  format
  type
`;

/**
 * Low-level helper to execute a GraphQL query against the AniList API.
 * Returns the `data` payload, or `null` when the request fails.
 */
async function fetchAnilist<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T | null> {
  try {
    const response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      console.error(`AniList API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const json = await response.json();

    if (json.errors) {
      console.error('AniList GraphQL errors:', json.errors);
      return null;
    }

    return json.data as T;
  } catch (error) {
    console.error('AniList API fetch error:', error);
    return null;
  }
}

export async function getTrendingAnime(
  page: number = 1,
  perPage: number = 20,
): Promise<AnilistPageResponse | null> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, sort: TRENDING_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAnilist<{ Page: AnilistPageResponse }>(query, {
    page,
    perPage,
  });

  return data?.Page ?? null;
}

export async function getPopularAnime(
  page: number = 1,
  perPage: number = 20,
): Promise<AnilistPageResponse | null> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAnilist<{ Page: AnilistPageResponse }>(query, {
    page,
    perPage,
  });

  return data?.Page ?? null;
}

export async function searchAnime(
  query: string,
  page: number = 1,
  perPage: number = 20,
): Promise<AnilistPageResponse | null> {
  if (!query.trim()) return null;

  const gqlQuery = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, search: $search, sort: SEARCH_MATCH) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAnilist<{ Page: AnilistPageResponse }>(gqlQuery, {
    search: query,
    page,
    perPage,
  });

  return data?.Page ?? null;
}

export async function getAnimeDetails(id: number): Promise<AnilistMedia | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FIELDS}
      }
    }
  `;

  const data = await fetchAnilist<{ Media: AnilistMedia }>(query, { id });

  return data?.Media ?? null;
}

export async function getUpcomingAnime(
  page: number = 1,
  perPage: number = 20,
): Promise<AnilistPageResponse | null> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAnilist<{ Page: AnilistPageResponse }>(query, {
    page,
    perPage,
  });

  return data?.Page ?? null;
}

export async function getTopRatedAnime(
  page: number = 1,
  perPage: number = 20,
): Promise<AnilistPageResponse | null> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, sort: SCORE_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAnilist<{ Page: AnilistPageResponse }>(query, {
    page,
    perPage,
  });

  return data?.Page ?? null;
}
