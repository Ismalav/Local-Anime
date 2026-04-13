import { NextRequest, NextResponse } from "next/server";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

// Referers autorisés — listés côté serveur uniquement, pas injectables par le client
const ALLOWED_REFERERS: Record<string, { referer: string; origin: string }> = {
  default: { referer: "https://allmanga.to", origin: "https://allmanga.to" },
  sibnet: { referer: "https://video.sibnet.ru/", origin: "https://video.sibnet.ru" },
  vidmoly: { referer: "https://vidmoly.to/", origin: "https://vidmoly.to" },
};

// Proxy transparent pour les vidéos qui nécessitent un Referer spécifique.
// Supporte les Range requests (lecture vidéo partielle dans le navigateur).
export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Paramètre url requis" }, { status: 400 });
  }

  // Validation : on n'accepte que les URLs https pointant vers des CDN connus
  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  const allowedHosts = [
    "tools.fast4speed.rsvp",
    "allanime.day",
    "cdn.allanime.day",
    "repackager.wixmp.com",
    "wixmp.com",
    // Sibnet CDN
    "video.sibnet.ru",
    "sibnet.ru",
    // Vidmoly
    "vidmoly.to",
    "vidmoly.net",
    "vmwesa.online",
  ];

  const isAllowed =
    targetUrl.protocol === "https:" &&
    allowedHosts.some(
      (h) => targetUrl.hostname === h || targetUrl.hostname.endsWith(`.${h}`)
    );

  if (!isAllowed) {
    return NextResponse.json({ error: "Hôte non autorisé" }, { status: 403 });
  }

  // Résoudre le referer à partir du paramètre (valeurs fixes côté serveur)
  const refererKey = req.nextUrl.searchParams.get("referer") ?? "default";
  const refererCfg = ALLOWED_REFERERS[refererKey] ?? ALLOWED_REFERERS.default;

  const upstreamHeaders: HeadersInit = {
    Referer: refererCfg.referer,
    "User-Agent": UA,
    Origin: refererCfg.origin,
  };

  // Transférer l'en-tête Range si le navigateur en envoie un (seek vidéo)
  const range = req.headers.get("range");
  if (range) upstreamHeaders["Range"] = range;

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: upstreamHeaders,
    });

    const responseHeaders = new Headers();

    const upstreamContentType = upstream.headers.get("content-type");
    // Forcer video/mp4 si le CDN envoie application/octet-stream pour une URL vidéo
    const contentType =
      upstreamContentType === "application/octet-stream" || !upstreamContentType
        ? targetUrl.pathname.includes(".m3u8")
          ? "application/x-mpegURL"
          : "video/mp4"
        : upstreamContentType;
    responseHeaders.set("content-type", contentType);

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) responseHeaders.set("content-length", contentLength);

    const contentRange = upstream.headers.get("content-range");
    if (contentRange) responseHeaders.set("content-range", contentRange);

    responseHeaders.set("accept-ranges", "bytes");
    responseHeaders.set("access-control-allow-origin", "*");

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "Erreur proxy", details: message.slice(0, 200) },
      { status: 502 }
    );
  }
}
