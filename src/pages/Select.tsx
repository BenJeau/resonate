import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getValidAccessToken } from "../lib/spotifyAuth";
import defaultPlaylists from "./default-playlists-response.json";

type GameImage = { url: string };

type PlaylistLite = { id: string; name: string; images?: GameImage[] };

export default function Select() {
  const [playlists, setPlaylists] = useState<PlaylistLite[]>([]);
  const [numTracks, setNumTracks] = useState<3 | 10 | 20>(10);
  const [popularPlaylists, setPopularPlaylists] = useState<PlaylistLite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const token = await getValidAccessToken();
        if (!token) {
          setLoading(false);
          setError("Please log in to choose a playlist.");
          return;
        }
        const [myPlRes, topListsRes] = await Promise.all([
          fetch("https://api.spotify.com/v1/me/playlists?limit=30", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(
            "https://api.spotify.com/v1/browse/featured-playlists?limit=30",
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ]);
        if (!myPlRes.ok) throw new Error("Failed to load your playlists");
        let topListsData: { playlists: { items: PlaylistLite[] } };
        if (!topListsRes.ok) {
          topListsData = defaultPlaylists;
        } else {
          topListsData = await topListsRes.json();
        }
        const myData = (await myPlRes.json()) as { items: PlaylistLite[] };
        setPlaylists(myData.items ?? []);
        setPopularPlaylists(topListsData.playlists?.items ?? []);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <div className="pointer-events-none absolute inset-x-0 -top-24 z-0 h-64 bg-gradient-to-b from-emerald-500/25 via-emerald-400/10 to-transparent blur-2xl"></div>
      <div className="bg-animated z-0">
        <div className="blob"></div>
        <div className="blob"></div>
        <div className="blob"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10 flex flex-col gap-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
            Choose your source
          </div>
          <div className="flex items-center gap-3">
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

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="mb-3 text-sm text-white/70">Quick start</div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/game"
              search={{ mode: "top", numTracks }}
              className="rounded-full bg-emerald-500 px-5 py-2 text-black transition hover:bg-emerald-400"
            >
              Play from your Top Tracks
            </Link>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-xs text-white/60">Difficulty</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNumTracks(3)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  numTracks === 3
                    ? "border-emerald-500 bg-emerald-500 text-black"
                    : "border-white/10 bg-white/5 text-white/80"
                }`}
              >
                Easy (3)
              </button>
              <button
                type="button"
                onClick={() => setNumTracks(10)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  numTracks === 10
                    ? "border-emerald-500 bg-emerald-500 text-black"
                    : "border-white/10 bg-white/5 text-white/80"
                }`}
              >
                Medium (10)
              </button>
              <button
                type="button"
                onClick={() => setNumTracks(20)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  numTracks === 20
                    ? "border-emerald-500 bg-emerald-500 text-black"
                    : "border-white/10 bg-white/5 text-white/80"
                }`}
              >
                Hard (20)
              </button>
            </div>
          </div>
          <div className="mt-4 text-xs text-white/60">
            Or pick a specific playlist below.
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="mb-3 text-sm text-white/70">Your playlists</div>
            {loading ? (
              <div className="text-sm text-white/60">
                Loading your playlists…
              </div>
            ) : error ? (
              <div className="text-sm text-red-400">{error}</div>
            ) : playlists.length === 0 ? (
              <div className="text-sm text-white/60">No playlists found.</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {playlists.map((p) => (
                  <Link
                    key={p.id}
                    to="/game"
                    search={{ mode: "playlist", playlistId: p.id, numTracks }}
                    className="group block overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
                  >
                    <div className="aspect-square overflow-hidden">
                      {p.images?.[0]?.url ? (
                        <img
                          src={p.images[0].url}
                          alt={p.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-white/5" />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="truncate text-sm font-medium">
                        {p.name}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="mb-3 text-sm text-white/70">Popular playlists</div>
            {loading ? (
              <div className="text-sm text-white/60">
                Loading popular playlists…
              </div>
            ) : error ? (
              <div className="text-sm text-red-400">{error}</div>
            ) : popularPlaylists.length === 0 ? (
              <div className="text-sm text-white/60">
                No popular playlists found.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {popularPlaylists.map((p) => (
                  <Link
                    key={p.id}
                    to="/game"
                    search={{ mode: "playlist", playlistId: p.id, numTracks }}
                    className="group block overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
                  >
                    <div className="aspect-square overflow-hidden">
                      {p.images?.[0]?.url ? (
                        <img
                          src={p.images[0].url}
                          alt={p.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-white/5" />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="truncate text-sm font-medium">
                        {p.name}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
