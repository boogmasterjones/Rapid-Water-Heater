import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

// webpSmall: an 800px-wide WebP for photos wider than that (also made by the optimizer), or null.
export type ImageInfo = { src: string; webp: string | null; webpSmall: string | null; width: number; height: number };

const cache = new Map<string, Promise<ImageInfo | null>>();
const PUBLIC_DIR = join(process.cwd(), 'public');

// Resolves a /images/... path to its real dimensions and WebP sibling (made by scripts/optimize-images.mjs).
export function imageInfo(src: string | undefined): Promise<ImageInfo | null> {
  if (!src) return Promise.resolve(null);
  if (!cache.has(src)) {
    cache.set(
      src,
      (async () => {
        const file = join(PUBLIC_DIR, src);
        if (!existsSync(file)) return null;
        const meta = await sharp(file).metadata();
        const webpPath = src.replace(/\.(jpe?g|png)$/i, '.webp');
        const hasWebp = webpPath !== src && existsSync(join(PUBLIC_DIR, webpPath)) && statSync(join(PUBLIC_DIR, webpPath)).size > 0;
        const smallPath = src.replace(/\.(jpe?g|png)$/i, '.w800.webp');
        const hasSmall = hasWebp && smallPath !== src && existsSync(join(PUBLIC_DIR, smallPath)) && statSync(join(PUBLIC_DIR, smallPath)).size > 0;
        return { src, webp: hasWebp ? webpPath : null, webpSmall: hasSmall ? smallPath : null, width: meta.width ?? 1200, height: meta.height ?? 800 };
      })(),
    );
  }
  return cache.get(src)!;
}

// Content Markdown can carry plain <img> tags (e.g. the Family page gallery). This gives each local JPEG/PNG the same
// treatment Picture.astro gives component photos: a <picture> with the WebP copies (800px and full) in a srcset, and
// real width/height. The img's own sizes="" attribute names its slot; without one the photo is assumed to fill the
// content column on phones and half of it on computers. Tags already inside a <picture> are left alone.
const IMG_TAG = /(<picture\b[\s\S]*?<\/picture>)|<img\b[^>]*>/gi;
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1];

export async function responsiveImages(html: string): Promise<string> {
  const tags = [...html.matchAll(IMG_TAG)].filter((m) => !m[1]);
  if (tags.length === 0) return html;
  const swaps = await Promise.all(tags.map(async (m) => {
    const tag = m[0];
    const src = attr(tag, 'src');
    if (!src || !/^\/images\/.+\.(jpe?g|png)$/i.test(src)) return tag;
    const info = await imageInfo(decodeURI(src));
    if (!info?.webp) return tag;
    const sizes = attr(tag, 'sizes') ?? '(max-width: 760px) 100vw, 50vw';
    const srcset = info.webpSmall ? `${encodeURI(info.webpSmall)} 800w, ${encodeURI(info.webp)} ${info.width}w` : `${encodeURI(info.webp)} ${info.width}w`;
    let img = tag.replace(/\ssizes="[^"]*"/i, '');
    img = attr(img, 'width') ? img.replace(/\swidth="[^"]*"/i, ` width="${info.width}"`) : img.replace(/^<img/i, `<img width="${info.width}"`);
    img = attr(img, 'height') ? img.replace(/\sheight="[^"]*"/i, ` height="${info.height}"`) : img.replace(/^<img/i, `<img height="${info.height}"`);
    if (!attr(img, 'loading')) img = img.replace(/^<img/i, '<img loading="lazy"');
    if (!attr(img, 'decoding')) img = img.replace(/^<img/i, '<img decoding="async"');
    return `<picture><source type="image/webp" srcset="${srcset}" sizes="${sizes}">${img}</picture>`;
  }));
  let i = 0;
  return html.replace(IMG_TAG, (whole, pic) => (pic ? whole : swaps[i++]));
}
