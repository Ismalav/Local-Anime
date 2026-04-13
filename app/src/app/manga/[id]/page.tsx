import { getMangaDetail, getMangaChapters } from "@/lib/animesama-scans";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_FR: Record<string, string> = {
  ongoing: "En cours",
  completed: "Terminé",
  hiatus: "En pause",
  cancelled: "Annulé",
};

export default async function MangaDetailPage({ params }: Props) {
  const { id } = await params;
  const [manga, chapters] = await Promise.all([
    getMangaDetail(id),
    getMangaChapters(id),
  ]);

  if (!manga) notFound();

  return (
      <div className="min-h-screen" style={{ paddingTop: "94px" }}>
      {/* Backdrop cover floue */}
      {manga.coverUrl && (
        <div className="relative h-[34vh] overflow-hidden sm:h-[40vh] md:h-[45vh]">
          <Image
            src={manga.coverUrl}
            alt={manga.title}
            fill
            className="object-cover object-top blur-sm scale-110"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080810]/80 to-transparent" />
        </div>
      )}

      <div className="relative z-10 -mt-20 px-4 pb-12 sm:-mt-24 sm:px-6 md:-mt-32 lg:px-8">
        <div className="mx-auto w-full max-w-[1320px]">
        <div className="flex flex-col md:flex-row gap-8">
          {manga.coverUrl && (
            <div className="mx-auto hidden w-36 flex-shrink-0 overflow-hidden rounded shadow-2xl sm:w-44 md:mx-0 md:block">
              <Image
                src={manga.coverUrl}
                alt={manga.title}
                width={176}
                height={264}
                className="w-full object-cover"
                unoptimized
              />
            </div>
          )}

          <div className="flex-1 pt-4 sm:pt-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
              {manga.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
              {manga.year && <span className="text-gray-300">{manga.year}</span>}
              {manga.status && (
              <span className="px-2 py-0.5 rounded text-xs text-gray-200" style={{background:"rgba(123,97,255,0.15)",border:"1px solid rgba(123,97,255,0.2)"}}>
                  {STATUS_FR[manga.status] ?? manga.status}
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-xs text-gray-200" style={{background:"rgba(123,97,255,0.15)",border:"1px solid rgba(123,97,255,0.2)"}}>
                {chapters.length} chapitre{chapters.length > 1 ? "s" : ""} en FR
              </span>
            </div>

            {manga.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {manga.genres.map((g) => (
                  <span key={g} className="text-gray-300 px-2 py-0.5 rounded-full text-xs hover:text-[#9a82ff] transition-colors" style={{background:"rgba(123,97,255,0.12)",border:"1px solid rgba(123,97,255,0.18)"}}>
                    {g}
                  </span>
                ))}
              </div>
            )}

            {manga.description && (
              <p className="text-gray-300 text-sm leading-relaxed max-w-2xl line-clamp-4">
                {manga.description}
              </p>
            )}

            {chapters.length > 0 && (
              <div className="mt-6 flex gap-3">
                <Link
                  href={`/manga/${id}/read/${chapters[0].id}`}
                  className="btn-primary"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                  </svg>
                  Lire chapitre 1
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Liste des chapitres */}
        <div className="mt-10">
          <h2 className="text-xl font-black mb-4 gradient-text">Chapitres ({chapters.length})</h2>

          {chapters.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun chapitre disponible en français pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {chapters.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/manga/${id}/read/${ch.id}`}
                  className="btn-episode group"
                >
                  <span className="text-red-500 font-bold text-sm w-12 flex-shrink-0">
                    Ch.{ch.chapter}
                  </span>
                  <span className="text-gray-200 text-sm line-clamp-1 group-hover:text-white transition-colors flex-1">
                    {ch.title || `Chapitre ${ch.chapter}`}
                  </span>
                  {ch.pages > 0 && (
                    <span className="text-gray-600 text-xs flex-shrink-0">{ch.pages}p</span>
                  )}
                  <svg
                    className="w-4 h-4 text-gray-600 group-hover:text-red-500 ml-1 flex-shrink-0 transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
