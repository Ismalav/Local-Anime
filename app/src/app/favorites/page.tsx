"use client";

import { useEffect, useState } from "react";
import { getFavorites, toggleFavorite, FavoriteItem } from "@/lib/storage";
import AnimeCard from "@/components/AnimeCard";

export default function FavoritesPage() {
  const [favs, setFavs] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    setFavs(getFavorites());
  }, []);

  function removeFav(item: FavoriteItem) {
    toggleFavorite(item);
    setFavs(getFavorites());
  }

  return (
    <div
      className="min-h-screen px-4 pb-12 sm:px-6 lg:px-8"
      style={{ paddingTop: "118px" }}
    >
      <div className="mx-auto flex w-full max-w-[1420px] flex-col items-center">
        <h1 className="text-3xl font-black mb-2 gradient-text text-center">Mes animés</h1>
        <p className="mb-8 text-sm text-gray-400 text-center">Retrouve rapidement tous tes favoris au meme endroit.</p>
        {favs.length === 0 ? (
          <div className="surface-card mx-auto max-w-xl px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <svg className="h-6 w-6" style={{color:"#ff3d71"}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="mb-2 text-lg font-semibold text-white">Aucun favori pour le moment</p>
          <p className="mb-5 text-sm text-gray-400">Ajoute des animés à tes favoris pour les retrouver ici en un clic.</p>
          <a
            href="/search"
            className="btn-primary"
          >
            Trouver un animé
          </a>
          </div>
        ) : (
          <div className="mx-auto grid w-full max-w-[1240px] justify-center gap-x-5 gap-y-7 [grid-template-columns:repeat(auto-fit,minmax(196px,196px))]">
            {favs.map((item) => (
              <div key={item.id} className="relative group w-[196px]">
                <AnimeCard id={item.id} title={item.title} image={item.image} />
                <button
                  onClick={() => removeFav(item)}
                  className="btn-icon absolute right-2 top-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Retirer des favoris"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
    </div>
  );
}
