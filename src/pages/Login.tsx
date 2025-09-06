import { useEffect } from "react";
import { handleSpotifyRedirectCallback } from "../lib/spotifyAuth";

export default function Login() {
  useEffect(() => {
    void (async () => {
      await handleSpotifyRedirectCallback();
      window.location.replace("/");
    })();
  }, []);
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-white/80">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 backdrop-blur">
        <div className="text-lg font-semibold">Signing you in…</div>
        <div className="mt-2 text-sm">Processing Spotify response.</div>
      </div>
    </div>
  );
}
