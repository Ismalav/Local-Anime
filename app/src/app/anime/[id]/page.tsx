import { getAnimeById } from "@/lib/jikan";
import { notFound } from "next/navigation";
import Image from "next/image";
import AnimeDetailClient from "./AnimeDetailClient";

const STATUS_FR: Record<string, string> = {
  "Finished Airing": "Terminé",
  "Currently Airing": "En cours",
  "Not yet aired": "À venir",
};

const TYPE_FR: Record<string, string> = {
  TV: "Série TV",
  Movie: "Film",
  OVA: "OVA",
  ONA: "ONA",
  Special: "Spécial",
  Music: "Clip musical",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AnimePage({ params }: Props) {
  const { id } = await params;
  const anime = await getAnimeById(id);
  if (!anime) notFound();

  return (
    <div className="min-h-screen">
      {/* Backdrop */}
      <div className="relative h-[36vh] overflow-hidden sm:h-[42vh] md:h-[50vh]">
        <Image
          src={anime.images.jpg.large_image_url || anime.images.jpg.image_url}
          alt={anime.title}
          fill
          unoptimized
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080810]/80 to-transparent" />
      </div>

      {/* Infos */}
      <div className="relative z-10 -mt-20 px-4 pb-10 sm:-mt-24 sm:px-6 md:-mt-32 lg:px-8">
        <div className="mx-auto w-full max-w-[1320px]">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="mx-auto w-36 flex-shrink-0 overflow-hidden rounded shadow-2xl sm:w-44 md:mx-0 md:block">
            <Image
              src={anime.images.jpg.large_image_url || anime.images.jpg.image_url}
              alt={anime.title}
              width={176}
              height={264}
              className="w-full object-cover"
            />
          </div>
          <div className="flex-1 pt-4 sm:pt-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
              {anime.title_english || anime.title}
            </h1>
            {anime.title_english && anime.title !== anime.title_english && (
              <p className="text-gray-400 text-sm mb-3">{anime.title}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
              {anime.score && (
                <span className="font-semibold" style={{ color: "#ff3d71" }}>★ {anime.score.toFixed(1)}</span>
              )}
              {anime.episodes && <span className="text-gray-300">{anime.episodes} épisodes</span>}
              {anime.year && <span className="text-gray-300">{anime.year}</span>}
              {anime.status && (
                <span className="px-2 py-0.5 rounded text-xs text-gray-200" style={{background:"rgba(123,97,255,0.15)",border:"1px solid rgba(123,97,255,0.2)"}}>
                  {anime.status}
                </span>
              )}
              {anime.type && (
                <span className="px-2 py-0.5 rounded text-xs text-gray-200" style={{background:"rgba(123,97,255,0.15)",border:"1px solid rgba(123,97,255,0.2)"}}>
                  {anime.type}
                </span>
              )}
            </div>
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {anime.genres.map((g) => (
                  <span key={g.name} className="text-gray-300 px-2 py-0.5 rounded-full text-xs hover:text-[#9a82ff] transition-colors" style={{background:"rgba(123,97,255,0.12)",border:"1px solid rgba(123,97,255,0.18)"}}>
                    {g.name}
                  </span>
                ))}
              </div>
            )}
            {anime.synopsis && (
              <p className="text-gray-300 text-sm leading-relaxed max-w-2xl">{anime.synopsis}</p>
            )}
          </div>
        </div>

        {/* Client interactif : favoris + liste d'épisodes */}
        <AnimeDetailClient
          animeId={String(anime.mal_id)}
          animeTitle={anime.title_english || anime.title}
          animeImage={anime.images.jpg.large_image_url || anime.images.jpg.image_url}
        />
        </div>
      </div>
    </div>
  );
}
