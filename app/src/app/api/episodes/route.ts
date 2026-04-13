import { NextRequest, NextResponse } from "next/server";
import { getAnimeEpisodes } from "@/lib/jikan";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ episodes: [] });
  }
  try {
    const episodes = await getAnimeEpisodes(id);
    return NextResponse.json({ episodes });
  } catch {
    return NextResponse.json({ episodes: [], error: "Erreur" }, { status: 500 });
  }
}
