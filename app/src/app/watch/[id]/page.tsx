"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import { addToHistory } from "@/lib/storage";
import Link from "next/link";

type Lang = "vost-en" | "vostfr" | "vf";
const LANG_LABELS: Record<Lang, string> = {
  "vost-en": "VOST-EN",
  vostfr: "VOSTFR",
  vf: "VF",
};

function WatchContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const ep = searchParams.get("ep") ?? "1";
  const title = searchParams.get("title") ?? "";
  const quality = searchParams.get("quality") ?? "best";

  const [streamUrl, setStreamUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQuality, setSelectedQuality] = useState(quality);
  const [lang, setLang] = useState<Lang>("vost-en");

  useEffect(() => {
    if (!title) {
      setError("Titre de l'animé manquant.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setStreamUrl("");

    const fetchPromise =
      lang === "vost-en"
        ? fetch(
            `/api/stream?title=${encodeURIComponent(title)}&episode=${ep}&quality=${selectedQuality}`
          )
        : fetch(
            `/api/animesama/stream?title=${encodeURIComponent(title)}&ep=${ep}&lang=${lang}`
          );

    fetchPromise
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          setStreamUrl(data.url);
          addToHistory({
            animeId: id,
            animeTitle: title,
            animeImage: "",
            episode: Number(ep),
            timestamp: Date.now(),
          });
        } else {
          setError(data.error || "URL de stream introuvable.");
        }
      })
      .catch(() => setError("Erreur réseau."))
      .finally(() => setLoading(false));
  }, [id, ep, title, selectedQuality, lang]);

  return (
    <div
      className="min-h-screen w-full px-4 pb-14 sm:px-6 lg:px-8"
      style={{ background: "#080810", paddingTop: "118px" }}
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Fil d'Ariane */}
        <div className="mb-5 flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href={`/anime/${id}`}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← {title || "Retour"}
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white text-sm">Épisode {ep}</span>
        </div>

        {/* Sélecteur de langue + qualité */}
        <div className="mb-6 rounded-2xl p-4" style={{background:"rgba(14,18,40,0.82)",border:"1px solid rgba(123,97,255,0.22)",backdropFilter:"blur(14px)"}}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Choix de langue
          </p>
          <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
            {(["vost-en", "vostfr", "vf"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-xl px-3 py-3 text-sm font-bold transition-all duration-200 sm:text-base ${
                  lang === l
                    ? "text-white shadow-[0_0_24px_rgba(123,97,255,0.45)]" 
                    : "bg-[#1a1a33] text-gray-300 hover:bg-[#252545]"
                }`}
                style={lang === l ? {background:"linear-gradient(135deg,#ff3d71,#7b61ff)"} : undefined}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>

          {lang === "vost-en" && (
            <>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Qualité vidéo
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {["best", "1080", "720", "480", "360"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuality(q)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      selectedQuality === q
                        ? "text-white shadow-[0_0_20px_rgba(123,97,255,0.4)]"
                        : "bg-[#1a1a33] text-gray-300 hover:bg-[#252545]"
                    }`}
                    style={selectedQuality === q ? {background:"linear-gradient(135deg,#ff3d71,#7b61ff)"} : undefined}
                  >
                    {q === "best" ? "Auto" : `${q}p`}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "#7b61ff", borderTopColor: "transparent" }}
            />
            <p className="text-gray-400 text-sm">
              {lang === "vost-en"
                ? "Recherche du stream AllAnime..."
                : `Chargement depuis anime-sama.to (${LANG_LABELS[lang]})...`}
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="surface-card p-6 text-center">
            <p className="font-black mb-2 gradient-text">
              Stream introuvable
            </p>
            <p className="text-gray-400 text-sm mb-3">{error}</p>
            {lang !== "vost-en" && (
              <p className="text-gray-500 text-xs">
                Essaie avec{" "}
                <button
                  onClick={() => setLang("vost-en")}
                  className="underline text-gray-300 hover:text-white"
                >
                  VOST-EN
                </button>{" "}
                (AllAnime) ou vérifie que le titre correspond à anime-sama.to.
              </p>
            )}
          </div>
        )}

        {streamUrl && !loading && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <VideoPlayer src={streamUrl} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense>
      <WatchContent />
    </Suspense>
  );
}
