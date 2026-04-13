"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isFavorite, toggleFavorite } from "@/lib/storage";

interface Episode {
  mal_id: number;
  title: string;
  title_japanese?: string;
  title_romanji?: string;
  aired?: string;
}

interface Props {
  animeId: string;
  animeTitle: string;
  animeImage: string;
}

export default function AnimeDetailClient({ animeId, animeTitle, animeImage }: Props) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEp, setLoadingEp] = useState(true);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFavorite(animeId));
    fetch(`/api/episodes?id=${animeId}`)
      .then((r) => r.json())
      .then((d) => setEpisodes(d.episodes ?? []))
      .finally(() => setLoadingEp(false));
  }, [animeId]);

  function handleFav() {
    const newState = toggleFavorite({ id: animeId, title: animeTitle, image: animeImage });
    setFav(newState);
  }

  return (
    <div className="mt-8">
      {/* Boutons d'action */}
      <div className="mb-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {episodes.length > 0 && (
          <Link
            href={`/watch/${animeId}?ep=1&title=${encodeURIComponent(animeTitle)}`}
            className="btn-primary"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Regarder épisode 1
          </Link>
        )}
        <button
          onClick={handleFav}
          className={`btn-secondary ${
            fav
              ? "border-[#9a82ff]/50 bg-[#7b61ff]/10 text-[#9a82ff]"
              : ""
          }`}
        >
          {fav ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              Dans mes favoris
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Ajouter aux favoris
            </>
          )}
        </button>
      </div>

      {/* Liste d'épisodes */}
      <h2 className="text-xl font-black mb-4 gradient-text">Épisodes</h2>
      {loadingEp ? (
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#7b61ff", borderTopColor: "transparent" }} />
          Chargement des épisodes...
        </div>
      ) : episodes.length === 0 ? (
        <p className="text-gray-400 text-sm">
          Aucune liste d&apos;épisodes disponible. Tu peux quand même lancer le stream depuis la page de lecture.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {episodes.map((ep, index) => {
            const episodeNumber = index + 1;
            return (
              <Link
                key={`${ep.mal_id}-${episodeNumber}`}
                href={`/watch/${animeId}?ep=${episodeNumber}&title=${encodeURIComponent(animeTitle)}`}
                className="btn-episode group"
              >
                <span className="font-bold text-sm w-8 flex-shrink-0" style={{ color: "#9a82ff" }}>
                  {episodeNumber}
                </span>
                <span className="min-w-0 flex-1 text-gray-200 text-sm line-clamp-1 group-hover:text-white transition-colors">
                  {ep.title_romanji || ep.title_japanese || `Épisode ${episodeNumber}`}
                </span>
                <svg className="w-4 h-4 text-gray-500 group-hover:text-[#9a82ff] ml-auto flex-shrink-0 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
