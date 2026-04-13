import { getSeasonalAnime, getTopAnime } from "@/lib/jikan";
import AnimeRow from "@/components/AnimeRow";
import TrendingRow from "@/components/TrendingRow";
import CartList from "@/components/CartList";
import Spotlight from "@/components/Spotlight";
import { AnimeCardProps } from "@/components/AnimeCard";
import { SpotlightItem } from "@/components/Spotlight";

export const revalidate = 3600;

function mapAnime(a: {
  mal_id: number;
  title: string;
  title_english?: string;
  images: { jpg: { large_image_url: string; image_url: string } };
  score?: number;
  episodes?: number;
  year?: number;
  synopsis?: string;
}): AnimeCardProps {
  return {
    id: a.mal_id,
    title: a.title_english || a.title,
    image: a.images.jpg.large_image_url || a.images.jpg.image_url,
    score: a.score,
    episodes: a.episodes,
    year: a.year,
  };
}

function mapSpotlight(a: {
  mal_id: number;
  title: string;
  title_english?: string;
  images: { jpg: { large_image_url: string; image_url: string } };
  score?: number;
  episodes?: number;
  year?: number;
  synopsis?: string;
  type?: string;
}): SpotlightItem {
  return {
    id: a.mal_id,
    title: a.title_english || a.title,
    image: a.images.jpg.large_image_url || a.images.jpg.image_url,
    score: a.score,
    episodes: a.episodes,
    year: a.year,
    synopsis: a.synopsis,
    type: a.type,
  };
}

export default async function HomePage() {
  const [seasonal, top] = await Promise.all([getSeasonalAnime(), getTopAnime()]);

  const spotlights = seasonal.slice(0, 6).map(mapSpotlight);
  const trending = seasonal.map(mapAnime);
  const topRated = top.map(mapAnime);
  // Split top into carts
  const cart1 = topRated.slice(0, 5);
  const cart2 = topRated.slice(5, 10);
  const cart3 = seasonal.slice(0, 5).map(mapAnime);
  const cart4 = topRated.slice(10, 15);

  return (
    <div className="min-h-screen">
      {/* Spotlight carousel */}
      <Spotlight items={spotlights} />

      <div className="mx-auto w-full max-w-[1520px] px-3 sm:px-5 lg:px-8 pb-16">
        {/* Trending numéroté */}
        <TrendingRow items={trending} />

        {/* Grilles + carts côte à côte */}
        <div className="mt-16 px-1">
          <AnimeRow title="Cette saison" items={trending} href="/search" />
        </div>

        {/* 4 carts en grid 2×2 */}
        <div className="mt-8 px-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 rounded-2xl border border-white/6 bg-white/[0.015] p-4 sm:p-5 lg:p-6">
          <CartList label="En ce moment" items={cart1} />
          <CartList label="Les mieux notés" items={cart2} />
          <CartList label="Saison actuelle" items={cart3} />
          <CartList label="Séries populaires" items={cart4} />
        </div>

        <div className="mt-18 px-1">
          <AnimeRow title="Top animés" items={topRated} href="/search" />
        </div>
      </div>
    </div>
  );
}


