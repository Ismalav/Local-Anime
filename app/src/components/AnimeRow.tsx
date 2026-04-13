"use client";

import AnimeCard, { AnimeCardProps } from "./AnimeCard";
import Link from "next/link";

interface AnimeRowProps {
  title: string;
  items: AnimeCardProps[];
  href?: string;
}

export default function AnimeRow({ title, items, href }: AnimeRowProps) {
  if (!items.length) return null;
  const unique = items.filter(
    (anime, index, self) => self.findIndex((a) => String(a.id) === String(anime.id)) === index
  );
  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-5 px-1">
        <h2 className="section-title">{title}</h2>
        {href && (
          <Link href={href} className="text-xs text-gray-500 hover:text-[#9a82ff] transition-colors font-semibold tracking-wide uppercase">
            Voir tout →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-6">
        {unique.map((anime) => (
          <AnimeCard key={anime.id} {...anime} />
        ))}
      </div>
    </section>
  );
}
