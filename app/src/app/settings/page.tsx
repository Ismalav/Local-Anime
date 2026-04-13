"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SushiScanSettings {
  cfClearance: string;
  userAgent: string;
  configured: boolean;
}

interface ConnectionStatus {
  ok: boolean;
  status: "idle" | "missing-cookie" | "connected" | "cloudflare-blocked" | "error";
  message: string;
}

export default function SettingsPage() {
  const [cfClearance, setCfClearance] = useState("");
  const [userAgent, setUserAgent] = useState("");
  const [configured, setConfigured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState<ConnectionStatus>({
    ok: false,
    status: "idle",
    message: "",
  });

  function refreshConnectionStatus() {
    fetch("/api/settings/test")
      .then((r) => r.json())
      .then((data: ConnectionStatus) => setConnection(data))
      .catch(() => {
        setConnection({
          ok: false,
          status: "error",
          message: "Impossible de vérifier la connexion SushiScan.",
        });
      });
  }

  useEffect(() => {
    // Auto-fill user agent from current browser
    setUserAgent(navigator.userAgent);

    // Load current settings
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: { sushiscan: SushiScanSettings }) => {
        setConfigured(data.sushiscan.configured);
        if (data.sushiscan.cfClearance) setCfClearance(data.sushiscan.cfClearance);
        if (data.sushiscan.userAgent) setUserAgent(data.sushiscan.userAgent);
        refreshConnectionStatus();
      })
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cfClearance: cfClearance.trim(), userAgent: userAgent.trim() }),
      });
      if (!res.ok) throw new Error();
      setConfigured(Boolean(cfClearance.trim()));
      refreshConnectionStatus();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen px-4 pb-16 sm:px-6 lg:px-8"
      style={{ paddingTop: "120px" }}
    >
      <div className="mx-auto w-full max-w-[1100px]">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black gradient-text">Réglages</h1>
        {configured ? (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            SushiScan configuré
          </span>
        ) : (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            SushiScan non configuré
          </span>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-10">
        Source manga : SushiScan (français)
      </p>

      {connection.status !== "idle" && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            connection.ok
              ? "border-green-500/30 bg-green-500/10 text-green-300"
              : connection.status === "cloudflare-blocked"
              ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
              : "border-white/10 bg-white/[0.05] text-gray-300"
          }`}
        >
          {connection.message}
        </div>
      )}

      {/* Instructions */}
      <div className="surface-card p-6 mb-8">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span className="text-[#9a82ff]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          Comment obtenir le cookie Cloudflare
        </h2>
        <ol className="space-y-4 text-sm text-gray-300">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#9a82ff]/20 text-[#9a82ff] flex items-center justify-center text-xs font-bold">1</span>
            <span>
              Ouvre{" "}
              <a
                href="https://sushiscan.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9a82ff] hover:underline"
              >
                sushiscan.net
              </a>{" "}
              dans ce même navigateur et valide le challenge Cloudflare si demandé.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#9a82ff]/20 text-[#9a82ff] flex items-center justify-center text-xs font-bold">2</span>
            <span>
              Appuie sur <kbd className="bg-white/10 text-white px-1.5 py-0.5 rounded text-xs font-mono">F12</kbd> pour ouvrir les DevTools, puis va dans{" "}
              <strong className="text-white">Application → Cookies → sushiscan.net</strong>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#9a82ff]/20 text-[#9a82ff] flex items-center justify-center text-xs font-bold">3</span>
            <span>
              Trouve le cookie <code className="bg-white/10 text-[#9a82ff] px-1.5 py-0.5 rounded text-xs font-mono">cf_clearance</code> et copie sa valeur dans le champ ci-dessous.
            </span>
          </li>
        </ol>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Valeur du cookie{" "}
            <code className="bg-white/10 text-[#9a82ff] px-1.5 py-0.5 rounded text-xs font-mono">
              cf_clearance
            </code>
          </label>
          <input
            type="text"
            value={cfClearance}
            onChange={(e) => setCfClearance(e.target.value)}
            placeholder="Colle ici la valeur du cookie..."
            className="w-full rounded-lg px-4 py-3 outline-none text-white text-sm transition-colors placeholder:text-gray-500 font-mono"
            style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)"}}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            User-Agent du navigateur
            <span className="ml-2 text-xs text-gray-500">(rempli automatiquement)</span>
          </label>
          <textarea
            value={userAgent}
            onChange={(e) => setUserAgent(e.target.value)}
            rows={2}
            className="w-full text-xs rounded-lg px-4 py-3 outline-none transition-colors font-mono resize-none text-gray-400"
            style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)"}}
          />
          <p className="text-xs text-gray-500 mt-1">
            Doit correspondre exactement au navigateur dans lequel tu as validé le challenge.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
          {saved && (
            <span className="text-green-400 text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Sauvegardé
            </span>
          )}
          {error && <span className="text-red-400 text-sm">{error}</span>}
        </div>
      </form>

      {/* After save tip */}
      {configured && connection.status === "connected" && (
        <div className="mt-8 p-4 rounded-lg bg-white/[0.04] border border-green-500/20 text-sm text-gray-300">
          Connexion SushiScan validée. Tu peux maintenant{" "}
          <Link href="/manga" className="text-[#9a82ff] hover:underline">
            parcourir les mangas
          </Link>
          .
        </div>
      )}

      {configured && connection.status === "cloudflare-blocked" && (
        <div className="mt-8 p-4 rounded-lg bg-white/[0.04] border border-yellow-500/20 text-sm text-gray-300">
          Le cookie est bien enregistré, mais SushiScan refuse encore les requêtes faites depuis le serveur du site. Sur une app native avec WebView ce contournement peut marcher, mais sur cette version web ce n&apos;est pas fiable.
        </div>
      )}
      </div>
    </div>
  );
}
