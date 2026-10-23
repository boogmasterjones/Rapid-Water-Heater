// Shared switches for the Glass Rain scripts. Plain DOM, no libraries.
// RM: the visitor asked for reduced motion; every effect falls back to its finished, still state.
// SHOT: ?shot in the address shows the finished state of every reveal (for screenshots and audits).
// FINE: a mouse or trackpad, so pointer effects (tilt, glare, spotlight) make sense.
export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const SHOT = /[?&]shot/.test(location.search);
export const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const PHONE = !FINE || matchMedia('(max-width: 860px)').matches;

export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
export const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

// Resolves a CSS colour token (e.g. "--cool") to "r,g,b" for canvas drawing, so the rain follows the client colours.
export function tokenRgb(name: string, fallback: string): string {
  const probe = document.createElement('i');
  probe.style.cssText = `position:absolute;visibility:hidden;color:var(${name})`;
  document.body.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/[\d.]+/g);
  probe.remove();
  return m && m.length >= 3 ? m.slice(0, 3).map((v) => Math.round(Number(v))).join(',') : fallback;
}
