import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

export type ImageInfo = { src: string; webp: string | null; width: number; height: number };

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
        return { src, webp: hasWebp ? webpPath : null, width: meta.width ?? 1200, height: meta.height ?? 800 };
      })(),
    );
  }
  return cache.get(src)!;
}
