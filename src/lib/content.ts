import { getCollection, getEntry } from 'astro:content';

export async function getHome() {
  const entry = await getEntry('pages', 'home');
  if (!entry) throw new Error('Missing required file content/pages/home.md');
  return entry;
}
export async function getPages() { return (await getCollection('pages')).filter((p) => p.data.path !== '/'); }
export async function getServices() { return (await getCollection('services', ({ data }) => !data.draft)).sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name)); }
export async function getLocations() { return (await getCollection('locations', ({ data }) => !data.draft)).sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name)); }
export async function getPosts() { return (await getCollection('blog', ({ data }) => !data.draft)).sort((a, b) => b.data.date.getTime() - a.data.date.getTime()); }
export function formatDate(date: Date): string { return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }); }
export function readingTime(text: string): string { return `${Math.max(1, Math.round(text.trim().split(/\s+/).length / 200))} min read`; }
