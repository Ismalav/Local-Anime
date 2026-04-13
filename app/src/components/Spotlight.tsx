"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export interface SpotlightItem {
  id: number;
  title: string;
  image: string;
  synopsis?: string;
  score?: number;
  episodes?: number;
  type?: string;
  year?: number;
}

interface Props {
  items: SpotlightItem[];
}

export default function Spotlight({ items }: Props) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number) => setCurrent((idx + items.length) % items.length);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items.length]);

  if (!items.length) return null;
  const item = items[current];

  return (
    <div className="relative overflow-hidden rounded-b-3xl" style={{height:"clamp(460px,58vw,700px)"}}>
      {/* Full-frame background image */}
      <Image
        key={item.id}
        src={item.image}
        alt={item.title}
        fill
        unoptimized
        priority
        className="object-cover object-center"
        style={{transform:"scale(1.03)"}}
      />

      {/* Cinematic overlays */}
      <div className="absolute inset-0" style={{background:"linear-gradient(to right, rgba(8,8,16,0.97) 0%, rgba(8,8,16,0.77) 36%, rgba(8,8,16,0.24) 63%, rgba(8,8,16,0.05) 100%)"}} />
      <div className="absolute inset-x-0 bottom-0 h-56" style={{background:"linear-gradient(to top, #080810 0%, transparent 100%)"}} />
      <div className="absolute inset-x-0 top-0 h-28" style={{background:"linear-gradient(to bottom, rgba(8,8,16,0.55) 0%, transparent 100%)"}} />

      {/* Content panel */}
      <div className="absolute inset-y-0 left-0 flex flex-col justify-end pb-16 px-8 sm:px-12 lg:px-16 z-10 w-full max-w-[700px]">
        {/* Tags */}
        <div className="flex items-center flex-wrap gap-2 mb-4">
          {item.type && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{background:"rgba(255,61,113,0.18)",border:"1px solid rgba(255,61,113,0.35)",color:"#ff7090"}}>
              {item.type}
            </span>
          )}
          {item.year && <span className="text-xs font-semibold text-gray-400">{item.year}</span>}
          {item.score && (
            <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{background:"linear-gradient(135deg,#ff3d71,#7b61ff)"}}>
              ★ {item.score.toFixed(1)}
            </span>
          )}
          {item.episodes && <span className="text-xs font-semibold text-gray-400">{item.episodes} épisodes</span>}
        </div>

        {/* Title */}
        <h1 className="text-white font-black leading-[0.95] mb-4" style={{fontSize:"clamp(2rem,4.8vw,3.5rem)",letterSpacing:"-0.035em",textShadow:"0 2px 24px rgba(0,0,0,0.62)"}}>
          {item.title}
        </h1>

        {/* Synopsis */}
        {item.synopsis && (
          <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 mb-8 max-w-xl max-md:hidden">
            {item.synopsis}
          </p>
        )}

        {/* CTA */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <Link
            href={`/watch/${item.id}?ep=1&title=${encodeURIComponent(item.title)}`}
            className="flex items-center gap-2.5 font-bold px-7 py-3 rounded-xl text-sm text-white transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
            style={{background:"linear-gradient(135deg,#ff3d71,#c02060)",boxShadow:"0 4px 16px rgba(255,61,113,0.35)"}}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Regarder
          </Link>
          <Link
            href={`/anime/${item.id}`}
            className="flex items-center gap-2 font-semibold px-6 py-3 rounded-xl text-sm text-white transition-all duration-200 hover:bg-white/15"
            style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.18)",backdropFilter:"blur(8px)"}}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Détails
          </Link>
        </div>
      </div>

      {/* Dot navigation */}
      <div className="absolute bottom-6 right-8 flex gap-1.5 z-10">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="rounded-full transition-all duration-300"
            style={i === current
              ? {width:"20px",height:"4px",background:"linear-gradient(90deg,#ff3d71,#7b61ff)"}
              : {width:"4px",height:"4px",background:"rgba(255,255,255,0.3)"}
            }
          />
        ))}
      </div>

      {/* Prev / Next */}
      <button
        onClick={() => goTo(current - 1)}
        className="absolute right-20 bottom-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all max-[575px]:hidden hover:bg-white/15"
        style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)"}}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <button
        onClick={() => goTo(current + 1)}
        className="absolute right-8 bottom-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all max-[575px]:hidden hover:bg-white/15"
        style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)"}}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );
}
