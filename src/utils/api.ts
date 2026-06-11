/**
 * Build URLs that work both on morgan-map.vercel.app (standalone)
 * and when proxied via lab.tomwm.co.uk/morgan-map.
 *
 * import.meta.env.BASE_URL is '/morgan-map/' (set in vite.config.ts).
 * Stripping the trailing slash gives us '/morgan-map', so all paths
 * become '/morgan-map/...' — matching the proxy rewrite rules on the
 * lab host, and the equivalent rewrites on the standalone host.
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, ''); // e.g. '/morgan-map'

/** Prefix an /api/... path with the app base. */
export function apiUrl(path: string): string {
  return `${base}${path}`;
}

/** Prefix an internal page path (e.g. '/gallery', '/view/123') with the app base.
 *  For the root path '/', returns just the base (e.g. '/morgan-map') with no trailing slash. */
export function pageUrl(path: string): string {
  if (path === '/') return base || '/';
  return `${base}${path}`;
}
