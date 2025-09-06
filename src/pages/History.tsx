import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

export type HistoryEntry = {
  id: string;
  finishedAtIso: string;
  mode: "top" | "playlist";
  playlistId?: string;
  totalRounds: number;
  correct: number;
  wrong: number;
};

const STORAGE_KEY = "resonate_history_v1";

function readHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: HistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export default function History() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(readHistory());
  }, []);

  const sorted = useMemo(
    () =>
      [...entries].sort((a, b) => (a.finishedAtIso < b.finishedAtIso ? 1 : -1)),
    [entries]
  );

  const handleClear = () => {
    writeHistory([]);
    setEntries([]);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <div className="pointer-events-none absolute inset-x-0 -top-24 z-0 h-64 bg-gradient-to-b from-emerald-500/25 via-emerald-400/10 to-transparent blur-2xl"></div>
      <div className="bg-animated z-0">
        <div className="blob"></div>
        <div className="blob"></div>
        <div className="blob"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
            Game History
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-white/60 hover:text-white/80">
              Home
            </Link>
            <Link
              to="/select"
              className="text-xs text-white/60 hover:text-white/80"
            >
              Choose source
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-white/70">Your sessions</div>
            {sorted.length > 0 ? (
              <button
                onClick={handleClear}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
              >
                Clear history
              </button>
            ) : null}
          </div>

          {sorted.length === 0 ? (
            <div className="text-sm text-white/60">
              No sessions yet. Play a game to see it here.
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {sorted.map((e) => {
                const dt = new Date(e.finishedAtIso);
                const label =
                  e.mode === "top"
                    ? "Top Tracks"
                    : `Playlist ${e.playlistId ?? "?"}`;
                return (
                  <li
                    key={e.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {label}
                      </div>
                      <div className="text-xs text-white/60 truncate">
                        {dt.toLocaleString()} • Rounds: {e.totalRounds}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-emerald-300">✔ {e.correct}</span>
                      <span className="text-red-300">✘ {e.wrong}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
