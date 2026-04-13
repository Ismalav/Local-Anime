export const JIKAN_BASE = "https://api.jikan.moe/v4";

export interface JikanAnime {
  mal_id: number;
  title: string;
  title_english?: string;
  images: { jpg: { large_image_url: string; image_url: string } };
  score?: number;
  episodes?: number;
  year?: number;
  synopsis?: string;
  genres?: { name: string }[];
  status?: string;
  type?: string;
  aired?: { string: string };
}

async function safeJsonFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, {
      // Prevent long hangs on external API during CI/CD builds
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    return (data?.data ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export async function searchAnime(query: string): Promise<JikanAnime[]> {
  return safeJsonFetch<JikanAnime[]>(
    `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=20&sfw=true`,
    []
  );
}

export async function getAnimeById(id: string | number): Promise<JikanAnime | null> {
  return safeJsonFetch<JikanAnime | null>(`${JIKAN_BASE}/anime/${id}`, null);
}

export async function getSeasonalAnime(): Promise<JikanAnime[]> {
  return safeJsonFetch<JikanAnime[]>(`${JIKAN_BASE}/seasons/now?limit=18`, []);
}

export async function getTopAnime(): Promise<JikanAnime[]> {
  return safeJsonFetch<JikanAnime[]>(`${JIKAN_BASE}/top/anime?limit=18&type=tv`, []);
}

export async function getAnimeEpisodes(id: string | number): Promise<{ mal_id: number; title: string; title_japanese?: string; title_romanji?: string; aired: string }[]> {
  return safeJsonFetch<{ mal_id: number; title: string; title_japanese?: string; title_romanji?: string; aired: string }[]>(
    `${JIKAN_BASE}/anime/${id}/episodes`,
    []
  );
}
