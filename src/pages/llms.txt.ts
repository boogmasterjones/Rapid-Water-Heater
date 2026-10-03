import type { APIRoute } from 'astro';
import { getLocations, getPosts, getServices } from '../lib/content';
import { canonicalUrl, site } from '../lib/site';

export const GET: APIRoute = async () => {
  const [services, locations, posts] = await Promise.all([getServices(), getLocations(), getPosts()]);
  const { business } = site;

  const list = (items: { path: string; name: string; text: string }[]) =>
    items.map((i) => `- [${i.name}](${canonicalUrl(i.path)}): ${i.text}`).join('\n');

  const body = [
    `# ${business.name}`,
    `> ${business.description}`,
    `Phone: ${business.phone}\nEmail: ${business.email}\nService region: ${business.regionLabel}`,
    `## Services\n${list(services.map((s) => ({ path: `/services/${s.id}`, name: s.data.name, text: s.data.summary })))}`,
    `## Service Areas\n${list(locations.map((l) => ({ path: `/locations/${l.id}`, name: l.data.name, text: l.data.summary })))}`,
    `## Articles\n${list(posts.map((p) => ({ path: `/blog/${p.id}`, name: p.data.title, text: p.data.description })))}`,
  ].join('\n\n');

  return new Response(`${body}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
