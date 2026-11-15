import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSeoConfig } from '@/lib/api';
import { buildBreadcrumbSchema, buildCanonicalUrl } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { BlogJournalClient } from '@/components/storefront/BlogJournalClient';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeoConfig();
  return {
    title: 'The Atelier Journal | Footwear Craft & Care Guides | Atelier Vance',
    description:
      'Read in-depth stories about full-grain leather, brushed indigo suede, breathable road knits, and footwear care across all Atelier Vance styles.',
    alternates: {
      canonical: buildCanonicalUrl(seo.siteUrl, '/blog'),
    },
  };
}

export default async function BlogIndexPage() {
  const seo = await getSiteSeoConfig();
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: 'Home', pathname: '/' },
      { name: 'Journal', pathname: '/blog' },
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
          <span className="font-medium text-stone-900">Journal</span>
        </nav>

        <header className="mb-10 flex flex-col justify-between gap-6 border-b border-stone-900/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="font-serif text-lg italic text-[#8C4A27]">
              Notes from the Workshop
            </p>
            <h1 className="mt-1 font-condensed text-5xl uppercase tracking-tight text-stone-900 sm:text-6xl">
              The Atelier Journal
            </h1>
          </div>
          <p className="max-w-lg text-sm leading-relaxed text-stone-600">
            Dedicated field essays, leather patina notes, and construction
            breakdowns for every pair in the Atelier Vance collection.
          </p>
        </header>

        <BlogJournalClient />
      </div>
    </main>
  );
}

