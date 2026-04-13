import { NextRequest, NextResponse } from "next/server";
import { getTopAnime, searchAnime } from "@/lib/jikan";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    const results = q.trim() ? await searchAnime(q) : await getTopAnime();
    const simplified = results.map((a) => ({
      id: a.mal_id,
      title: a.title_english || a.title,
      image: a.images.jpg.large_image_url || a.images.jpg.image_url,
      score: a.score,
      episodes: a.episodes,
      year: a.year,
      genres: a.genres?.map((g) => g.name) ?? [],
    }));
    return NextResponse.json({ results: simplified });
  } catch {
    return NextResponse.json({ results: [], error: "Erreur lors de la recherche" }, { status: 500 });
  }
}
