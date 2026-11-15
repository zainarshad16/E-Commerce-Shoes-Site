import { ColorwayVariant, FaqItem, Product, SiteSeoConfig } from '@/types/cms';

const FALLBACK_SITE_URL = 'https://atelier-vance-storefront.vercel.app';

/**
 * Normalizes a potentially comma-separated or malformed site URL into a single
 * valid HTTP(S) origin so `new URL(...)` in metadata generation never throws.
 */
export function resolveSafeSiteUrl(raw?: string | null): string {
  const candidates = (raw || '')
    .split(',')
    .map((item) => item.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const preferred =
    candidates.find((u) => !u.includes('localhost')) || candidates[0];
  if (!preferred) return FALLBACK_SITE_URL;
  try {
    const parsed = new URL(preferred);
    return parsed.origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function buildCanonicalUrl(siteUrl: string, pathname: string): string {
  const base = resolveSafeSiteUrl(siteUrl);
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return path === '/' ? base : `${base}${path}`;
}

export function buildOrganizationSchema(seoConfig: SiteSeoConfig) {
  const safeUrl = resolveSafeSiteUrl(seoConfig.siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoConfig.organizationSchemaJson.name || seoConfig.siteName,
    url: safeUrl,
    logo: seoConfig.organizationSchemaJson.logo,
    sameAs: seoConfig.organizationSchemaJson.sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      email: seoConfig.organizationSchemaJson.contactEmail,
      contactType: 'customer service',
    },
  };
}

export function buildWebSiteSchema(seoConfig: SiteSeoConfig) {
  const base = resolveSafeSiteUrl(seoConfig.siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoConfig.siteName,
    url: base,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildProductSchema(
  product: Product,
  activeVariant: ColorwayVariant,
  siteUrl: string
) {
  const totalStock = product.variants.reduce(
    (sum, variant) =>
      sum + variant.sizes.reduce((sSum, sz) => sSum + sz.stockCount, 0),
    0
  );

  const productUrl = buildCanonicalUrl(siteUrl, `/product/${product.slug}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.metaDescription || product.description,
    image: [
      activeVariant.posterImageUrl,
      ...activeVariant.galleryImages,
    ].filter(Boolean),
    sku: activeVariant.skuPrefix,
    mpn: activeVariant.skuPrefix,
    brand: {
      '@type': 'Brand',
      name: 'ATELIER VANCE',
    },
    category: product.category,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'USD',
      price: product.basePrice.toFixed(2),
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        totalStock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'ATELIER VANCE',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.ratingValue.toFixed(1),
      reviewCount: product.reviewCount,
    },
  };
}

export function buildBreadcrumbSchema(
  items: { name: string; pathname: string }[],
  siteUrl: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: buildCanonicalUrl(siteUrl, item.pathname),
    })),
  };
}

export function buildFaqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

