"use client";

import { useEffect, useState } from "react";
import { getHistory, clearHistory, removeHistoryByAnime, HistoryItem } from "@/lib/storage";
import Link from "next/link";
import Image from "next/image";

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  function handleClear() {
    if (!window.confirm("Supprimer tout l'historique de lecture ?")) return;
    clearHistory();
    setHistory([]);
  }

  function handleRemoveAnime(animeId: string | number, animeTitle: string) {
    if (!window.confirm(`Supprimer ${animeTitle} de l'historique ?`)) return;
    removeHistoryByAnime(animeId);
    setHistory(getHistory());
  }

  return (
    <div
      className="min-h-screen px-4 pb-12 sm:px-6 lg:px-8"
      style={{ paddingTop: "118px" }}
    >
      <div className="mx-auto w-full max-w-[1320px]">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black gradient-text">Continuer a regarder</h1>
          {history.length > 0 && (
            <p className="mt-1 text-sm text-gray-400">
              {history.length} épisode{history.length > 1 ? "s" : ""} dans ton historique.
            </p>
          )}
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="btn-danger w-full self-start sm:w-auto"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8" />
            </svg>
            Vider l&apos;historique
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="surface-card mx-auto max-w-xl px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <svg className="h-6 w-6" style={{color:"#ff3d71"}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55-2.28A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M5 6h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
            </svg>
          </div>
          <p className="mb-2 text-lg font-semibold text-white">Ton historique est vide</p>
          <p className="mb-5 text-sm text-gray-400">Lance un épisode et il apparaîtra ici pour reprendre rapidement.</p>
          <Link
            href="/search"
            className="btn-primary"
          >
            Explorer les animés
          </Link>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-[980px] flex-col gap-3">
          {history.map((item, i) => (
            <div
              key={i}
              className="surface-card rounded-xl p-3 transition-colors sm:p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/watch/${item.animeId}?ep=${item.episode}&title=${encodeURIComponent(item.animeTitle)}`}
                  className="group flex min-w-0 flex-1 items-center gap-3 sm:gap-4"
                >
                  {item.animeImage && (
                    <div className="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded">
                      <Image src={item.animeImage} alt={item.animeTitle} fill className="object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-white">{item.animeTitle}</p>
                    <p className="text-xs text-gray-400">Épisode {item.episode}</p>
                  </div>
                  <div className="hidden flex-shrink-0 text-xs text-gray-600 sm:block">
                    {new Date(item.timestamp).toLocaleDateString("fr-FR")}
                  </div>
                  <svg className="h-5 w-5 flex-shrink-0 text-gray-500 transition-colors group-hover:text-[#9a82ff]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/anime/${item.animeId}`}
                  className="btn-secondary !rounded-full !px-3 !py-1.5 !text-xs"
                >
                  Voir la fiche
                </Link>
                <button
                  onClick={() => handleRemoveAnime(item.animeId, item.animeTitle)}
                  className="btn-danger !rounded-full !px-3 !py-1.5 !text-xs"
                  aria-label={`Supprimer ${item.animeTitle} de l'historique`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8" />
                  </svg>
                  Supprimer cet animé
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
