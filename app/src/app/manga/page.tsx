"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { AsManga } from "@/lib/animesama-scans";

interface SearchResponse {
  results: AsManga[];
  error?: string;
}

const POPULAR_QUERIES = ["drcl", "20th", "absolute", "100", "regression"];

export default function MangaPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AsManga[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Charge des mangas populaires au démarrage
  useEffect(() => {
    const random = POPULAR_QUERIES[Math.floor(Math.random() * POPULAR_QUERIES.length)];
    load(random);
  }, []);

  function load(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    fetch(`/api/manga/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d: SearchResponse) => {
        setResults(d.results ?? []);
        if (d.error) setError(d.error);
      })
      .catch(() => setError("Erreur lors de la recherche."))
      .finally(() => setLoading(false));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    load(query);
  }

  return (
    <div
      className="min-h-screen px-4 pb-14 sm:px-6 lg:px-8"
      style={{ paddingTop: "118px" }}
    >
      <div className="mx-auto flex w-full max-w-[1420px] flex-col items-center">
        <h1 className="text-3xl font-black mb-2 gradient-text text-center">Manga</h1>
        <p className="text-gray-400 text-sm mb-8 text-center">
          Recherche et lis des mangas directement depuis le catalogue scans Anime-Sama.
        </p>

      <form onSubmit={handleSubmit} className="mb-10 flex w-full max-w-[1120px] flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Titre du manga..."
          className="flex-1 rounded-2xl px-5 py-3.5 text-base text-white outline-none transition-all font-bold placeholder:text-gray-500" style={{background:"rgba(10,15,35,0.8)",border:"2px solid rgba(123,97,255,0.22)"}}
        />
        <button
          type="submit"
          className="btn-primary !px-6 !py-3.5 !text-base"
        >
          Rechercher
        </button>
      </form>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#7b61ff", borderTopColor: "transparent" }} />
        </div>
      )}

      {error ? (
        <p className="text-red-400 mb-4">{error}</p>
      ) : null}

      {!loading && !error && results.length === 0 && (
        <div className="surface-card max-w-xl px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <svg className="h-6 w-6" style={{color:"#ff3d71"}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mb-2 text-lg font-semibold text-white">Pas encore de résultats manga</p>
          <p className="text-sm text-gray-400">
            Lance une recherche manuelle (ex: One Piece, Naruto, Berserk, Vagabond...).
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mx-auto grid w-full max-w-[1240px] justify-center gap-x-5 gap-y-7 [grid-template-columns:repeat(auto-fit,minmax(196px,196px))]">
          {results.map((manga, index) => (
            <Link
              key={`${manga.id}-${index}`}
              href={`/manga/${manga.id}`}
              className="group relative block w-[196px] cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1" style={{border:"1px solid rgba(123,97,255,0.18)",background:"rgba(18,24,48,0.88)",boxShadow:"0 8px 28px rgba(0,0,0,0.38)"}}>
              <div className="relative aspect-[2/3] w-full" style={{background:"rgba(18,24,48,0.6)"}}>
                {manga.coverUrl ? (
                  <Image
                    src={manga.coverUrl}
                    alt={manga.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600 text-xs p-2 text-center">
                    {manga.title}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white font-semibold text-xs line-clamp-2">{manga.title}</p>
                  {manga.year && <p className="text-gray-300 text-xs mt-0.5">{manga.year}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
