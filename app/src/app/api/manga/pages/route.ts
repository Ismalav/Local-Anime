import { NextRequest, NextResponse } from "next/server";
import { getChapterPages } from "@/lib/animesama-scans";

export async function GET(req: NextRequest) {
  const chapterSlug = req.nextUrl.searchParams.get("chapterId") ?? "";
  const mangaSlug = req.nextUrl.searchParams.get("id") ?? "";
  if (!chapterSlug || !mangaSlug)
    return NextResponse.json({ pages: [] }, { status: 400 });

  try {
    const pages = await getChapterPages(mangaSlug, chapterSlug);
    if (!pages.length) return NextResponse.json({ pages: [] }, { status: 404 });
    return NextResponse.json({ pages });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ pages: [], error: msg }, { status: 500 });
  }
}
