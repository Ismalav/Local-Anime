/**
 * Portage TypeScript de anisama-cli (https://github.com/can-oktay404/anisama-cli)
 * Scrape anime-sama.to pour recuperer des streams VOSTFR et VF.
 */

const BASE_URL = "https://anime-sama.to";

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0",
  "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  Connection: "keep-alive",
};

export interface AnimeSamaResult {
  title: string;
  url: string;
}

export interface AnimeSamaSeason {
  name: string;
  path: string;
}

export interface AnimeSamaEpisode {
  index: number;
  name: string;
  type: "sibnet" | "vidmoly";
  videoId: string;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const i = parts.indexOf("catalogue");
    return i >= 0 && parts[i + 1] ? parts[i + 1] : "";
  } catch {
    return "";
  }
}

function scoreMatch(query: string, result: AnimeSamaResult): number {
  const q = normalizeText(query);
  const t = normalizeText(result.title);
  const slug = normalizeText(slugFromUrl(result.url).replace(/-/g, " "));

  let score = 0;
  if (!q) return score;

  if (t === q) score += 100;
  if (slug === q) score += 90;
  if (t.includes(q)) score += 40;
  if (slug.includes(q)) score += 35;
  if (q.includes(t) && t.length >= 4) score += 20;
  if (q.includes(slug) && slug.length >= 4) score += 20;
  if (t.split(" ")[0] === q.split(" ")[0]) score += 10;

  return score;
}

export async function searchCatalogue(
  query: string,
  lang: "vostfr" | "vf" = "vostfr"
): Promise<AnimeSamaResult[]> {
  const params = new URLSearchParams({ search: query });
  if (lang === "vf") params.set("langue[]", "VF");

  const resp = await fetch(`${BASE_URL}/catalogue/?${params.toString()}`, {
    headers: HEADERS,
    next: { revalidate: 0 },
  });
  if (!resp.ok) throw new Error(`Catalogue HTTP ${resp.status}`);

  const html = await resp.text();
  const results: AnimeSamaResult[] = [];

  // Nouveau markup: <a href=".../catalogue/.../"><h2 class="card-title">Title</h2>
  const cardRegex =
    /<a[^>]+href="([^"]*\/catalogue\/[^"?#]+\/?)"[^>]*>[\s\S]*?<h2[^>]*class="[^"]*card-title[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/h2>/gi;

  let m: RegExpExecArray | null;
  while ((m = cardRegex.exec(html)) !== null) {
    const rawUrl = m[1].trim();
    const rawTitle = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!rawTitle) continue;

    const fullUrl = rawUrl.startsWith("http") ? rawUrl : `${BASE_URL}${rawUrl}`;
    if (!results.find((r) => r.url === fullUrl)) {
      results.push({ title: rawTitle, url: fullUrl });
    }
  }

  // Fallback extraction si layout change encore
  if (results.length === 0) {
    const fallbackRe =
      /<a[^>]+href="([^"]*\/catalogue\/[^"?#]+\/?)"[^>]*>[\s\S]*?<img[^>]+alt="([^"]+)"/gi;
    while ((m = fallbackRe.exec(html)) !== null) {
      const rawUrl = m[1].trim();
      const rawTitle = m[2].replace(/\s+/g, " ").trim();
      if (!rawTitle) continue;
      const fullUrl = rawUrl.startsWith("http") ? rawUrl : `${BASE_URL}${rawUrl}`;
      if (!results.find((r) => r.url === fullUrl)) {
        results.push({ title: rawTitle, url: fullUrl });
      }
    }
  }

  const scored = results
    .map((r) => ({ r, s: scoreMatch(query, r) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.r);

  if (lang === "vf") {
    return scored.map((r) => ({ ...r, url: r.url.replace("/vostfr", "/vf") }));
  }

  return scored;
}

export function parseSeasons(html: string): AnimeSamaSeason[] {
  const seasons: AnimeSamaSeason[] = [];
  const re = /panneauAnime\("([^"]+)",\s*"([^"]+)"\)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html)) !== null) {
    const name = m[1].trim();
    const path = m[2].trim();
    const low = name.toLowerCase();

    if (low === "nom" || low.includes("film") || !path) continue;
    if (!seasons.find((s) => s.path === path)) {
      seasons.push({ name, path });
    }
  }

  // Prefer classic seasons first, keep specials/kai as fallback
  seasons.sort((a, b) => {
    const aLow = a.name.toLowerCase();
    const bLow = b.name.toLowerCase();
    const aSeason = aLow.includes("version") || aLow.includes("saison") ? 0 : 1;
    const bSeason = bLow.includes("version") || bLow.includes("saison") ? 0 : 1;
    return aSeason - bSeason;
  });

  return seasons;
}

