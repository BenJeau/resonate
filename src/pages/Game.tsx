import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getValidAccessToken } from "../lib/spotifyAuth";

function normalizeTitle(input: string): string {
  return input
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      }
      prev = temp;
    }
  }
  return dp[n];
}

function similarity(aRaw: string, bRaw: string): number {
  const a = normalizeTitle(aRaw);
  const b = normalizeTitle(bRaw);
  if (!a.length && !b.length) return 1;
  const dist = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length) || 1;
  return 1 - dist / maxLen;
}

type GameArtist = { id: string; name: string };
type GameImage = { url: string };

type GameAlbum = { images: GameImage[] };

type GameTrack = {
  id: string;
  name: string;
  preview_url: string | null;
  artists: GameArtist[];
  album: GameAlbum;
};

type GameItem = {
  track: GameTrack;
};

export default function Game() {
  const [tracks, setTracks] = useState<GameTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [guess, setGuess] = useState<string>("");
  const [triesLeft, setTriesLeft] = useState<number>(3);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [result, setResult] = useState<"idle" | "correct" | "wrong">("idle");
  const [round, setRound] = useState<number>(1);
  const [totalRounds, setTotalRounds] = useState<number>(10);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const currentTrack = tracks[currentIndex] ?? null;
  const canPlay = !!currentTrack?.preview_url;
  const SNIPPET_MS = 7000;

  useEffect(() => {
    void (async () => {
      try {
        const token = await getValidAccessToken();
        if (!token) {
          setLoading(false);
          setError("Please log in to play.");
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const mode = params.get("mode") ?? "top";
        const playlistId = params.get("playlistId");
        const numTracksParam = Number(params.get("numTracks") ?? 10);
        const allowedCounts = [3, 10, 20];
        const rounds = allowedCounts.includes(numTracksParam)
          ? numTracksParam
          : 10;
        setTotalRounds(rounds);

        let url: string;
        if (mode === "playlist") {
          if (!playlistId) {
            throw new Error("No playlist selected. Go back and choose one.");
          }
          url = `https://api.spotify.com/v1/playlists/${encodeURIComponent(
            playlistId
          )}/tracks?limit=100`;
        } else {
          url = "https://api.spotify.com/v1/me/top/tracks?limit=50";
        }

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load tracks");

        let fetchedTracks: GameTrack[] = [];
        if (url.includes("/playlists/")) {
          const data = (await res.json()) as { items: GameItem[] };
          fetchedTracks = data.items
            .map((t) => t.track)
            .filter((t) => Boolean(t?.preview_url)) as GameTrack[];
        } else {
          const data = (await res.json()) as { items: GameTrack[] };
          fetchedTracks = data.items.filter((t) => Boolean(t.preview_url));
        }

        if (fetchedTracks.length === 0) {
          throw new Error(
            "No previewable tracks found in the selected source."
          );
        }

        const pool = [...fetchedTracks];
        const chosen: GameTrack[] = [];
        while (pool.length > 0 && chosen.length < rounds) {
          const idx = Math.floor(Math.random() * pool.length);
          const [track] = pool.splice(idx, 1);
          if (track) chosen.push(track);
        }
        setTracks(chosen);
        setCurrentIndex(0);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function playSnippet() {
    if (!currentTrack?.preview_url) return;
    stopAudio();
    const audio = new Audio(currentTrack.preview_url);
    audioRef.current = audio;
    void audio.play().catch(() => {});
    timeoutRef.current = window.setTimeout(() => {
      audio.pause();
    }, SNIPPET_MS);
  }

  function nextRound() {
    stopAudio();
    setGuess("");
    setTriesLeft(3);
    setRevealed(false);
    setResult("idle");
    setRound((r) => r + 1);
    setCurrentIndex((i) => Math.min(i + 1, tracks.length - 1));
  }

  function handleGuessSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentTrack) return;
    const sim = similarity(guess, currentTrack.name);
    if (sim >= 0.7) {
      setResult("correct");
      setRevealed(true);
      stopAudio();
      setCorrectCount((c) => c + 1);
    } else {
      const remaining = triesLeft - 1;
      setTriesLeft(remaining);
      setResult("wrong");
      if (remaining <= 0) {
        setRevealed(true);
        stopAudio();
        setWrongCount((w) => w + 1);
      }
    }
  }

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
            Guess the song from the snippet — Round{" "}
            {Math.min(round, totalRounds)} / {totalRounds}
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/select"
              className="text-xs text-white/60 hover:text-white/80"
            >
              Change source
            </Link>
            <Link
              to="/history"
              className="text-xs text-white/60 hover:text-white/80"
            >
              History
            </Link>
            <Link to="/" className="text-xs text-white/60 hover:text-white/80">
              Home
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="mb-3 text-sm text-white/70">Your snippet</div>
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-800/20">
              {currentTrack?.album?.images?.[0]?.url && revealed ? (
                <img
                  src={currentTrack.album.images[0].url}
                  alt="Album art"
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-white/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={playSnippet}
                  disabled={!canPlay || loading}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-black disabled:cursor-not-allowed disabled:bg-white/10"
                >
                  Play snippet
                </button>
                <button
                  onClick={stopAudio}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white/80"
                >
                  Stop
                </button>
              </div>
              <div>Tries left: {triesLeft}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="mb-3 text-sm text-white/70">Make your guess</div>
            <form onSubmit={handleGuessSubmit} className="space-y-3">
              <input
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Type the song title"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none placeholder:text-white/40"
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!guess.trim() || revealed}
                  className="rounded-full bg-emerald-500 px-5 py-2 text-black disabled:cursor-not-allowed disabled:bg-white/10"
                >
                  Guess
                </button>
                <button
                  type="button"
                  onClick={nextRound}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80"
                >
                  Next
                </button>
              </div>
            </form>
            <div className="mt-4 min-h-6 text-sm">
              {result === "correct" && (
                <span className="text-emerald-400">Correct! Nice ears.</span>
              )}
              {result === "wrong" && !revealed && (
                <span className="text-amber-300">Not quite. Try again.</span>
              )}
            </div>
            {revealed && currentTrack ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <div className="text-white/80">It was:</div>
                <div className="text-white">“{currentTrack.name}”</div>
                <div className="text-white/60">
                  {currentTrack.artists.map((a) => a.name).join(", ")}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {loading && (
          <div className="mt-6 text-sm text-white/60">Loading your tracks…</div>
        )}
        {error && !loading && (
          <div className="mt-6 text-sm text-red-400">{error}</div>
        )}
        {!loading && !error && round > totalRounds && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="text-lg font-semibold text-white">Recap</div>
            <div className="mt-2 text-sm text-white/80">
              Correct:{" "}
              <span className="text-emerald-400 font-medium">
                {correctCount}
              </span>
            </div>
            <div className="text-sm text-white/80">
              Wrong:{" "}
              <span className="text-red-400 font-medium">{wrongCount}</span>
            </div>
            <div className="mt-4 flex gap-3">
              <Link
                to="/select"
                className="rounded-full bg-emerald-500 px-4 py-2 text-black"
                onClick={() => {
                  try {
                    const STORAGE_KEY = "resonate_history_v1";
                    const raw = localStorage.getItem(STORAGE_KEY);
                    const list = raw ? (JSON.parse(raw) as any[]) : [];
                    const params = new URLSearchParams(window.location.search);
                    const mode = (params.get("mode") ?? "top") as
                      | "top"
                      | "playlist";
                    const playlistId = params.get("playlistId") ?? undefined;
                    const entry = {
                      id: crypto.randomUUID(),
                      finishedAtIso: new Date().toISOString(),
                      mode,
                      playlistId,
                      totalRounds,
                      correct: correctCount,
                      wrong: wrongCount,
                    };
                    localStorage.setItem(
                      STORAGE_KEY,
                      JSON.stringify([entry, ...list].slice(0, 200))
                    );
                  } catch {
                    // ignore
                  }
                }}
              >
                Play again
              </Link>
              <button
                type="button"
                onClick={() => {
                  setRound(1);
                  setCorrectCount(0);
                  setWrongCount(0);
                  setCurrentIndex(0);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80"
              >
                Replay
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
