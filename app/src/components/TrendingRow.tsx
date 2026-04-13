"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimeCardProps } from "./AnimeCard";
import { useRef, useState } from "react";

interface Props {
  items: AnimeCardProps[];
}

export default function TrendingRow({ items }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
  }

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  return (
    <div className="mt-12 mb-14">
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="section-title">Tendances</h2>
      </div>

      {/* Scrollable row with edge fade + floating arrows */}
      <div className="relative">
        {/* Left fade + arrow */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{background:"linear-gradient(to right, #080810 0%, transparent 100%)"}} />
        {canLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all max-[640px]:hidden"
            style={{background:"rgba(14,16,30,0.92)",border:"1px solid rgba(255,255,255,0.12)",boxShadow:"0 2px 12px rgba(0,0,0,0.5)"}}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Right fade + arrow */}
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{background:"linear-gradient(to left, #080810 0%, transparent 100%)"}} />
        {canRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all max-[640px]:hidden"
            style={{background:"rgba(14,16,30,0.92)",border:"1px solid rgba(255,255,255,0.12)",boxShadow:"0 2px 12px rgba(0,0,0,0.5)"}}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item, idx) => (
            <Link
              key={`${item.id}-${idx}`}
              href={`/anime/${item.id}`}
              className="group flex-shrink-0 relative"
              style={{ width: "clamp(120px,12vw,160px)" }}
            >
              {/* Ranking number — large outline behind poster */}
              <div className="relative" style={{ paddingLeft: "clamp(24px,2vw,32px)" }}>
                {/* Number */}
                <span
                  className="absolute left-0 bottom-0 select-none font-black leading-none"
                  style={{
                    fontSize: "clamp(2.8rem,5vw,4rem)",
                    color: "transparent",
                    WebkitTextStroke: "2px rgba(255,255,255,0.18)",
                    lineHeight: 1,
                    zIndex: 0,
                  }}
                >
                  {idx + 1}
                </span>
                {/* Poster */}
                <div className="relative overflow-hidden rounded-lg" style={{ paddingBottom: "148%", zIndex: 1, border:"1px solid rgba(255,255,255,0.08)", boxShadow:"0 10px 26px rgba(0,0,0,0.34)" }}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-400 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/26 transition-colors duration-200" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-250" style={{boxShadow:"inset 0 0 0 1px rgba(123,97,255,0.35)"}} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
