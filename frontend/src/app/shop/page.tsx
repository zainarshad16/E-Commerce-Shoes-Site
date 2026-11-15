import type { Metadata } from 'next';
import Link from 'next/link';
import { getPageSections, getProducts, getSiteSeoConfig } from '@/lib/api';
import { buildBreadcrumbSchema, buildCanonicalUrl } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { CatalogClient } from '@/components/storefront/CatalogClient';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeoConfig();
  return {
    title: 'Shop Footwear | Atelier Vance',
    description:
      'Browse the complete Atelier Vance footwear collection — full-grain leather oxfords, brushed suede mid-tops, knit road runners, and everyday canvas sneakers.',
    alternates: {
      canonical: buildCanonicalUrl(seo.siteUrl, '/shop'),
    },
  };
}

export default async function ShopPage() {
  const [seo, products, sections] = await Promise.all([
    getSiteSeoConfig(),
    getProducts(),
    getPageSections('shop'),
  ]);

  const headerBanner = sections.find(
    (s) => s.sectionType === 'STATEMENT_BANNER'
  );
  const bannerContent = headerBanner?.contentJson as
    | { eyebrow?: string; title?: string; subtitle?: string }
    | undefined;

  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: 'Home', pathname: '/' },
      { name: 'Shop Footwear', pathname: '/shop' },
    ],
    seo.siteUrl
  );

  return (
    <main className="min-h-screen bg-[#F6F3EC] pt-28 pb-20 text-stone-900">
      <JsonLd data={breadcrumbSchema} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 font-mono text-xs text-stone-500"
        >
          <Link href="/" className="transition hover:text-stone-900">
            Home
          </Link>
          <span>/</span>
          <span className="font-medium text-stone-900">Shop Footwear</span>
        </nav>

        {/* Page Header */}
        <div className="mb-10 flex flex-col justify-between gap-6 border-b border-stone-900/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8C4A27]">
              {bannerContent?.eyebrow || 'Complete Lineup · Small-Batch Pairs'}
            </p>
            <h1 className="mt-2 font-serif text-5xl font-semibold tracking-tight text-stone-900 sm:text-6xl">
              {bannerContent?.title || 'The Footwear Collection'}
            </h1>
          </div>
          <p className="max-w-lg text-sm leading-relaxed text-stone-600">
            {bannerContent?.subtitle ||
              `${products.length} versatile silhouettes made with supple leather, brushed suede, cotton canvas, and cushioned road soles for every part of your week.`}
          </p>
        </div>

        <CatalogClient />
      </div>
    </main>
  );
}
