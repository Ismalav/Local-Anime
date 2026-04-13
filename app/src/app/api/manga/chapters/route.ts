import { NextRequest, NextResponse } from "next/server";
import { getMangaChapters } from "@/lib/animesama-scans";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("id") ?? "";
  if (!slug) return NextResponse.json({ chapters: [] });

  try {
    const chapters = await getMangaChapters(slug);
    return NextResponse.json({ chapters });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ chapters: [], error: msg }, { status: 500 });
  }
}
