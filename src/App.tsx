import {
  startSpotifyAuth,
  getValidAccessToken,
  clearAuthStorage,
} from "./lib/spotifyAuth";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

type SpotifyImage = {
  url: string;
  width?: number;
  height?: number;
};

type SpotifyUser = {
  id: string;
  display_name: string;
  images: SpotifyImage[];
  followers?: { total: number };
  external_urls?: { spotify?: string };
};

type SpotifyArtist = {
  id: string;
  name: string;
};

type SpotifyAlbum = {
  id: string;
  name: string;
  images: SpotifyImage[];
};

type SpotifyTrack = {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  external_urls?: { spotify?: string };
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function App() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const token = await getValidAccessToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const [meRes, topRes] = await Promise.all([
          fetch("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("https://api.spotify.com/v1/me/top/tracks?limit=12", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!meRes.ok || !topRes.ok) {
          throw new Error("Failed to load Spotify data");
        }

        const me = (await meRes.json()) as SpotifyUser;
        const top = (await topRes.json()) as { items: SpotifyTrack[] };
        setUser(me);
        setTopTracks(top.items);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSpotifyLogin = () => {
    void startSpotifyAuth();
  };

  const handleLogout = () => {
    clearAuthStorage();
    window.location.reload();
  };

  const showHero = !user;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white my-auto flex-1 h-full flex flex-col">
      <div className="pointer-events-none absolute inset-x-0 -top-24 z-0 h-64 bg-gradient-to-b from-emerald-500/25 via-emerald-400/10 to-transparent blur-2xl"></div>
      <div className="bg-animated z-0">
        <div className="blob"></div>
        <div className="blob"></div>
        <div className="blob"></div>
      </div>

      <div className="relative z-10 flex flex-col justify-center flex-1 h-full items-center">
        <div
          className={`flex-1 mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:flex lg:items-start lg:gap-x-10 ${
            showHero ? "" : "flex-col gap-10"
          }`}
        >
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
              Guess the song from a short snippet
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Resonate
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/80">
              Hear a few seconds. Lock in your guess. Climb the leaderboard.
              Play solo or challenge friends with tracks you love.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              {showHero ? (
                <button
                  onClick={handleSpotifyLogin}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-6 py-3 text-black transition hover:brightness-110 active:scale-95"
                >
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5"
                  >
                    <title>Spotify</title>
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  Continue with Spotify
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                >
                  Log out
                </button>
              )}
              {!showHero && user?.display_name ? (
                <div className="text-sm text-white/60">
                  Welcome back,{" "}
                  <span className="text-white">{user.display_name}</span>
                </div>
              ) : null}
              {!showHero && (
                <Link
                  to="/select"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-black font-semibold shadow-lg border-2 border-emerald-500 transition hover:bg-emerald-500 hover:text-white active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12h14M12 5l7 7-7 7"
                    />
                  </svg>
                  Choose Source
                </Link>
              )}
            </div>
          </div>

          <div className="mt-12 grid flex-1 grid-cols-1 gap-6 sm:mt-16 lg:mt-0 lg:grid-cols-2">
            {showHero ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <div className="mb-3 text-sm text-white/70">Your snippet</div>
                  <div className="aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br from-pink-500 to-pink-800"></div>
                  <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                    <span>0:00 / 0:07</span>
                    <span>Try 1 of 3</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <div className="mb-3 text-sm text-white/70">
                    Make your guess
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-white/5 px-3 py-2 text-white/80">
                      "Blinding Lights" — The Weeknd
                    </div>
                    <div className="rounded-lg bg-white/5 px-3 py-2 text-white/80">
                      "Levitating" — Dua Lipa
                    </div>
                    <div className="rounded-lg bg-white/5 px-3 py-2 text-white/80">
                      "Stay" — The Kid LAROI, Justin Bieber
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="mb-4 flex items-center gap-4">
                    <img
                      src={user?.images?.[0]?.url}
                      alt="Profile"
                      className="size-14 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-lg font-semibold">
                        {user?.display_name}
                      </div>
                      <div className="text-xs text-white/60">
                        {user?.followers?.total
                          ? `${user.followers.total.toLocaleString()} followers`
                          : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-white/70">Your top tracks</div>
                  {loading ? (
                    <div className="mt-4 text-sm text-white/60">
                      Loading your music A0…
                    </div>
                  ) : error ? (
                    <div className="mt-4 text-sm text-red-400">{error}</div>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {topTracks.slice(0, 5).map((track) => (
                        <li key={track.id} className="flex items-center gap-3">
                          <img
                            src={track.album.images?.[0]?.url}
                            alt=""
                            className="size-12 rounded-md object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">
                              {track.name}
                            </div>
                            <div className="truncate text-xs text-white/60">
                              {track.artists.map((a) => a.name).join(", ")}
                            </div>
                          </div>
                          <div className="text-xs text-white/50">
                            {formatDuration(track.duration_ms)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="mb-3 text-sm text-white/70">
                    Top picks for you
                  </div>
                  {loading ? (
                    <div className="text-sm text-white/60">Loading A0…</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {topTracks.map((track) => (
                        <a
                          key={track.id}
                          href={track.external_urls?.spotify ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="group block overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
                        >
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={track.album.images?.[0]?.url}
                              alt={track.name}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div className="p-3">
                            <div className="truncate text-sm font-medium">
                              {track.name}
                            </div>
                            <div className="truncate text-xs text-white/60">
                              {track.artists.map((a) => a.name).join(", ")}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <footer className="mx-auto w-full max-w-6xl px-6 pb-16 text-xs text-white/50">
          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <span>© {new Date().getFullYear()} Resonate</span>
            <a href="#" className="hover:text-white/80">
              Privacy
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
