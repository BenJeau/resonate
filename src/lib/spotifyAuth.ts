// Lightweight Spotify OAuth (Authorization Code with PKCE) helper for SPA

const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const PKCE_VERIFIER_KEY = "spotify_pkce_verifier";
const PKCE_STATE_KEY = "spotify_oauth_state";
const ACCESS_TOKEN_KEY = "spotify_access_token";
const REFRESH_TOKEN_KEY = "spotify_refresh_token";
const ACCESS_EXPIRES_AT_MS_KEY = "spotify_access_expires_at_ms";

function generateRandomString(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

async function sha256(input: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  return crypto.subtle.digest("SHA-256", data);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

export async function startSpotifyAuth(): Promise<void> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined;
  const scope = (import.meta.env.VITE_SPOTIFY_SCOPES as string | undefined) ?? [
    "user-read-email",
    "user-read-private",
    "user-top-read",
    "user-read-recently-played",
    "playlist-read-private",
  ].join(" ");

  if (!clientId || !redirectUri) {
    // Fail loudly in dev to surface missing configuration
    // eslint-disable-next-line no-alert
    alert("Missing Spotify OAuth env: VITE_SPOTIFY_CLIENT_ID or VITE_SPOTIFY_REDIRECT_URI");
    return;
  }

  const verifier = generateRandomString(64);
  const challenge = await createCodeChallenge(verifier);
  const state = generateRandomString(24);

  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(PKCE_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope,
    state,
  });

  const authorizeUrl = `${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`;
  window.location.assign(authorizeUrl);
}

export function getStoredPkceVerifier(): string | null {
  return sessionStorage.getItem(PKCE_VERIFIER_KEY);
}

export function getStoredState(): string | null {
  return sessionStorage.getItem(PKCE_STATE_KEY);
}

type TokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number; // seconds
  refresh_token?: string;
  scope?: string;
};

function storeTokens(tokens: TokenResponse): void {
  const now = Date.now();
  const safetyWindowMs = 60_000; // refresh 60s early
  const expiresAtMs = now + tokens.expires_in * 1000 - safetyWindowMs;

  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(ACCESS_EXPIRES_AT_MS_KEY, String(expiresAtMs));
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAccessTokenExpiryMs(): number | null {
  const raw = localStorage.getItem(ACCESS_EXPIRES_AT_MS_KEY);
  return raw ? Number(raw) : null;
}

export function clearAuthStorage(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_EXPIRES_AT_MS_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(PKCE_STATE_KEY);
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined;
  const verifier = getStoredPkceVerifier();

  if (!clientId || !redirectUri || !verifier) {
    throw new Error("Missing OAuth configuration or PKCE verifier");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as TokenResponse;
  storeTokens(data);

  // Clear one-time PKCE values
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(PKCE_STATE_KEY);
}

export async function refreshAccessToken(): Promise<void> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;
  const refreshToken = getStoredRefreshToken();
  if (!clientId || !refreshToken) throw new Error("Missing clientId or refresh token");

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Refresh failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as TokenResponse;
  storeTokens(data);
}

export async function getValidAccessToken(): Promise<string | null> {
  const access = getStoredAccessToken();
  const expiry = getAccessTokenExpiryMs();
  const now = Date.now();

  if (access && expiry && now < expiry) return access;

  const refresh = getStoredRefreshToken();
  if (refresh) {
    try {
      await refreshAccessToken();
      return getStoredAccessToken();
    } catch {
      clearAuthStorage();
      return null;
    }
  }
  return null;
}

export async function handleSpotifyRedirectCallback(): Promise<boolean> {
  const url = new URL(window.location.href);
  const hasCode = url.searchParams.has("code");
  const state = url.searchParams.get("state");
  if (!hasCode) return false;

  const expectedState = getStoredState();
  if (!state || !expectedState || state !== expectedState) {
    // eslint-disable-next-line no-alert
    alert("State mismatch. Please try logging in again.");
    clearAuthStorage();
    // Clean URL
    window.history.replaceState({}, "", "/");
    return true;
  }

  const code = url.searchParams.get("code");
  try {
    if (!code) throw new Error("Missing code");
    await exchangeCodeForTokens(code);
  } catch (err) {
    // eslint-disable-next-line no-alert
    alert(`Spotify auth failed: ${(err as Error).message}`);
    clearAuthStorage();
  }

  // Remove query params and redirect to home
  window.history.replaceState({}, "", "/");
  return true;
}


