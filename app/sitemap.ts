import type { MetadataRoute } from 'next';
import { getActiveSlugs } from '@/lib/queries/products';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  const now = new Date();

  const fixed: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/catalogo`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/catalogo?vista=lista`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
  ];

  const products = (await getActiveSlugs()).map((slug) => ({
    url: `${base}/prenda/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...fixed, ...products];
}
