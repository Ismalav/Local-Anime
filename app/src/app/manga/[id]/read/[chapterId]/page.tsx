"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface ChapterInfo {
  id: string;
  chapter: string;
  title: string | null;
  pages: number;
}

export default function ReaderPage() {
  const { id: mangaId, chapterId } = useParams<{ id: string; chapterId: string }>();
  const router = useRouter();

  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<"hq" | "lq">("hq");
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Liste des chapitres pour prev/next
  useEffect(() => {
    fetch(`/api/manga/chapters?id=${mangaId}`)
      .then((r) => r.json())
      .then((data) => {
        const list: ChapterInfo[] = data.chapters ?? [];
        setChapters(list);
        setCurrentIndex(list.findIndex((c) => c.id === chapterId));
      });
  }, [mangaId, chapterId]);

  // Pages du chapitre courant
  const loadPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const q = quality === "lq" ? "&q=saver" : "";
      const res = await fetch(`/api/manga/pages?chapterId=${chapterId}&id=${mangaId}${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur de chargement");
      setPages(data.pages ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [chapterId, quality]);

  useEffect(() => {
    loadPages();
    // Retour en haut lors du changement de chapitre
    window.scrollTo({ top: 0 });
  }, [loadPages]);

  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  const current = currentIndex >= 0 ? chapters[currentIndex] : null;

  return (
    <div className="min-h-screen" style={{ paddingTop: "94px" }}>
      {/* Barre de navigation du lecteur */}
      <div className="sticky top-3 z-40 mx-auto flex w-[calc(100%-1.5rem)] max-w-[1280px] items-center justify-between gap-4 rounded-2xl border border-white/10 px-4 py-3 backdrop-blur sm:px-6" style={{background:"rgba(8,8,16,0.88)"}}>
        <div className="flex items-center gap-4">
          <Link
            href={`/manga/${mangaId}`}
            className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </Link>
          {current && (
            <span className="text-white font-medium text-sm">
              Chapitre {current.chapter}{current.title ? ` — ${current.title}` : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Qualité */}
          <div className="flex items-center gap-1 rounded p-1 text-xs" style={{background:"rgba(255,255,255,0.08)"}}>
            <button
              onClick={() => setQuality("hq")}
              className={`px-2 py-1 rounded transition-colors font-bold ${quality === "hq" ? "text-white" : "text-gray-400 hover:text-white"}`}
              style={quality === "hq" ? {background:"linear-gradient(135deg,#ff3d71,#7b61ff)"} : {}}
            >
              HD
            </button>
            <button
              onClick={() => setQuality("lq")}
              className={`px-2 py-1 rounded transition-colors font-bold ${quality === "lq" ? "text-white" : "text-gray-400 hover:text-white"}`}
              style={quality === "lq" ? {background:"linear-gradient(135deg,#ff3d71,#7b61ff)"} : {}}
            >
              LQ
            </button>
          </div>

          {/* Prev / Next */}
          {prevChapter && (
            <button
              onClick={() => router.push(`/manga/${mangaId}/read/${prevChapter.id}`)}
              className="text-gray-300 hover:text-white transition-colors text-xs flex items-center gap-1 px-3 py-1.5 rounded"
              style={{background:"rgba(255,255,255,0.08)"}}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Précédent
            </button>
          )}
          {nextChapter && (
            <button
              onClick={() => router.push(`/manga/${mangaId}/read/${nextChapter.id}`)}
              className="text-gray-300 hover:text-white transition-colors text-xs flex items-center gap-1 px-3 py-1.5 rounded"
              style={{background:"rgba(255,255,255,0.08)"}}
            >
              Suivant
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="mx-auto w-full max-w-[1080px] px-4 py-7">
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Chargement des pages…</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-3">{error}</p>
            <button
              onClick={loadPages}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && pages.length === 0 && (
          <p className="text-center text-gray-400 py-20">Aucune page disponible pour ce chapitre.</p>
        )}

        {!loading && pages.map((src, i) => (
          <div key={i} className="mb-3 w-full overflow-hidden rounded-lg border border-white/10 bg-black/30">
            <Image
              src={src}
              alt={`Page ${i + 1}`}
              width={840}
              height={1200}
              className="w-full h-auto"
              unoptimized
              priority={i < 3}
            />
          </div>
        ))}

        {/* Nav bas de page */}
        {!loading && pages.length > 0 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
            {prevChapter ? (
              <Link
                href={`/manga/${mangaId}/read/${prevChapter.id}`}
                className="flex items-center gap-2 text-gray-300 hover:text-white text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Chapitre {prevChapter.chapter}
              </Link>
            ) : <div />}
            {nextChapter ? (
              <Link
                href={`/manga/${mangaId}/read/${nextChapter.id}`}
                className="flex items-center gap-2 text-gray-300 hover:text-white text-sm"
              >
                Chapitre {nextChapter.chapter}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <Link
                href={`/manga/${mangaId}`}
                className="text-red-500 hover:text-red-400 text-sm"
              >
                Fin — retour au manga
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
