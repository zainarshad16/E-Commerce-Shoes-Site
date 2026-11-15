import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollectionBySlug, getSiteSeoConfig } from '@/lib/api';
import { buildBreadcrumbSchema, buildCanonicalUrl } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { CatalogClient } from '@/components/storefront/CatalogClient';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [data, seo] = await Promise.all([
    getCollectionBySlug(slug),
    getSiteSeoConfig(),
  ]);

  if (!data) {
    return { title: 'Collection Not Found | Atelier Vance' };
  }

  const canonical = buildCanonicalUrl(
    seo.siteUrl,
    `/collections/${data.collection.slug}`
  );

  return {
    title: data.collection.metaTitle || `${data.collection.name} | Atelier Vance`,
    description: data.collection.metaDescription || data.collection.description,
    alternates: { canonical },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const [data, seo] = await Promise.all([
    getCollectionBySlug(slug),
    getSiteSeoConfig(),
  ]);

  if (!data) {
    notFound();
  }

  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: 'Home', pathname: '/' },
      { name: 'Shop', pathname: '/shop' },
      {
        name: data.collection.name,
        pathname: `/collections/${data.collection.slug}`,
      },
    ],
    seo.siteUrl
  );

  return (
    <main className="min-h-screen bg-[#F6F3EC] pt-28 pb-20 text-stone-900">
      <JsonLd data={breadcrumbSchema} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 font-mono text-xs text-stone-500"
        >
          <Link href="/" className="transition hover:text-stone-900">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="transition hover:text-stone-900">
            Shop
          </Link>
          <span>/</span>
          <span className="font-medium text-stone-900">
            {data.collection.name}
          </span>
        </nav>

        <header className="mb-10 rounded-3xl border border-stone-900/10 bg-white p-7 shadow-sm sm:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8C4A27]">
            {data.collection.eyebrow}
          </p>
          <h1 className="mt-2 font-condensed text-5xl uppercase tracking-tight text-stone-900 sm:text-6xl">
            {data.collection.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
            {data.collection.description}
          </p>
        </header>

        <CatalogClient initialCollectionSlug={data.collection.slug} />
      </div>
    </main>
  );
}
