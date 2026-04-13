import { NextRequest, NextResponse } from "next/server";

const ALLANIME_API = "https://api.allanime.day/api";
const ALLANIME_BASE = "https://allanime.day";
const REFERER = "https://allmanga.to";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

// Cipher issu du code source d'ani-cli (provider_init)
const HEX_MAP: Record<string, string> = {
  "79": "A", "7a": "B", "7b": "C", "7c": "D", "7d": "E", "7e": "F", "7f": "G",
  "70": "H", "71": "I", "72": "J", "73": "K", "74": "L", "75": "M", "76": "N", "77": "O",
  "68": "P", "69": "Q", "6a": "R", "6b": "S", "6c": "T", "6d": "U", "6e": "V", "6f": "W",
  "60": "X", "61": "Y", "62": "Z",
  "59": "a", "5a": "b", "5b": "c", "5c": "d", "5d": "e", "5e": "f", "5f": "g",
  "50": "h", "51": "i", "52": "j", "53": "k", "54": "l", "55": "m", "56": "n", "57": "o",
  "48": "p", "49": "q", "4a": "r", "4b": "s", "4c": "t", "4d": "u", "4e": "v", "4f": "w",
  "40": "x", "41": "y", "42": "z",
  "08": "0", "09": "1", "0a": "2", "0b": "3", "0c": "4", "0d": "5", "0e": "6", "0f": "7",
  "00": "8", "01": "9",
  "15": "-", "16": ".", "67": "_", "46": "~", "02": ":", "17": "/", "07": "?", "1b": "#",
  "63": "[", "65": "]", "78": "@", "19": "!", "1c": "$", "1e": "&",
  "10": "(", "11": ")", "12": "*", "13": "+", "14": ",", "03": ";", "05": "=", "1d": "%",
};

function decodeSourceUrl(encoded: string): string {
  const hex = encoded.startsWith("--") ? encoded.slice(2) : encoded;
  let decoded = "";
  for (let i = 0; i < hex.length; i += 2) {
    const byte = hex.slice(i, i + 2).toLowerCase();
    decoded += HEX_MAP[byte] ?? byte;
  }
  return decoded.replace("/clock", "/clock.json");
}

async function allanimePost(variables: object, query: string) {
  const res = await fetch(ALLANIME_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: REFERER, "User-Agent": UA },
    body: JSON.stringify({ variables, query }),
  });
  if (!res.ok) throw new Error(`AllAnime API ${res.status}`);
  return res.json();
}

interface SourceUrl {
  sourceUrl: string;
  sourceName: string;
  type?: string;
}

interface CdnLink {
  link?: string;
  src?: string;
  resolutionStr?: string;
  hls?: boolean;
}

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title") ?? "";
  const episode = parseInt(req.nextUrl.searchParams.get("episode") ?? "1", 10);

  if (!title.trim()) {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }

  try {
    // 1. Recherche du show sur AllAnime
    const searchData = await allanimePost(
      { search: { query: title }, limit: 10, page: 1, translationType: "sub", countryOrigin: "ALL" },
      `query($search:SearchInput,$limit:Int,$page:Int,$translationType:VaildTranslationTypeEnumType,$countryOrigin:VaildCountryOriginEnumType){shows(search:$search,limit:$limit,page:$page,translationType:$translationType,countryOrigin:$countryOrigin){edges{_id name availableEpisodes}}}`
    );

    const shows: Array<{ _id: string; name: string; availableEpisodes: { sub: number } }> =
      searchData?.data?.shows?.edges ?? [];
    if (!shows.length) {
      return NextResponse.json({ error: `Aucun résultat pour "${title}"` }, { status: 404 });
    }

    // Prendre le show avec le maximum d'épisodes sub (meilleure correspondance)
    const show = shows.reduce((best, s) =>
      (s.availableEpisodes?.sub ?? 0) > (best.availableEpisodes?.sub ?? 0) ? s : best
    );

    // 2. Sources pour l'épisode demandé
    const epData = await allanimePost(
      { showId: show._id, translationType: "sub", episodeString: String(episode) },
      `query($showId:String!,$translationType:VaildTranslationTypeEnumType!,$episodeString:String!){episode(showId:$showId,translationType:$translationType,episodeString:$episodeString){sourceUrls}}`
    );

    const sourceUrls: SourceUrl[] = epData?.data?.episode?.sourceUrls ?? [];
    if (!sourceUrls.length) {
      return NextResponse.json({ error: "Aucune source disponible" }, { status: 404 });
    }

    // 3. Priorité : Yt-mp4 > Default > Luf-Mp4 > premier disponible
    const priority = ["Yt-mp4", "Default", "Luf-Mp4", "S-mp4"];
    const picked =
      priority.map((name) => sourceUrls.find((s) => s.sourceName === name)).find(Boolean) ??
      sourceUrls[0];

    const rawUrl = picked.sourceUrl;
    const decodedUrl = rawUrl.startsWith("--") ? decodeSourceUrl(rawUrl) : rawUrl;

    // 4. Si l'URL décodée est directe (https://...), on la renvoie via proxy
    if (decodedUrl.startsWith("http")) {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(decodedUrl)}`;
      return NextResponse.json({
        url: proxyUrl,
        quality: "auto",
        isM3U8: decodedUrl.includes(".m3u8"),
        provider: picked.sourceName,
      });
    }

    // 5. Sinon c'est un chemin /apivtwo/clock.json → appel CDN AllAnime
    const cdnUrl = `${ALLANIME_BASE}${decodedUrl}`;
    const cdnRes = await fetch(cdnUrl, {
      headers: { Referer: REFERER, "User-Agent": UA },
    });
    if (!cdnRes.ok) throw new Error(`CDN ${cdnRes.status} pour ${cdnUrl}`);

    const cdnData = await cdnRes.json();
    const links: CdnLink[] = cdnData?.links ?? [];
    if (!links.length) throw new Error("Aucun lien dans la réponse CDN");

    const best =
      links.find((l) => l.resolutionStr === "1080p") ??
      links.find((l) => l.resolutionStr === "720p") ??
      links[0];

    const videoUrl = best.link ?? best.src ?? "";
    if (!videoUrl) throw new Error("URL vidéo introuvable dans la réponse CDN");

    const isM3U8 = best.hls === true || videoUrl.includes(".m3u8");
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(videoUrl)}`;

    return NextResponse.json({
      url: proxyUrl,
      quality: best.resolutionStr ?? "auto",
      isM3U8,
      provider: picked.sourceName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "Erreur lors de la récupération du stream", details: message.slice(0, 500) },
      { status: 500 }
    );
  }
}