export async function getSeasonsForAnime(animeUrl: string): Promise<AnimeSamaSeason[]> {
  const resp = await fetch(animeUrl, { headers: HEADERS, next: { revalidate: 0 } });
  if (!resp.ok) throw new Error(`Anime page HTTP ${resp.status}`);
  const html = await resp.text();
  return parseSeasons(html);
}

export async function getEpisodeFilever(seasonUrl: string): Promise<string | null> {
  const cleanUrl = seasonUrl.replace(/^https?:\/\//, "");
  const url = `https://${cleanUrl}`;

  const resp = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
  if (!resp.ok) return null;
  const html = await resp.text();

  const m = /episodes\.js\?filever=(\d+)/.exec(html);
  return m ? m[1] : null;
}

export async function getEpisodes(
  seasonUrl: string,
  filever: string
): Promise<AnimeSamaEpisode[]> {
  const cleanUrl = seasonUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const jsUrl = `https://${cleanUrl}/episodes.js?filever=${filever}`;

  const resp = await fetch(jsUrl, { headers: HEADERS, next: { revalidate: 0 } });
  if (!resp.ok) throw new Error(`episodes.js HTTP ${resp.status}`);
  const content = await resp.text();

  const arrayRe = /var\s+eps(\d+)\s*=\s*\[([\s\S]*?)\];/g;
  const candidates: Array<{ type: "sibnet" | "vidmoly"; ids: string[] }> = [];

  let am: RegExpExecArray | null;
  while ((am = arrayRe.exec(content)) !== null) {
    const arrayContent = am[2];

    const sibnetIds = [...arrayContent.matchAll(/https:\/\/video\.sibnet\.ru\/shell\.php\?videoid=(\d+)/g)].map(
      (x) => x[1]
    );
    const vidmolyIds = [...arrayContent.matchAll(/https:\/\/vidmoly\.to\/embed-([^.]+)\.html/g)].map(
      (x) => x[1]
    );

    if (sibnetIds.length > 0) candidates.push({ type: "sibnet", ids: sibnetIds });
    if (vidmolyIds.length > 0) candidates.push({ type: "vidmoly", ids: vidmolyIds });
  }

  // Fallback if no array matched
  if (candidates.length === 0) {
    const sibnetIds = [...content.matchAll(/https:\/\/video\.sibnet\.ru\/shell\.php\?videoid=(\d+)/g)].map(
      (x) => x[1]
    );
    const vidmolyIds = [...content.matchAll(/https:\/\/vidmoly\.to\/embed-([^.]+)\.html/g)].map(
      (x) => x[1]
    );

    if (sibnetIds.length > 0) candidates.push({ type: "sibnet", ids: sibnetIds });
    if (vidmolyIds.length > 0) candidates.push({ type: "vidmoly", ids: vidmolyIds });
  }

  if (candidates.length === 0) return [];

  // Prefer larger list, and prefer sibnet in tie
  candidates.sort((a, b) => {
    if (b.ids.length !== a.ids.length) return b.ids.length - a.ids.length;
    if (a.type === b.type) return 0;
    return a.type === "sibnet" ? -1 : 1;
  });

  const best = candidates[0];
  return best.ids.map((videoId, i) => ({
    index: i + 1,
    name: `Episode ${i + 1}`,
    type: best.type,
    videoId,
  }));
}

export async function resolveSibnetUrl(videoId: string): Promise<string | null> {
  const shellUrl = `https://video.sibnet.ru/shell.php?videoid=${videoId}`;

  const resp = await fetch(shellUrl, {
    headers: {
      ...HEADERS,
      Referer: "https://video.sibnet.ru/",
      Range: "bytes=0-",
    },
    redirect: "manual",
    next: { revalidate: 0 },
  });

  const html = await resp.text();

  const m = /player\.src\(\[\{src:\s*["']\/v\/([^/]+)\//.exec(html);
  if (!m) return null;

  const hash = m[1];
  const mp4Url = `https://video.sibnet.ru/v/${hash}/${videoId}.mp4`;

  const redir = await fetch(mp4Url, {
    headers: {
      ...HEADERS,
      Range: "bytes=0-",
      Referer: "https://video.sibnet.ru/",
    },
    redirect: "manual",
    next: { revalidate: 0 },
  });

  const location = redir.headers.get("location");
  if (location) {
    return location.startsWith("//") ? `https:${location}` : location;
  }

  return mp4Url;
}

export async function resolveVidmolyUrl(videoId: string): Promise<string | null> {
  const domains = ["vidmoly.to", "vidmoly.net"];

  for (const domain of domains) {
    try {
      const embedUrl = `https://${domain}/embed-${videoId}.html`;
      const resp = await fetch(embedUrl, {
        headers: {
          ...HEADERS,
          Referer: `https://${domain}/`,
        },
        next: { revalidate: 0 },
      });
      if (!resp.ok) continue;
      const html = await resp.text();

      const patterns = [
        /sources:\s*\[\s*\{\s*file:\s*["']([^"']+\.m3u8[^"']*)["']/i,
        /file:\s*["']([^"']+\.m3u8[^"']*)["']/i,
        /"file"\s*:\s*"([^"]+\.m3u8[^"]*)"/i,
        /src:\s*["']([^"']+\.m3u8[^"']*)["']/i,
      ];

      for (const pattern of patterns) {
        const m = pattern.exec(html);
        if (!m) continue;

        let url = m[1];
        if (url.startsWith("//")) url = `https:${url}`;
        else if (!url.startsWith("http")) url = `https://${url.replace(/^\//, "")}`;
        return url;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function getAnimeSamaStreamUrl(
  title: string,
  episodeNumber: number,
  lang: "vostfr" | "vf"
): Promise<{ url: string; type: "sibnet" | "vidmoly" } | null> {
  const results = await searchCatalogue(title, lang);
  if (results.length === 0) return null;

  let bestFallback: { ep: AnimeSamaEpisode; count: number } | null = null;

  // Test top candidates + all their seasons until a season actually contains the asked episode.
  for (const anime of results.slice(0, 6)) {
    let seasons: AnimeSamaSeason[] = [];
    try {
      seasons = await getSeasonsForAnime(anime.url);
    } catch {
      continue;
    }
    if (seasons.length === 0) continue;

    for (const season of seasons) {
      let seasonUrl = `${anime.url.replace(/\/$/, "")}/${season.path.replace(/^\//, "")}`;
      if (lang === "vf") seasonUrl = seasonUrl.replace("/vostfr", "/vf");

      const filever = await getEpisodeFilever(seasonUrl);
      if (!filever) continue;

      const episodes = await getEpisodes(seasonUrl, filever);
      if (episodes.length === 0) continue;

      const ep = episodes[episodeNumber - 1];
      if (ep) {
        const videoUrl = ep.type === "sibnet" ? await resolveSibnetUrl(ep.videoId) : await resolveVidmolyUrl(ep.videoId);
        if (videoUrl) return { url: videoUrl, type: ep.type };
      }

      // Keep the largest season as fallback
      const lastEp = episodes[episodes.length - 1];
      if (!bestFallback || episodes.length > bestFallback.count) {
        bestFallback = { ep: lastEp, count: episodes.length };
      }
    }
  }

  if (!bestFallback) return null;

  const fallbackUrl =
    bestFallback.ep.type === "sibnet"
      ? await resolveSibnetUrl(bestFallback.ep.videoId)
      : await resolveVidmolyUrl(bestFallback.ep.videoId);

  if (!fallbackUrl) return null;
  return { url: fallbackUrl, type: bestFallback.ep.type };
}
