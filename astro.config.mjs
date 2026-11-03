// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';

const siteData = JSON.parse(readFileSync(new URL('./data/site.json', import.meta.url), 'utf8'));

export default defineConfig({
  site: siteData.site.url,
  // format 'file' emits /about.html, which Netlify serves at /about. Keeps URLs free of trailing slashes.
  // inlineStylesheets: the CSS (about 12 KB compressed) goes inside each page, so phones paint without waiting on a
  // separate render-blocking CSS request. Lighthouse flagged it on every page.
  build: { format: 'file', inlineStylesheets: 'always' },
  trailingSlash: 'never',
});
