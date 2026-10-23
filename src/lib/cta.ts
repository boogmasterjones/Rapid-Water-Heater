// Call-to-action rows: "Call (941) 876-5900" + "Get a Free Estimate" at the end of every other section, site-wide.
//
// One rule everywhere: walking the page's sections top to bottom, a section that already ends in a call to action
// (a hero with buttons, the estimate form, a CTA band) counts as one; after any CTA the next section stays plain; and a
// row is never added directly before a section that has its own. So the page alternates and two calls to action never
// sit back to back. Ported content markup (content/*.md) gets its rows by an HTML pass at build time; components (the
// homepage carousel and tank, the photo band) take a `cta` prop and render <CtaRow>, which uses the same markup.
import { phoneHref, site } from './site';
import { callClick } from './track';

export type Cta = { label: string; quoteHref: string; align?: 'center' | 'start' };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function ctaRowHtml({ label, quoteHref, align = 'center' }: Cta): string {
  const onclick = callClick(label);
  return `<div class="cta-row${align === 'start' ? ' cta-row--start' : ''}">`
    + `<a class="btn btn-gold" href="${phoneHref(site.business.phone)}"${onclick ? ` onclick="${esc(onclick)}"` : ''}>`
    + `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`
    + `Call ${esc(site.business.phone)}</a>`
    + `<a class="btn btn-outline-light" href="${esc(quoteHref)}">Get a Free Estimate</a></div>`;
}

/** True when a block of markup already ends in (or is) a call to action. */
export function hasCta(html: string): boolean {
  return /class="[^"]*\b(cta-band|hero-actions|quote-form|cta-row)\b/.test(html) || /<a\b[^>]*class="[^"]*\bbtn\b[^"]*"[^>]*href="tel:|<a\b[^>]*href="tel:[^"]*"[^>]*class="[^"]*\bbtn\b/.test(html);
}

/** Given which blocks already have a CTA, returns which plain blocks get one (see the rule at the top). */
export function planCtas(has: boolean[]): boolean[] {
  const add = has.map(() => false);
  let prev = false;
  has.forEach((h, i) => {
    if (h) { prev = true; return; }
    if (prev || has[i + 1]) { prev = false; return; }
    add[i] = true; prev = true;
  });
  return add;
}

export type Chunk = { section: boolean; html: string };

/** Splits rendered markup into its top-level <section> elements and whatever sits between them. */
export function splitSections(html: string): Chunk[] {
  const out: Chunk[] = [];
  const re = /<(\/?)section\b[^>]*>/gi;
  let depth = 0, start = 0, last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (!m[1]) { if (depth === 0) { if (m.index > last) out.push({ section: false, html: html.slice(last, m.index) }); start = m.index; } depth++; }
    else if (depth > 0) { depth--; if (depth === 0) { last = re.lastIndex; out.push({ section: true, html: html.slice(start, last) }); } }
  }
  if (last < html.length) out.push({ section: false, html: html.slice(last) });
  return out;
}

/** Puts a CTA row at the end of a section, inside its container when it has one. */
export function appendCta(section: string, cta: Cta): string {
  const align = cta.align ?? (/^<section\b[^>]*class="[^"]*page-hero/.test(section) ? 'start' : 'center');
  const row = ctaRowHtml({ ...cta, align });
  const close = section.lastIndexOf('</section>');
  const before = section.slice(0, close);
  const lastDiv = before.lastIndexOf('</div>');
  // The container's closing tag is the last thing before </section> in this markup.
  if (lastDiv !== -1 && before.slice(lastDiv + 6).trim() === '') return `${before.slice(0, lastDiv)}${row}${before.slice(lastDiv)}</section>`;
  return `${before}<div class="container">${row}</div></section>`;
}

/**
 * Adds CTA rows to a page's content markup. `tail` says whether a block follows the content inside <main> (the photo
 * band); the return value says whether that block should get a row.
 */
export function addCtas(html: string, opts: { quoteHref: string; prefix: string; tail?: boolean }): { html: string; tailCta: boolean } {
  const chunks = splitSections(html);
  const sections = chunks.filter((c) => c.section);
  const has = sections.map((c) => hasCta(c.html));
  const plan = planCtas(opts.tail ? [...has, false] : has);
  let n = 0, k = 0;
  const out = chunks.map((c) => {
    if (!c.section) return c.html;
    const i = k++;
    return plan[i] ? appendCta(c.html, { label: `${opts.prefix}_section_cta_${++n}_phone_button`, quoteHref: opts.quoteHref }) : c.html;
  }).join('');
  return { html: out, tailCta: Boolean(opts.tail && plan[plan.length - 1]) };
}

/** Blog posts: a row mid-article, just before the middle H2 (needs at least two H2s), so it closes the first half. */
export function insertMidCta(html: string, cta: Cta): string {
  const h2s = [...html.matchAll(/<h2\b/gi)].map((m) => m.index ?? 0);
  if (h2s.length < 2) return html;
  const at = h2s[Math.floor(h2s.length / 2)];
  return html.slice(0, at) + ctaRowHtml(cta) + html.slice(at);
}
