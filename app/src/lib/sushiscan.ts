// SushiScan scraper — WordPress Madara theme
// Requires cf_clearance cookie + matching User-Agent to bypass Cloudflare

const BASE = "https://sushiscan.net";

function isCloudflareChallenge(html: string): boolean {
  const normalized = html.toLowerCase();
  return (
    normalized.includes("cf-browser-verification") ||
    normalized.includes("cf-challenge") ||
    normalized.includes("cf_clearance") ||
    normalized.includes("just a moment") ||
    normalized.includes("attention required") ||
    normalized.includes("cloudflare")
  );
}

export interface SushiManga {
  id: string;       // URL slug
  title: string;
  coverUrl?: string;
  description: string;
  genres: string[];
  status?: string;
  year?: number;
}

export interface SushiChapter {
  id: string;       // chapter path slug  (e.g. "chapitre-1")
  chapter: string;  // readable number     (e.g. "1")
  title: string;
  pages: number;
  publishedAt?: string;
}

function makeHeaders(
  cfClearance?: string,
  userAgent?: string
): Record<string, string> {
  const ua =
    userAgent ??
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  const headers: Record<string, string> = {
    "User-Agent": ua,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
    Referer: BASE + "/",
  };

  if (cfClearance) {
    headers["Cookie"] = `cf_clearance=${cfClearance}`;
  }

  return headers;
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function searchManga(
  q: string,
  cfClearance?: string,
  userAgent?: string
): Promise<SushiManga[]> {
  const url = `${BASE}/?s=${encodeURIComponent(q)}&post_type=wp-manga`;
  const res = await fetch(url, {
    headers: makeHeaders(cfClearance, userAgent),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`SushiScan search HTTP ${res.status}`);
  const html = await res.text();
  if (isCloudflareChallenge(html)) {
    throw new Error("SushiScan Cloudflare challenge");
  }
  return parseMangaCards(html);
}

function parseMangaCards(html: string): SushiManga[] {
  const results: SushiManga[] = [];
  const seen = new Set<string>();

  // Split on card boundaries (page-item-detail divs)
  const cards = html
    .split(/(?=<div[^>]+class="[^"]*page-item-detail)/i)
    .slice(1);

  for (const card of cards) {
    // Link + title inside post-title / item-summary area
    const linkM = card.match(
      /<a[^>]+href="([^"]*\/catalogue\/([^"?#/]+)\/?)"[^>]*>\s*([^<\n]+)\s*<\/a>/i
    );
    if (!linkM) continue;

    const slug = linkM[2].replace(/\/$/, "");
    const title = linkM[3].trim().replace(/&amp;/g, "&");

    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    // Cover image — prefer data-src (lazy-loading), then src
    const imgM =
      card.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i) ??
      card.match(/src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
    const coverUrl = imgM?.[1];

    results.push({ id: slug, title, coverUrl, description: "", genres: [] });
  }

  return results;
}

// ── Manga detail ──────────────────────────────────────────────────────────────

export async function getMangaDetail(
  slug: string,
  cfClearance?: string,
  userAgent?: string
): Promise<SushiManga | null> {
  const url = `${BASE}/catalogue/${slug}/`;
  const res = await fetch(url, {
    headers: makeHeaders(cfClearance, userAgent),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const html = await res.text();
  if (isCloudflareChallenge(html)) {
    throw new Error("SushiScan Cloudflare challenge");
  }

  const titleM = html.match(
    /<div[^>]*class="[^"]*post-title[^"]*"[^>]*>[\s\S]*?<h1[^>]*>\s*([\s\S]*?)\s*<\/h1>/i
  );
  const title = titleM
    ? titleM[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim()
    : slug;

  const coverM = html.match(
    /<div[^>]*class="[^"]*summary_image[^"]*"[\s\S]{0,500}?<img[^>]+(?:src|data-src)="([^"]+)"/i
  );
  const coverUrl = coverM?.[1];

  const descM = html.match(
    /<div[^>]*class="[^"]*summary__content[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  );
  const description = descM
    ? descM[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : "";

  const genreRe =
    /<a[^>]+href="[^"]*\/genre\/[^"]*"[^>]*>\s*([^<]+)\s*<\/a>/gi;
  const genres: string[] = [];
  let gm;
  while ((gm = genreRe.exec(html)) !== null) genres.push(gm[1].trim());

  const statusM = html.match(/Statut[\s\S]{0,200}?<a[^>]*>([^<]+)<\/a>/i);
  const status = statusM?.[1]?.trim().toLowerCase();

  return { id: slug, title, coverUrl, description, genres, status };
}

// ── Chapters ──────────────────────────────────────────────────────────────────

export async function getMangaChapters(
  slug: string,
  cfClearance?: string,
  userAgent?: string
): Promise<SushiChapter[]> {
  const detailUrl = `${BASE}/catalogue/${slug}/`;
  const res = await fetch(detailUrl, {
    headers: makeHeaders(cfClearance, userAgent),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`SushiScan chapters HTTP ${res.status}`);
  const html = await res.text();
  if (isCloudflareChallenge(html)) {
    throw new Error("SushiScan Cloudflare challenge");
  }

  // Extract WordPress post ID for AJAX chapter loading
  const idM =
    html.match(/var\s+manga_chap_id\s*=\s*["']?(\d+)/i) ??
    html.match(/data-id="(\d+)"/i) ??
    html.match(/"manga_id"\s*:\s*"?(\d+)/i);

  let chaptersHtml = html;

  if (idM) {
    const ajaxRes = await fetch(`${BASE}/wp-admin/admin-ajax.php`, {
      method: "POST",
      headers: {
        ...makeHeaders(cfClearance, userAgent),
        "Content-Type":
          "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        Referer: detailUrl,
      },
      body: `action=manga_get_chapters&manga=${idM[1]}`,
      cache: "no-store",
    });
    if (ajaxRes.ok) {
      const text = await ajaxRes.text();
      if (text.includes("wp-manga-chapter")) chaptersHtml = text;
    }
  }

  return parseChapters(chaptersHtml);
}

function parseChapters(html: string): SushiChapter[] {
  const chapters: SushiChapter[] = [];
  const re =
    /<li[^>]*class="[^"]*wp-manga-chapter[^"]*"[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>\s*([^<]+)\s*<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const url = m[1].trim().replace(/\/$/, "");
    const title = m[2].trim();
    const parts = url.split("/").filter(Boolean);
    const chapterSlug = parts.pop() ?? "";
    const numM =
      chapterSlug.match(/chapitre?-([0-9.]+)/i) ??
      title.match(/chapitre?\s*([0-9.]+)/i);
    const chapter = numM?.[1] ?? chapterSlug;
    chapters.push({ id: chapterSlug, chapter, title, pages: 0 });
  }
  return chapters.reverse(); // ascending order
}

// ── Pages ─────────────────────────────────────────────────────────────────────

export async function getChapterPages(
  mangaSlug: string,
  chapterSlug: string,
  cfClearance?: string,
  userAgent?: string
): Promise<string[]> {
  const url = `${BASE}/catalogue/${mangaSlug}/${chapterSlug}/`;
  const res = await fetch(url, {
    headers: makeHeaders(cfClearance, userAgent),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`SushiScan pages HTTP ${res.status}`);
  const html = await res.text();
  if (isCloudflareChallenge(html)) {
    throw new Error("SushiScan Cloudflare challenge");
  }

  // Primary: ts_reader.run({"sources":[{"source":"...","images":["url1","url2"]}]})
  const tsM = html.match(/ts_reader\.run\(([\s\S]+?)\);\s*<\/script>/);
  if (tsM) {
    try {
      const data = JSON.parse(tsM[1]) as {
        sources?: Array<{ images?: string[] }>;
      };
      const images = data.sources?.[0]?.images ?? [];
      if (images.length) return images;
    } catch {
      // fallthrough
    }
  }

  // Fallback: img.wp-manga-chapter-img
  const imgRe =
    /<img[^>]+class="[^"]*wp-manga-chapter-img[^"]*"[^>]+(?:src|data-src)="([^"]+)"/gi;
  const imgs: string[] = [];
  let im;
  while ((im = imgRe.exec(html)) !== null) imgs.push(im[1].trim());
  return imgs;
}
