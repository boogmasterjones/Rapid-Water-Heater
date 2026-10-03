## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

## This repository

This is the Biggify agency site template, or a client site built from it. Read README.md first: it defines the content contract.

### Ownership split

- The Biggify Platform (the agency's automation) writes **content only**: `content/`, `data/site.json`, `public/images/`. It never touches `src/`.
- A human-driven Claude Code chat owns **design and structure**: `src/`, `astro.config.mjs`, `netlify.toml`. Never hardcode a business name, phone number, color or font in `src/`; those live in `data/site.json`.
- Blog posts are never hand-written as pages. A new article is one Markdown file in `content/blog/` so the platform can see it.
- Schema changes in `src/content.config.ts` must stay in step with the blog generator in the Biggify Platform.
- Pages build to `/name.html` and are served at `/name`. Internal links never include `.html` or a trailing slash.

### Content rules (from the agency SEO playbook)

- **Location pages: at most 7**, chosen by prominence within ~50 miles of the main city, not by distance alone. Each one must be genuinely distinct: real neighborhoods, landmarks and local conditions, varied phrasing, and its approximate population as a real detail (`population` in front matter). Templated city-name swaps get sites ignored or penalized.
- **Titles**: `[Service] in [City], [State] | [Site Name]`, unique per page, 70 characters or fewer. **Descriptions**: unique, 50-170 characters, with the keyword, the location and one honest trust signal.
- **One H1 per page**, phrased naturally; its words should recur in the body copy. Keep heading count proportional to text length.
- **Depth**: service pages ~1,000+ words, location pages ~800, blog posts 600-1,200. Each service and location page ends with a keyword-rich section: an H2, two substantive paragraphs, an H3 plus a list of service or material variations, and an H3 plus a paragraph naming the service-area cities. Depth in service of the reader, never padding or keyword stuffing.
- **Target the phrases people type**: `[service] near me`, `[city] [niche] near me`, `[service] [city] [state]`, plus niche material and variant names.
- **Internal links**: each location page links to the homepage and 1-2 nearby location pages in context (`nearby` in front matter), with short, varied anchor text.
- **Images**: descriptive alt text with the location where natural. Put originals in `public/images/`; the build makes WebP copies and caps size automatically.
- **NAP**: name, phone and (if public) address come only from `data/site.json`, so they are identical everywhere.
- **Honesty**: never fabricate reviews, ratings, years in business, job counts, licenses, awards or guarantees. `business.kind` in `data/site.json` is `operating` for a real business (its genuine trust signals may be used) or `lead-gen` for a site not yet tied to one (no trust claims; write in a plain "we install / we clean" voice, and word the site as a referral service where a regulated trade is involved). The build refuses a rating on a lead-gen site.
- **Sitemap freshness**: set `updatedAt` in front matter whenever a page's content changes.

### Before finishing any change

```
npm run check
npm run build
npm run audit
```

`audit` enforces the pre-launch checklist on the built site (unique titles and descriptions, one H1, alt text, canonical, Open Graph, word-count targets as warnings). Fix every error; read every warning.

### Launch checklist (needs the client or the agency account)

- Google Search Console: verify the domain (DNS TXT) and submit `/sitemap.xml` on launch day.
- GA4: one property per site named `[Niche] [Main City]`; put the measurement ID in `data/site.json` (`site.gaMeasurementId`). Call clicks are then tracked automatically with a per-location label.
- Check the backlink profile for spam before and after launch (Ahrefs free checker); disavow through Search Console if needed.
- Run PageSpeed Insights (mobile and desktop) and Seobility on the live URL, not localhost.
