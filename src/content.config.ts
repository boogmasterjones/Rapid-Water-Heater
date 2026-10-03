import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Biggify content contract. Ported pages keep their original markup in the body; new content is Markdown.

const imagePath = z.string().regex(/^\/(images|assets)\/[A-Za-z0-9/_.-]+\.(jpg|jpeg|png|webp|svg|avif)$/, 'Images live in /public and are referenced as /images/name.jpg');
const faq = z.object({ question: z.string().min(3), answer: z.string().min(5) });
// Ported pages keep their original titles and descriptions; new content should stay within 70 / 170.
const seo = { title: z.string().min(5).max(90), description: z.string().min(50).max(200) };
const media = { image: imagePath.optional(), imageAlt: z.string().min(3).optional() };
const requiresAlt = (d: { image?: string; imageAlt?: string }) => !d.image || Boolean(d.imageAlt);
const altMessage = { message: 'imageAlt is required when image is set', path: ['imageAlt'] };

const blog = defineCollection({
  loader: glob({ base: './content/blog', pattern: '*.md' }),
  schema: z.object({ ...seo, ...media, date: z.coerce.date(), updatedAt: z.coerce.date().optional(), category: z.string().optional(), author: z.string().optional(), faqs: z.array(faq).default([]), draft: z.boolean().default(false) }).refine(requiresAlt, altMessage),
});

const landing = {
  ...seo, ...media,
  name: z.string().min(2).max(60), navLabel: z.string().max(40).optional(), heading: z.string().min(3), summary: z.string().min(20).max(200),
  order: z.number().int().default(100), updatedAt: z.coerce.date().optional(), faqs: z.array(faq).default([]), draft: z.boolean().default(false), inNav: z.boolean().default(true), group: z.string().optional(),
};
const services = defineCollection({ loader: glob({ base: './content/services', pattern: '*.md' }), schema: z.object(landing).refine(requiresAlt, altMessage) });
const locations = defineCollection({ loader: glob({ base: './content/locations', pattern: '*.md' }), schema: z.object({ ...landing, city: z.string().min(2), region: z.string().length(2), population: z.string().max(30).optional(), nearby: z.array(z.string()).max(3).default([]) }).refine(requiresAlt, altMessage) });
const pages = defineCollection({
  loader: glob({ base: './content/pages', pattern: '*.md' }),
  schema: z.object({ ...seo, ...media, heading: z.string().min(3), subheading: z.string().optional(), path: z.string().regex(/^\/[a-z0-9/-]*$/), bodyClass: z.string().optional(), noindex: z.boolean().default(false), faqs: z.array(faq).default([]) }).refine(requiresAlt, altMessage),
});

export const collections = { blog, services, locations, pages };
