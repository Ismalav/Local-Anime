import { NextRequest, NextResponse } from "next/server";
import { searchManga } from "@/lib/animesama-scans";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ results: [] });

  try {
    const results = await searchManga(q);
    return NextResponse.json({ results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ results: [], error: msg }, { status: 500 });
  }
}
