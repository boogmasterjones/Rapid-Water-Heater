// Checks the built site in dist/ against the agency pre-launch checklist. Fails on errors, prints warnings.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = join(process.cwd(), 'dist');
if (!existsSync(DIST)) {
  console.error('audit: run `npm run build` first');
  process.exit(1);
}

const WORD_TARGETS = { services: 1000, locations: 800, blog: 600 };
const errors = [];
const warnings = [];

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

const text = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1];

const titles = new Map();
const descriptions = new Map();

for (const file of walk(DIST)) {
  const page = '/' + relative(DIST, file).replace(/\\/g, '/');
  const html = readFileSync(file, 'utf8');
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const noindex = /name="robots"[^>]*noindex/i.test(head);

  const title = head.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? '';
  const description = head.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? '';
  if (!title) errors.push(`${page}: missing <title>`);
  if (title.length > 70) warnings.push(`${page}: title is ${title.length} chars (aim for 70 or fewer)`);
  if (!description) errors.push(`${page}: missing meta description`);
  if (!noindex && !/rel="canonical"/.test(head)) errors.push(`${page}: missing canonical`);
  if (!/<html[^>]+lang="/i.test(html)) errors.push(`${page}: missing lang attribute`);
  if (!/rel="apple-touch-icon"/.test(head)) warnings.push(`${page}: missing apple-touch-icon link`);
  if (!/property="og:title"/.test(head)) errors.push(`${page}: missing Open Graph tags`);

  if (!noindex) {
    for (const [map, value, label] of [[titles, title, 'title'], [descriptions, description, 'description']]) {
      if (value && map.has(value)) errors.push(`${page}: duplicate ${label} (same as ${map.get(value)})`);
      else if (value) map.set(value, page);
    }
  }

  const body = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html;
  const h1s = [...body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => text(m[1]));
  if (h1s.length !== 1) errors.push(`${page}: expected exactly one <h1>, found ${h1s.length}`);
  const bodyText = text(body).toLowerCase();
  if (h1s[0]) {
    const words = h1s[0].toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
    const missing = words.filter((w) => !bodyText.replace(h1s[0].toLowerCase(), '').includes(w));
    if (words.length > 0 && missing.length > words.length / 2) warnings.push(`${page}: most H1 words do not recur in the body (${missing.join(', ')})`);
  }

  for (const img of body.matchAll(/<img[^>]*>/gi)) {
    const tag = img[0];
    if (!/alt="/.test(tag)) errors.push(`${page}: image without alt text: ${attr(tag, 'src')}`);
    if (!/width="/.test(tag) || !/height="/.test(tag)) warnings.push(`${page}: image without width/height: ${attr(tag, 'src')}`);
  }

  const section = Object.keys(WORD_TARGETS).find((s) => page.startsWith(`/${s}/`));
  if (section) {
    const words = bodyText.split(/\s+/).length;
    if (words < WORD_TARGETS[section]) warnings.push(`${page}: ${words} words (target ~${WORD_TARGETS[section]} for ${section})`);
  }
}

for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(`audit: ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length > 0 ? 1 : 0);
