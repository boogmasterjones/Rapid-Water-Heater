// Runs before every build. Caps oversized photos, creates WebP siblings, and makes the touch icon.
import { readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const PUBLIC = join(process.cwd(), 'public');
const IMAGES = join(PUBLIC, 'images');
const MAX_EDGE = 1600;
const SMALL_WIDTH = 800;

function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let converted = 0;
let resized = 0;
for (const file of walk(IMAGES)) {
  const ext = extname(file).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;

  try {
    const meta = await sharp(file).metadata();
    const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
    if (longest > MAX_EDGE) {
      const buffer = await sharp(file).resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true }).toBuffer();
      writeFileSync(file, buffer);
      resized++;
    }

    const webp = file.slice(0, -ext.length) + '.webp';
    const stale = !existsSync(webp) || statSync(webp).mtimeMs < statSync(file).mtimeMs;
    if (stale) {
      await sharp(file).webp({ quality: 80, effort: 5 }).toFile(webp);
      converted++;
    }

    // A smaller WebP for photos shown well below their full size (cards, galleries, the hero photo). Picture.astro
    // offers both through srcset, and the browser picks by the slot size it is given.
    const width = Math.min(meta.width ?? 0, MAX_EDGE);
    const small = file.slice(0, -ext.length) + `.w${SMALL_WIDTH}.webp`;
    if (width > SMALL_WIDTH + 100 && (!existsSync(small) || statSync(small).mtimeMs < statSync(file).mtimeMs)) {
      await sharp(file).resize({ width: SMALL_WIDTH }).webp({ quality: 78, effort: 5 }).toFile(small);
      converted++;
    }
  } catch (error) {
    // A damaged or mislabelled file is served as-is rather than failing the whole build.
    console.warn(`images: skipped ${file.slice(PUBLIC.length)} (${error.message.split('\n')[0]})`);
  }
}

const favicon = ['favicon.svg', 'favicon.png', 'images/favicon.svg', 'images/favicon.png'].map((f) => join(PUBLIC, f)).find((f) => existsSync(f));
const touchIcon = join(PUBLIC, 'apple-touch-icon.png');
if (favicon && (!existsSync(touchIcon) || statSync(touchIcon).mtimeMs < statSync(favicon).mtimeMs)) {
  const siteData = JSON.parse((await import('node:fs')).readFileSync(join(process.cwd(), 'data/site.json'), 'utf8'));
  const background = siteData.brand?.colors?.primary ?? '#000000';
  await sharp(favicon, favicon.endsWith('.svg') ? { density: 300 } : {})
    .resize(150, 150, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 15, bottom: 15, left: 15, right: 15, background })
    .flatten({ background })
    .png()
    .toFile(touchIcon);
  console.log('images: generated apple-touch-icon.png');
}

console.log(`images: ${converted} webp written, ${resized} resized`);
