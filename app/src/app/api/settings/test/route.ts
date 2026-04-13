import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { searchManga } from "@/lib/sushiscan";

export async function GET() {
  const { sushiscan } = getSettings();

  if (!sushiscan.cfClearance) {
    return NextResponse.json({
      ok: false,
      status: "missing-cookie",
      message: "Aucun cookie SushiScan enregistré.",
    });
  }

  try {
    const results = await searchManga(
      "naruto",
      sushiscan.cfClearance || undefined,
      sushiscan.userAgent || undefined
    );

    return NextResponse.json({
      ok: true,
      status: "connected",
      message: `Connexion valide (${results.length} résultat${results.length > 1 ? "s" : ""} de test).`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    const isCloudflare = message.includes("Cloudflare") || message.includes("403");

    return NextResponse.json({
      ok: false,
      status: isCloudflare ? "cloudflare-blocked" : "error",
      message: isCloudflare
        ? "Le cookie est enregistré, mais Cloudflare bloque encore les requêtes serveur vers SushiScan."
        : message,
    });
  }
}
