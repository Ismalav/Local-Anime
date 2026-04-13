"use client";

import Image from "next/image";
import Link from "next/link";

export interface AnimeCardProps {
  id: string | number;
  title: string;
  image: string;
  score?: number;
  episodes?: number;
  year?: number;
}

export default function AnimeCard({ id, title, image, score, episodes, year }: AnimeCardProps) {
  return (
    <Link href={`/anime/${id}`} className="group block cursor-pointer rounded-xl p-1 transition-transform duration-300 hover:-translate-y-1" style={{background:"linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))"}}>
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl mb-2.5" style={{boxShadow:"0 12px 26px rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.06)"}}>
        <Image
          src={image || "/placeholder.jpg"}
          alt={title}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-[1.07]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/8 to-transparent" />
        {/* Score badge */}
        {score && (
          <div className="absolute top-2 right-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg" style={{background:"linear-gradient(135deg,#ff3d71,#7b61ff)",letterSpacing:"0.01em"}}>
            ★ {score.toFixed(1)}
          </div>
        )}
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/92 flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-250">
            <svg className="w-5 h-5 ml-0.5" fill="#0d0d1a" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
      {/* Metadata — always visible */}
      <p className="text-white text-[0.95rem] font-semibold line-clamp-2 leading-snug tracking-[-0.01em] group-hover:text-white/95 transition-colors">{title}</p>
      {(episodes || year) && (
        <p className="text-gray-500 text-xs mt-0.5 font-medium">
          {[episodes && `${episodes} ép.`, year].filter(Boolean).join(" · ")}
        </p>
      )}
    </Link>
  );
}
