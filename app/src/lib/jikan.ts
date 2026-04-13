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

export async function searchAnime(query: string): Promise<JikanAnime[]> {
  const res = await fetch(`${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=20&sfw=true`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

export async function getAnimeById(id: string | number): Promise<JikanAnime | null> {
  const res = await fetch(`${JIKAN_BASE}/anime/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.data ?? null;
}

export async function getSeasonalAnime(): Promise<JikanAnime[]> {
  const res = await fetch(`${JIKAN_BASE}/seasons/now?limit=18`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

export async function getTopAnime(): Promise<JikanAnime[]> {
  const res = await fetch(`${JIKAN_BASE}/top/anime?limit=18&type=tv`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

export async function getAnimeEpisodes(id: string | number): Promise<{ mal_id: number; title: string; title_japanese?: string; title_romanji?: string; aired: string }[]> {
  const res = await fetch(`${JIKAN_BASE}/anime/${id}/episodes`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}
