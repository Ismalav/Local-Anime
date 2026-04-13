import { NextRequest, NextResponse } from "next/server";
import { getAnimeSamaStreamUrl } from "@/lib/animesama";

function candidateTitles(rawTitle: string): string[] {
  const t = rawTitle.trim();
  const candidates = new Set<string>([t]);

  // Remove common suffixes and punctuation variants that often break lookups
  candidates.add(t.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim());
  candidates.add(t.replace(/\s*\[[^\]]*\]\s*/g, " ").replace(/\s+/g, " ").trim());
  candidates.add(t.split(":")[0].trim());
  candidates.add(t.split("-")[0].trim());
  candidates.add(t.replace(/[’']/g, " ").replace(/\s+/g, " ").trim());

  return [...candidates].filter((x) => x.length >= 2);
}

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title") ?? "";
  const ep = parseInt(req.nextUrl.searchParams.get("ep") ?? "1", 10);
  const lang = (req.nextUrl.searchParams.get("lang") ?? "vostfr") as "vostfr" | "vf";

  if (!title) {
    return NextResponse.json({ error: "Paramètre title requis" }, { status: 400 });
  }

  try {
    let result = null;
    for (const candidate of candidateTitles(title)) {
      result = await getAnimeSamaStreamUrl(candidate, ep, lang);
      if (result) break;
    }

    if (!result) {
      return NextResponse.json(
        { error: "Stream introuvable sur anime-sama.to" },
        { status: 404 }
      );
    }

    // Wrap Sibnet CDN URL in the proxy with sibnet referer
    // Vidmoly M3U8 is returned directly (browser-side HLS)
    const streamUrl =
      result.type === "sibnet"
        ? `/api/proxy?url=${encodeURIComponent(result.url)}&referer=sibnet`
        : result.url;

    return NextResponse.json({ url: streamUrl, type: result.type, source: "animesama" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
