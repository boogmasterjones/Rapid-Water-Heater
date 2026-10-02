// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';

const siteData = JSON.parse(readFileSync(new URL('./data/site.json', import.meta.url), 'utf8'));

export default defineConfig({
  site: siteData.site.url,
  // Emits /about.html, which Netlify serves at /about. Keeps URLs free of trailing slashes.
  build: { format: 'file' },
  trailingSlash: 'never',
});
