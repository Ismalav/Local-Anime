import { NextRequest, NextResponse } from "next/server";

const KEIYOUSHI_INDEX_URL =
  "https://raw.githubusercontent.com/keiyoushi/extensions/repo/index.min.json";

type KeiyoushiSource = {
  name: string;
  lang: string;
  id: string;
  baseUrl?: string;
};

type KeiyoushiExtension = {
  name: string;
  pkg: string;
  version: string;
  nsfw?: number;
  sources?: KeiyoushiSource[];
};

type FlatSource = {
  id: string;
  name: string;
  lang: string;
  baseUrl: string;
  nsfw: boolean;
  extensionName: string;
  version: string;
};

function normalizeSources(extensions: KeiyoushiExtension[]): FlatSource[] {
  return extensions.flatMap((ext) => {
    const extSources = ext.sources ?? [];
    return extSources
      .filter((s) => !!s.baseUrl)
      .map((s) => ({
        id: `${ext.pkg}:${s.id}`,
        name: s.name,
        lang: s.lang,
        baseUrl: s.baseUrl as string,
        nsfw: (ext.nsfw ?? 0) === 1,
        extensionName: ext.name,
        version: ext.version,
      }));
  });
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const lang = (req.nextUrl.searchParams.get("lang") ?? "all").trim().toLowerCase();
  const includeNsfw = req.nextUrl.searchParams.get("nsfw") === "1";

  try {
    const res = await fetch(KEIYOUSHI_INDEX_URL, {
      next: { revalidate: 60 * 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { sources: [], error: "Impossible de récupérer le dépôt manga." },
        { status: 502 }
      );
    }

    const json = (await res.json()) as KeiyoushiExtension[];
    let sources = normalizeSources(json);

    if (!includeNsfw) {
      sources = sources.filter((s) => !s.nsfw);
    }

    if (lang !== "all") {
      sources = sources.filter((s) => s.lang.toLowerCase() === lang);
    }

    if (q) {
      sources = sources.filter((s) => {
        const haystack = `${s.name} ${s.extensionName} ${s.baseUrl}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    sources.sort((a, b) => a.name.localeCompare(b.name, "fr"));

    return NextResponse.json({
      sources,
      total: sources.length,
      langs: Array.from(new Set(sources.map((s) => s.lang))).sort((a, b) =>
        a.localeCompare(b, "fr")
      ),
    });
  } catch {
    return NextResponse.json(
      { sources: [], error: "Erreur serveur lors du chargement des sources manga." },
      { status: 500 }
    );
  }
}
