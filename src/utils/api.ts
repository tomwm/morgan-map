/**
 * Build an API URL that works both on morgan-map.vercel.app (standalone)
 * and when proxied via lab.tomwm.co.uk/morgan-map.
 *
 * import.meta.env.BASE_URL is '/morgan-map/' (set in vite.config.ts).
 * Stripping the trailing slash gives us '/morgan-map', so all API calls
 * become '/morgan-map/api/...' — matching the proxy rewrite rule on the
 * lab host, and the '/morgan-map/api/:path* → /api/:path*' rewrite on the
 * standalone host.
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, ''); // e.g. '/morgan-map'

export function apiUrl(path: string): string {
  // path should start with '/api/...'
  return `${base}${path}`;
}
