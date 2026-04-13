"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimeCardProps } from "./AnimeCard";

interface Props {
  label: string;
  items: AnimeCardProps[];
}

export default function CartList({ label, items }: Props) {
  if (!items.length) return null;
  return (
    <div className="surface-card flex w-full flex-col gap-3 p-4 sm:p-5">
      <h3 className="section-title text-base mb-1">{label}</h3>
      <div className="flex flex-col gap-3">
        {items.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-3 pb-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Link href={`/anime/${item.id}`} className="flex-shrink-0">
              <Image
                src={item.image}
                alt={item.title}
                width={60}
                height={75}
                unoptimized
                className="rounded-lg object-cover w-[52px] h-[72px] transition-opacity group-hover:opacity-80"
                style={{boxShadow:"0 8px 18px rgba(0,0,0,0.35)"}}
              />
            </Link>
            <div className="flex flex-col gap-1 min-w-0">
              <Link
                href={`/anime/${item.id}`}
                className="text-sm font-semibold line-clamp-2 transition-colors leading-tight text-gray-200 hover:text-white"
              >
                {item.title}
              </Link>
              <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                {item.score && (
                  <span className="font-bold" style={{color:"#ff3d71"}}>★ {item.score.toFixed(1)}</span>
                )}
                {item.episodes && <span>{item.episodes} ép.</span>}
                {item.year && <span>{item.year}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <a href="/search" className="flex items-center gap-1 w-fit text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-[#9a82ff] transition-colors mt-1">
        Voir plus
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
}
