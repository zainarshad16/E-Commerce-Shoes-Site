import { unstable_cache } from 'next/cache';
import {
  BlogPost,
  CollectionMeta,
  Order,
  PageSection,
  Product,
  SiteSeoConfig,
} from '@/types/cms';
import {
  SEED_BLOG_POSTS,
  SEED_COLLECTIONS,
  SEED_ORDERS,
  SEED_PAGE_SECTIONS,
  SEED_PRODUCTS,
  SEED_SEO_CONFIG,
} from './cms-seed';
import {
  queryNeonPageSectionsEdge,
  queryNeonProductsEdge,
  queryNeonSeoConfigEdge,
} from './neon-edge';

import { API_BASE_URL } from './config';

async function fetchFromApi<T>(
  path: string,
  _tags: string[],
  timeoutMs = 1200
): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${API_BASE_URL}${path}`, {
      next: {
        revalidate: 60,
        tags: _tags.length ? _tags : ['cms'],
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const getCachedNeonProducts = unstable_cache(
  async (includeUnpublished: boolean) =>
    queryNeonProductsEdge(includeUnpublished),
  ['neon-products'],
  { tags: ['products'], revalidate: 60 }
);

const getCachedNeonSections = unstable_cache(
  async (pageSlug: string) => queryNeonPageSectionsEdge(pageSlug),
  ['neon-sections'],
  { tags: ['cms', 'faq'], revalidate: 60 }
);

const getCachedNeonSeo = unstable_cache(
  async () => queryNeonSeoConfigEdge(),
  ['neon-seo'],
  { tags: ['seo'], revalidate: 60 }
);

export async function getProducts(includeUnpublished = false): Promise<Product[]> {
  const data = await fetchFromApi<{ products: Product[] }>(
    `/products${includeUnpublished ? '?includeUnpublished=true' : ''}`,
    ['products']
  );
  if (data?.products?.length) {
    return data.products;
  }

  const edgeProducts = await getCachedNeonProducts(includeUnpublished);
  if (edgeProducts && edgeProducts.length > 0) {
    return edgeProducts;
  }

  return includeUnpublished
    ? SEED_PRODUCTS
    : SEED_PRODUCTS.filter((p) => p.published);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const data = await fetchFromApi<{ product: Product }>(
    `/products/${encodeURIComponent(slug)}`,
    ['products', `product-${slug}`]
  );
  if (data?.product) {
    return data.product;
  }

  const edgeProducts = await getCachedNeonProducts(false);
  const edgeMatch = edgeProducts?.find((p) => p.slug === slug);
  if (edgeMatch) {
    return edgeMatch;
  }

  return SEED_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export async function getCollections(): Promise<CollectionMeta[]> {
  return SEED_COLLECTIONS;
}

export async function getCollectionBySlug(
  slug: string
): Promise<{ collection: CollectionMeta; products: Product[] } | null> {
  const collection = SEED_COLLECTIONS.find((c) => c.slug === slug);
  if (!collection) return null;
  const allProducts = await getProducts();
  return {
    collection,
    products: allProducts.filter((p) => p.collectionSlug === slug),
  };
}

export async function getPageSections(pageSlug = 'home'): Promise<PageSection[]> {
  const data = await fetchFromApi<{ sections: PageSection[] }>(
    `/cms/${encodeURIComponent(pageSlug)}`,
    ['cms', 'faq']
  );
  if (data?.sections?.length) {
    return data.sections.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  const edgeSections = await getCachedNeonSections(pageSlug);
  if (edgeSections && edgeSections.length > 0) {
    return edgeSections;
  }

  return SEED_PAGE_SECTIONS.filter((s) => s.pageSlug === pageSlug).sort(
    (a, b) => a.orderIndex - b.orderIndex
  );
}

export async function getSiteSeoConfig(): Promise<SiteSeoConfig> {
  const data = await fetchFromApi<{ seoConfig: SiteSeoConfig }>('/seo', ['seo']);
  if (data?.seoConfig) {
    return data.seoConfig;
  }

  const edgeSeo = await getCachedNeonSeo();
  if (edgeSeo) {
    return edgeSeo;
  }

  return SEED_SEO_CONFIG;
}

export async function getInitialOrders(): Promise<Order[]> {
  return SEED_ORDERS;
}

export async function getBlogs(includeUnpublished = false): Promise<BlogPost[]> {
  const data = await fetchFromApi<{ blogs: BlogPost[] }>(
    `/blogs${includeUnpublished ? '?includeUnpublished=true' : ''}`,
    ['blogs']
  );
  if (data?.blogs?.length) {
    return data.blogs;
  }

  return includeUnpublished
    ? SEED_BLOG_POSTS
    : SEED_BLOG_POSTS.filter((b) => b.published);
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  const data = await fetchFromApi<{ blog: BlogPost }>(
    `/blogs/${encodeURIComponent(slug)}`,
    ['blogs']
  );
  if (data?.blog) {
    return data.blog;
  }

  return SEED_BLOG_POSTS.find((b) => b.slug === slug) ?? null;
}

export async function getBlogByProductSlug(
  productSlug: string
): Promise<BlogPost | null> {
  const blogs = await getBlogs(false);
  return blogs.find((b) => b.relatedProductSlug === productSlug) ?? null;
}
