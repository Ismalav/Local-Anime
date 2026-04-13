"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import AnimeCard, { AnimeCardProps } from "@/components/AnimeCard";

type SearchResult = AnimeCardProps & {
  genres: string[];
};

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [dateSort, setDateSort] = useState<"none" | "newest" | "oldest">("none");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/search${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.results ?? []);
        setSelectedGenre("all");
        setDateSort("none");
      })
      .catch(() => setError("Erreur lors de la recherche."))
      .finally(() => setLoading(false));
  }, [q]);

  const allGenres = Array.from(
    new Set(results.flatMap((anime) => anime.genres ?? []))
  ).sort((a, b) => a.localeCompare(b, "fr"));

  const displayedResults = [...results]
    .filter((anime) =>
      selectedGenre === "all" ? true : (anime.genres ?? []).includes(selectedGenre)
    )
    .sort((a, b) => {
      if (dateSort === "none") return 0;
      const yearA = a.year ?? 0;
      const yearB = b.year ?? 0;
      return dateSort === "newest" ? yearB - yearA : yearA - yearB;
    });

  return (
    <div
      className="min-h-screen px-4 pb-14 sm:px-6 lg:px-8"
      style={{ paddingTop: "118px" }}
    >
      <div className="mx-auto flex w-full max-w-[1420px] flex-col items-center">
        <h1 className="mb-2 text-center text-[2.3rem] font-black gradient-text sm:text-5xl" style={{letterSpacing:"-0.03em"}}>
          {q ? `Résultats pour "${q}"` : "Explorer les animés"}
        </h1>
        <p className="mb-10 text-center text-sm text-gray-400">
          Découvre rapidement par catégorie et date de sortie
        </p>

      {!!results.length && (
        <div className="filter-toolbar mx-auto mb-10 flex w-full max-w-[1120px] flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-end lg:justify-center">
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="genre-filter" className="filter-label">
              Catégorie
            </label>
            <select
              id="genre-filter"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="filter-select w-full"
            >
              <option value="all">Toutes</option>
              {allGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="date-sort" className="filter-label">
              Date de sortie
            </label>
            <select
              id="date-sort"
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value as "none" | "newest" | "oldest")}
              className="filter-select w-full"
            >
              <option value="none">Par défaut</option>
              <option value="newest">Plus récents</option>
              <option value="oldest">Plus anciens</option>
            </select>
          </div>

          <div className="rounded-xl px-4 py-3 text-center lg:min-w-[210px]" style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">Résultats</p>
            <p className="text-xl font-black text-white">{displayedResults.length}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#7b61ff", borderTopColor: "transparent" }} />
        </div>
      )}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && !error && results.length === 0 && (
        <div className="surface-card mx-auto mb-6 max-w-xl px-6 py-8 text-center">
          <p className="mb-2 text-lg font-semibold text-white">Aucun résultat</p>
          <p className="text-sm text-gray-400">
            {q ? "Essaie avec un autre titre, ou une orthographe plus simple." : "Aucun anime disponible pour le moment."}
          </p>
        </div>
      )}
      {!loading && !error && results.length > 0 && displayedResults.length === 0 && (
        <div className="surface-card mx-auto mb-6 max-w-xl px-6 py-6 text-center">
          <p className="text-sm text-gray-300">Aucun anime pour ce filtre. Essaie une autre catégorie ou enlève le tri.</p>
        </div>
      )}
        <div className="mx-auto grid w-full max-w-[1300px] justify-center gap-x-6 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(196px,196px))]">
          {displayedResults.map((anime, index) => (
            <div key={`${anime.id}-${index}`} className="w-[196px]">
              <AnimeCard {...anime} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
