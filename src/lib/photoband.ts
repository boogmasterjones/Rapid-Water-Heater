import photos from '../../data/photos.json';

export type Band = typeof photos.fallback;

// The real-people photo strip for a page (data/photos.json, keyed by path; blog posts share the fallback), or null.
export function photoBandFor(pathname: string): Band | null {
  const path = pathname.replace(/\.html$/, '').replace(/(.)\/$/, '$1').replace(/^\/index$/, '/');
  return (photos.pages as Record<string, Band>)[path] ?? (path.startsWith('/blog/') ? photos.fallback : null);
}

// A GA4-safe label prefix for a page: "/services/drain-cleaning" -> "services_drain_cleaning", "/" -> "home".
export function pageKey(pathname: string): string {
  const p = pathname.replace(/\.html$/, '').replace(/^\/+|\/+$/g, '').replace(/^index$/, '');
  return p ? p.replace(/[^a-z0-9]+/gi, '_') : 'home';
}
