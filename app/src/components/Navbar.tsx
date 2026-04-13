"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "/home";
  const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/search", label: "Explorer" },
    { href: "/manga", label: "Manga" },
    { href: "/favorites", label: "Mes animés" },
    { href: "/history", label: "Continuer" },
    { href: "/settings", label: "Réglages" },
  ];

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowSearch(false);
  }, [pathname]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setShowSearch(false);
      setMobileMenuOpen(false);
    }
  }

  const navBg = isScrolled
    ? "backdrop-blur-xl"
    : isHome
    ? "bg-transparent"
    : "bg-[#080810]/98";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-4 sm:px-6 lg:px-8 transition-all duration-300 ${navBg}`}
      style={{ borderBottom: isScrolled ? "1px solid rgba(255,255,255,0.07)" : "none", background: isScrolled ? "rgba(8,8,16,0.96)" : undefined }}
    >
      <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 lg:gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 select-none group">
          <div className="relative h-10 w-10 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
            <div className="absolute inset-0 rounded-2xl shadow-[0_10px_30px_rgba(123,97,255,0.35)]" style={{background:"linear-gradient(135deg,#ff3d71,#7b61ff)"}} />
            <div className="absolute inset-[2px] rounded-[14px] bg-[#0c0e20]" />
            <div className="absolute left-[9px] top-[8px] h-6 w-[4px] rounded-full" style={{background:"linear-gradient(180deg,#ff3d71,#7b61ff)"}} />
            <div className="absolute left-[16px] top-[8px] h-6 w-[2px] rounded-full bg-white/70" />
            <svg viewBox="0 0 24 24" className="absolute right-[5px] top-[8px] h-6 w-6" fill="#7b61ff" style={{filter:"drop-shadow(0 0 6px #7b61ff)"}}>
              <path d="M8.5 6.5v11l8.5-5.5-8.5-5.5z" />
            </svg>
          </div>
          <span className="leading-none">
            <span className="block text-[1.4rem] font-black tracking-[-0.05em] text-white">
              Open<span style={{ background:"linear-gradient(135deg,#ff3d71,#7b61ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Anime</span>
            </span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-5 lg:gap-7 text-sm text-gray-300">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`relative py-1 font-semibold transition-colors ${
                pathname === href ? "text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {label}
              {pathname === href && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full" style={{background:"linear-gradient(90deg,#ff3d71,#7b61ff)"}} />
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 sm:gap-4">
        {showSearch ? (
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Titre, genre..."
              className="text-white text-sm px-4 py-2.5 rounded-full w-[min(72vw,22rem)] sm:w-80 outline-none transition-colors placeholder:text-gray-500 font-bold" style={{background:"rgba(10,15,35,0.8)",border:"2px solid rgba(123,97,255,0.25)"}} onFocus={e=>(e.currentTarget.style.borderColor="#7b61ff")} onBlur={e=>{ e.currentTarget.style.borderColor="rgba(123,97,255,0.25)"; if (!query) setShowSearch(false); }}
            />
          </form>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="text-gray-400 hover:text-[#9a82ff] transition-colors"
            aria-label="Rechercher"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}

        <button
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="md:hidden text-gray-400 hover:text-[#9a82ff] transition-colors"
          aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      </div>

      {mobileMenuOpen && (
        <div className="mt-4 rounded-2xl p-3 shadow-2xl md:hidden" style={{background:"rgba(10,13,30,0.97)",border:"1px solid rgba(123,97,255,0.2)",backdropFilter:"blur(16px)"}}>
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-xl px-3 py-3 text-sm font-extrabold transition-all duration-200 ${
                  pathname === href
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`} style={pathname === href ? {background:"linear-gradient(135deg,#ff3d71,#7b61ff)"} : {background:"rgba(123,97,255,0.10)"}}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
