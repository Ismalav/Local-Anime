export interface FavoriteItem {
  id: string | number;
  title: string;
  image: string;
}

export interface HistoryItem {
  animeId: string | number;
  animeTitle: string;
  animeImage: string;
  episode: number;
  episodeTitle?: string;
  timestamp: number;
}

export function getFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("anistream_favorites") || "[]");
  } catch {
    return [];
  }
}

export function isFavorite(id: string | number): boolean {
  return getFavorites().some((f) => String(f.id) === String(id));
}

export function toggleFavorite(item: FavoriteItem): boolean {
  const favs = getFavorites();
  const exists = favs.some((f) => String(f.id) === String(item.id));
  if (exists) {
    localStorage.setItem("anistream_favorites", JSON.stringify(favs.filter((f) => String(f.id) !== String(item.id))));
    return false;
  } else {
    favs.unshift(item);
    localStorage.setItem("anistream_favorites", JSON.stringify(favs));
    return true;
  }
}

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("anistream_history") || "[]");
  } catch {
    return [];
  }
}

export function addToHistory(item: HistoryItem) {
  const history = getHistory().filter(
    (h) => !(String(h.animeId) === String(item.animeId) && h.episode === item.episode)
  );
  history.unshift({ ...item, timestamp: Date.now() });
  localStorage.setItem("anistream_history", JSON.stringify(history.slice(0, 50)));
}

export function clearHistory() {
  localStorage.removeItem("anistream_history");
}

export function removeHistoryByAnime(animeId: string | number) {
  const filtered = getHistory().filter(
    (item) => String(item.animeId) !== String(animeId)
  );
  localStorage.setItem("anistream_history", JSON.stringify(filtered));
}
