import { setAuthToken } from "./backendClient";

let _initialized = false;

/**
 * Fetch the NextAuth session JWT and wire it into backendClient.
 * Call once on app mount (e.g. in a root layout or provider).
 */
export async function initBackendAuth(): Promise<void> {
  if (_initialized) return;
  try {
    const res = await fetch("/api/auth/token");
    const data = await res.json();
    setAuthToken(data.token || null);
  } catch {
    setAuthToken(null);
  }
  _initialized = true;
}
