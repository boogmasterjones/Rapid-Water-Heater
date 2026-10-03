# Rapid Water Heater LLC — website

Built from the Biggify agency site template, so it shares the same content contract as every other client site and the Biggify Platform can publish to it. Design lives in this site's own `public/css`, `public/js` and `src/`; the header and footer are static markup in `src/components`.

Built with Astro. Deployed by Netlify from GitHub (`npm run build`, output in `dist/`).

## What makes each site unique

| What | Where |
|---|---|
| Business facts, phone, colors, fonts, analytics ID | `data/site.json` |
| Homepage, About, Contact and index page text | `content/pages/*.md` |
| One file per service | `content/services/*.md` |
| One file per city | `content/locations/*.md` |
| One file per blog post | `content/blog/*.md` |
| Photos | `public/images/` |

Everything in `src/` is shared structure and is the same on every site. A site-specific look comes from `data/site.json` colors and fonts.

## Content contract

The exact rules live in `src/content.config.ts` and `src/lib/site.ts`. The build fails if any file breaks them, so a bad file can never reach the live site.

Rules for every content file:

- The file name is the web address: `content/blog/my-post.md` becomes `/blog/my-post`. Lowercase letters, numbers and hyphens only. Never rename a published file.
- `title`: 10-70 characters. `description`: 50-170 characters. Both unique per page.
- `image` must look like `/images/name.jpg` and the file must exist in `public/images/`. `imageAlt` is required whenever `image` is set.
- `faqs` is an optional list of `question` / `answer` pairs. They render on the page and as FAQ structured data.
- `draft: true` hides a file from the site.
- Body headings start at `##`. The page supplies the only `#` heading.
- Internal links are written without `.html` and without a trailing slash: `/services/example-service-one`.

Blog post example:

```md
---
title: "How to Choose a Tile Contractor in Southwest Florida"
description: "What to ask, what to check and the warning signs to watch for when hiring a tile contractor in Southwest Florida."
date: 2026-03-02
category: "Guides"
author: "Rock Solid Tile"
image: "/images/blog/choose-a-tile-contractor.jpg"
imageAlt: "Tile installer setting large format porcelain tile"
faqs:
  - question: "Should a tile contractor be licensed?"
    answer: "Yes. Ask for the license number and proof of insurance before work starts."
---

Opening paragraph...

## First Section
```

Services and locations additionally need `name`, `heading`, `summary` (20-200 characters) and `order` (lower numbers show first). Locations also need `city` and `region`, and accept `population` (shown as a real local detail) and `nearby` (1-3 slugs of neighbouring location pages to cross-link). Services and locations accept `inNav: false` to keep a page out of the menus.

## Generated automatically

Navigation, footer links, the blog index, `sitemap.xml`, `robots.txt`, `llms.txt`, canonical tags, Open Graph tags and structured data (business, service, breadcrumb, FAQ, article). Adding a content file is all it takes.

At build time: WebP copies of every JPG/PNG in `public/images/` (served through `<picture>`), photos capped at 1600px, real width/height on every image, and `apple-touch-icon.png` from `favicon.svg`. Every phone link fires a GA4 `call_click` event with a label for where it was clicked.

## Paths the platform may write

    content/blog/*  content/pages/*  content/services/*  content/locations/*
    data/site.json  public/images/*

Everything else (`src/`, `astro.config.mjs`, `netlify.toml`, `package.json`) is off limits to automation.

## Factual rules

- Placeholder text ships in this template. Replace all of it before launch.
- `business.kind` is `operating` for a real business or `lead-gen` for a site not yet tied to one. Lead-gen sites cannot show a rating or claim licensing, insurance, years or job counts; the build enforces this.
- `business.rating` in `data/site.json` stays `null` unless it matches the real, current Google review total.
- `address.showOnSite: false` keeps the street address in structured data only.
- Never add claims, awards, guarantees or services the client has not confirmed.

## Commands

```bash
npm run dev
```

```bash
npm run check
```

```bash
npm run build
```

```bash
npm run audit
```

`audit` runs against the built site and enforces the pre-launch checklist: unique titles and descriptions, one H1 whose words recur in the body, alt text and dimensions on every image, canonical and Open Graph tags, and word-count targets (~1,000 service, ~800 location, 600+ blog) as warnings. The content rules themselves are in CLAUDE.md.

## Netlify setup for a new site

1. Connect the GitHub repository in Netlify (not drag-and-drop). Build settings are read from `netlify.toml`.
2. Enable form detection under Forms if the site uses the built-in contact form.
3. When migrating an existing site, keep every old address working: add a `public/_redirects` file for any URL that changes. Use forced rules (`/old.html /new 301!`), because Astro emits `/new.html` files and Netlify serves an existing file before an unforced redirect, which would leave duplicate `.html` pages indexable.
