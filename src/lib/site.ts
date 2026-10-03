import { z } from 'astro/zod';
import raw from '../../data/site.json';

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex color like #1E6FD9');
const fontName = z.string().regex(/^[A-Za-z0-9 ]+$/, 'Font names may only contain letters, numbers and spaces');
const sitePath = z.string().regex(/^\/[A-Za-z0-9/_.#-]*$/, 'Use a site path like /contact or /#quote');
const optionalUrl = z.union([z.literal(''), z.url({ protocol: /^https$/ })]);

const siteSchema = z.object({
  site: z.object({
    url: z.url({ protocol: /^https$/ }).refine((u) => !u.endsWith('/'), 'No trailing slash'),
    locale: z.string(),
    gaMeasurementId: z.union([z.literal(''), z.string().regex(/^G-[A-Z0-9]+$/)]),
    googleSiteVerification: z.string().regex(/^[A-Za-z0-9_-]*$/),
    calendlyUrl: z.union([z.literal(''), z.string().regex(/^https:\/\/calendly\.com\/[A-Za-z0-9/_-]+$/)]),
    // Empty means Netlify Forms; otherwise a form endpoint such as https://formsubmit.co/you@example.com
    formAction: optionalUrl.default(''),
    defaultOgImage: sitePath,
  }),
  business: z.object({
    name: z.string().min(1),
    // "lead-gen" sites are not yet a real operating business and must not carry trust claims.
    kind: z.enum(['operating', 'lead-gen']).default('operating'),
    schemaType: z.string().regex(/^[A-Za-z]+$/),
    tagline: z.string().min(1),
    description: z.string().min(1),
    phone: z.string().min(7),
    email: z.union([z.literal(''), z.email()]),
    regionLabel: z.string().min(1),
    alsoServing: z.array(z.string()),
    address: z.object({
      street: z.string(),
      city: z.string(),
      region: z.string(),
      postalCode: z.string(),
      showOnSite: z.boolean(),
    }),
    hours: z.array(
      z.object({
        days: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])),
        opens: z.string().regex(/^\d{2}:\d{2}$/),
        closes: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    ),
    sameAs: z.array(z.url({ protocol: /^https$/ })),
    googleMapsUrl: optionalUrl,
    // Only set from the real, current Google review total. Never estimate.
    rating: z.object({ value: z.number().min(1).max(5), count: z.number().int().min(1) }).nullable(),
  }),
  brand: z.object({
    logoText: z.string().min(1),
    colors: z.object({
      primary: hexColor,
      primaryAlt: hexColor,
      action: hexColor,
      accent: hexColor,
      surface: hexColor,
      surfaceAlt: hexColor,
      ink: hexColor,
      body: hexColor,
    }),
    fonts: z.object({
      heading: fontName,
      body: fontName,
      googleFontsUrl: z.union([z.literal(''), z.string().startsWith('https://fonts.googleapis.com/')]),
    }),
  }),
  // Short, true claims shown near the top of the homepage, e.g. "Licensed & Insured".
  trustBadges: z.array(z.string().min(2).max(40)).max(5).default([]),
  stats: z.array(z.object({ value: z.string(), label: z.string(), icon: z.string().regex(/^[a-z-]*$/).optional() })).max(4),
  cta: z.object({ label: z.string().min(1), href: sitePath }),
}).superRefine((data, ctx) => {
  if (data.business.kind === 'lead-gen' && data.business.rating) {
    ctx.addIssue({ code: 'custom', path: ['business', 'rating'], message: 'A lead-gen site cannot show a rating; set rating to null' });
  }
  if (data.business.kind === 'lead-gen' && data.business.sameAs.length === 0 && data.stats.some((s) => /licensed|insured|years|\d+\+/i.test(`${s.value} ${s.label}`))) {
    ctx.addIssue({ code: 'custom', path: ['stats'], message: 'A lead-gen site cannot claim licensing, insurance, years or job counts' });
  }
});

export type SiteData = z.infer<typeof siteSchema>;

export const site: SiteData = siteSchema.parse(raw);

export function phoneHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `tel:+${digits.length === 10 ? `1${digits}` : digits}`;
}

export function themeStyle(data: SiteData = site): string {
  const { colors, fonts } = data.brand;
  return [
    `--c-primary:${colors.primary}`,
    `--c-primary-alt:${colors.primaryAlt}`,
    `--c-action:${colors.action}`,
    `--c-accent:${colors.accent}`,
    `--c-surface:${colors.surface}`,
    `--c-surface-alt:${colors.surfaceAlt}`,
    `--c-ink:${colors.ink}`,
    `--c-body:${colors.body}`,
    `--font-head:'${fonts.heading}',system-ui,sans-serif`,
    `--font-body:'${fonts.body}',system-ui,sans-serif`,
  ].join(';');
}

// Pages are emitted as /about.html and served by Netlify as /about.
export function canonicalUrl(pathname: string, data: SiteData = site): string {
  const clean = pathname
    .replace(/\.html$/, '')
    .replace(/\/index$/, '')
    .replace(/\/+$/, '');
  return `${data.site.url}${clean === '' ? '/' : clean}`;
}
