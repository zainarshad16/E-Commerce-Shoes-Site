import type { MetadataRoute } from 'next';
import { getCollections, getProducts, getSiteSeoConfig } from '@/lib/api';
import { buildCanonicalUrl, resolveSafeSiteUrl } from '@/lib/seo';

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [seoConfig, products, collections] = await Promise.all([
    getSiteSeoConfig(),
    getProducts(false),
    getCollections(),
  ]);

  const siteUrl = resolveSafeSiteUrl(seoConfig.siteUrl);
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: buildCanonicalUrl(siteUrl, '/'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: buildCanonicalUrl(siteUrl, '/shop'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: buildCanonicalUrl(siteUrl, '/about'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: buildCanonicalUrl(siteUrl, '/faq'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
  ];

  const collectionRoutes: MetadataRoute.Sitemap = collections.map((col) => ({
    url: buildCanonicalUrl(siteUrl, `/collections/${col.slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((prod) => ({
    url: buildCanonicalUrl(siteUrl, `/product/${prod.slug}`),
    lastModified: prod.updatedAt ? new Date(prod.updatedAt) : now,
    changeFrequency: 'daily',
    priority: prod.isFeaturedHero ? 0.95 : 0.85,
  }));

  return [...staticRoutes, ...collectionRoutes, ...productRoutes];
}

