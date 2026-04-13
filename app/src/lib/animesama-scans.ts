const BASE = "https://anime-sama.to";

export interface AsManga {
  id: string;
  title: string;
  coverUrl?: string;
  description: string;
  genres: string[];
  status?: string;
  year?: number;
}

export interface AsChapter {
  id: string;
  chapter: string;
  title: string;
  pages: number;
  publishedAt?: string;
}

const titleCache = new Map<string, string>();
const scanTitleCache = new Map<string, string>();

function decodeHtml(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function stripTags(input: string): string {
  return decodeHtml(input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

function normalize(input: string): string {
  return stripTags(input)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function toSlug(input: string): string {
  return normalize(input)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseCatalogueCards(html: string): AsManga[] {
  const cards: AsManga[] = [];
  const seen = new Set<string>();

  const cardRe =
    /<a href="https:\/\/anime-sama\.to\/catalogue\/([^"/?#]+)\/?">([\s\S]*?)<\/a>/gi;
  let m;

  while ((m = cardRe.exec(html)) !== null) {
    const slug = m[1].trim();
    const block = m[2];
    if (!slug || seen.has(slug)) continue;

    const titleM = block.match(/<h2 class="card-title">([\s\S]*?)<\/h2>/i);
    const title = titleM ? stripTags(titleM[1]) : slug;

    const typesM = block.match(/<span class="info-label">Types<\/span>\s*<p class="info-value">([\s\S]*?)<\/p>/i);
    const types = typesM ? stripTags(typesM[1]) : "";
    if (!/\bscans?\b/i.test(types)) continue;

    const genresM = block.match(/<span class="info-label">Genres<\/span>\s*<p class="info-value">([\s\S]*?)<\/p>/i);
    const genresRaw = genresM ? stripTags(genresM[1]) : "";
    const genres = genresRaw
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    const imgM = block.match(/<img[^>]+class="card-image"[^>]+src="([^"]+)"/i);
    const coverUrl = imgM?.[1];

    seen.add(slug);
    cards.push({
      id: slug,
      title,
      coverUrl,
      description: "",
      genres,
      status: "ongoing",
    });
  }

  return cards;
}

async function fetchCatalogue(): Promise<AsManga[]> {
  const res = await fetch(`${BASE}/catalogue`, {
    headers: { "User-Agent": "OpenAnime/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Anime-Sama catalogue HTTP ${res.status}`);
  const html = await res.text();
  return parseCatalogueCards(html);
}

export async function searchManga(q: string): Promise<AsManga[]> {
  const list = await fetchCatalogue();
  const nq = normalize(q);
  if (!nq) return list.slice(0, 60);

  const matches = list
    .map((item) => {
      const nt = normalize(item.title);
      const ns = normalize(item.id.replace(/-/g, " "));
      let score = 0;
      if (nt.includes(nq)) score += 3;
      if (ns.includes(nq)) score += 2;
      if (nt.startsWith(nq)) score += 1;
      if (nq.includes(nt) && nt.length > 3) score += 1;
      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item)
    .slice(0, 60);

  if (matches.length > 0) return matches;

  // Fallback: test direct slug URL when catalogue extraction is partial
  const slug = toSlug(q);
  if (!slug) return [];

  try {
    const direct = await getMangaDetail(slug);
    if (!direct) return [];

    // Keep only entries that really expose scan chapters
    const chapters = await getMangaChapters(slug);
    if (!chapters.length) return [];

    return [direct];
  } catch {
    return [];
  }
}

export async function getMangaDetail(slug: string): Promise<AsManga | null> {
  const res = await fetch(`${BASE}/catalogue/${slug}/`, {
    headers: { "User-Agent": "OpenAnime/1.0" },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const html = await res.text();

  const titleM = html.match(/<h3 id="titreOeuvre"[^>]*>([\s\S]*?)<\/h3>/i);
  const title = titleM ? stripTags(titleM[1]) : slug;
  titleCache.set(slug, title);

  const coverM = html.match(/<img id="coverOeuvre"[^>]+src="([^"]+)"/i);
  const coverUrl = coverM?.[1];

  const genresM = html.match(/Genres\s*:\s*<span[^>]*>([\s\S]*?)<\/span>/i);
  const genresRaw = genresM ? stripTags(genresM[1]) : "";
  const genres = genresRaw
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  const synopsisM = html.match(/Synopsis\s*:\s*<span[^>]*>([\s\S]*?)<\/span>/i);
  const description = synopsisM ? stripTags(synopsisM[1]) : "";

  return {
    id: slug,
    title,
    coverUrl,
    description,
    genres,
    status: "ongoing",
  };
}

async function getOeuvreTitle(slug: string): Promise<string> {
  if (scanTitleCache.has(slug)) return scanTitleCache.get(slug) as string;

  const res = await fetch(`${BASE}/catalogue/${slug}/scan/vf`, {
    headers: { "User-Agent": "OpenAnime/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Anime-Sama scan HTTP ${res.status}`);
  const html = await res.text();

  const titleM = html.match(/<h3 id="titreOeuvre"[^>]*>([\s\S]*?)<\/h3>/i);
  if (!titleM) throw new Error("Titre du scan introuvable");
  const title = stripTags(titleM[1]);
  scanTitleCache.set(slug, title);
  return title;
}

async function getChapterMap(slug: string): Promise<Record<string, number>> {
  const oeuvre = await getOeuvreTitle(slug);
  const res = await fetch(
    `${BASE}/s2/scans/get_nb_chap_et_img.php?oeuvre=${encodeURIComponent(oeuvre)}`,
    {
      headers: { "User-Agent": "OpenAnime/1.0" },
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error(`Anime-Sama scans API HTTP ${res.status}`);

  const data = (await res.json()) as Record<string, number> & { error?: string };
  if (data.error) throw new Error(data.error);

  return data;
}

export async function getMangaChapters(slug: string): Promise<AsChapter[]> {
  const map = await getChapterMap(slug);

  const chapters = Object.entries(map)
    .filter(([k, v]) => /^\d+$/.test(k) && Number(v) > 0)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([k, v]) => ({
      id: k,
      chapter: k,
      title: `Chapitre ${k}`,
      pages: Number(v),
    }));

  return chapters;
}

export async function getChapterPages(
  mangaSlug: string,
  chapterSlug: string
): Promise<string[]> {
  const chapterNo = Number(chapterSlug);
  if (!Number.isFinite(chapterNo) || chapterNo <= 0) return [];

  const oeuvre = await getOeuvreTitle(mangaSlug);
  const map = await getChapterMap(mangaSlug);
  const pageCount = Number(map[String(chapterNo)] ?? 0);
  if (!pageCount) return [];

  const oeuvrePath = encodeURIComponent(oeuvre);

  return Array.from({ length: pageCount }, (_, idx) => {
    const pageNo = idx + 1;
    return `${BASE}/s2/scans/${oeuvrePath}/${chapterNo}/${pageNo}.jpg`;
  });
}
