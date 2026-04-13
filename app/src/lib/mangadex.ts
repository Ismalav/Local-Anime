export const MDX_BASE = "https://api.mangadex.org";
export const MDX_COVERS = "https://uploads.mangadex.org/covers";

export interface MdxManga {
  id: string;
  title: string;
  titleFr?: string;
  description: string;
  status: string;
  year?: number;
  coverUrl?: string;
  genres: string[];
}

export interface MdxChapter {
  id: string;
  chapter: string;
  title: string;
  lang: string;
  pages: number;
  publishedAt: string;
  scanlationGroup?: string;
}

export interface MdxPage {
  baseUrl: string;
  hash: string;
  images: string[];
  imagesSaver: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function coverUrl(manga: any): string | undefined {
  const rel = manga.relationships?.find((r: any) => r.type === "cover_art");
  if (!rel?.attributes?.fileName) return undefined;
  return `${MDX_COVERS}/${manga.id}/${rel.attributes.fileName}.512.jpg`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapManga(manga: any): MdxManga {
  const attrs = manga.attributes ?? {};
  const titles: Record<string, string> = attrs.title ?? {};
  const desc: Record<string, string> = attrs.description ?? {};
  const tags = (attrs.tags ?? []).map((t: any) => t.attributes?.name?.en).filter(Boolean);

  return {
    id: manga.id,
    title: titles.en ?? titles.ja ?? titles["ja-ro"] ?? Object.values(titles)[0] ?? "Inconnu",
    titleFr: titles.fr,
    description: desc.fr ?? desc.en ?? "",
    status: attrs.status ?? "",
    year: attrs.year,
    coverUrl: coverUrl(manga),
    genres: tags,
  };
}

export async function searchManga(q: string, lang = "fr"): Promise<MdxManga[]> {
  const params = new URLSearchParams({
    title: q,
    limit: "24",
    "includes[]": "cover_art",
    "order[relevance]": "desc",
  });
  if (lang !== "all") {
    params.append("availableTranslatedLanguage[]", lang);
    params.append("availableTranslatedLanguage[]", "en");
  }

  const res = await fetch(`${MDX_BASE}/manga?${params}`, {
    headers: { "User-Agent": "OpenAnime/1.0" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data ?? []).map(mapManga);
}

export async function getMangaById(id: string): Promise<MdxManga | null> {
  const res = await fetch(`${MDX_BASE}/manga/${id}?includes[]=cover_art`, {
    headers: { "User-Agent": "OpenAnime/1.0" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return mapManga(data.data);
}

export async function getMangaChapters(id: string): Promise<MdxChapter[]> {
  const params = new URLSearchParams({
    limit: "100",
    "translatedLanguage[]": "fr",
    "order[chapter]": "asc",
    "includes[]": "scanlation_group",
  });
  const res = await fetch(`${MDX_BASE}/manga/${id}/feed?${params}`, {
    headers: { "User-Agent": "OpenAnime/1.0" },
  });
  if (!res.ok) return [];
  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.data ?? []).map((ch: any) => {
    const attrs = ch.attributes ?? {};
    const group = ch.relationships?.find((r: any) => r.type === "scanlation_group");
    return {
      id: ch.id,
      chapter: attrs.chapter ?? "?",
      title: attrs.title ?? "",
      lang: attrs.translatedLanguage ?? "fr",
      pages: attrs.pages ?? 0,
      publishedAt: attrs.publishAt ?? "",
      scanlationGroup: group?.attributes?.name,
    };
  });
}

export async function getChapterPages(chapterId: string): Promise<MdxPage | null> {
  const res = await fetch(`${MDX_BASE}/at-home/server/${chapterId}`, {
    headers: { "User-Agent": "OpenAnime/1.0" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const ch = data.chapter ?? {};
  return {
    baseUrl: data.baseUrl ?? "",
    hash: ch.hash ?? "",
    images: ch.data ?? [],
    imagesSaver: ch.dataSaver ?? [],
  };
}
