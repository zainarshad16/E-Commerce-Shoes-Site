import type { Metadata } from 'next';
import { getPageSections, getSiteSeoConfig } from '@/lib/api';
import { buildCanonicalUrl, buildFaqSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { ShowcaseExperience } from '@/components/showcase/ShowcaseExperience';
import { FaqItem } from '@/types/cms';

export async function generateMetadata(): Promise<Metadata> {
  const seoConfig = await getSiteSeoConfig();
  const canonical = buildCanonicalUrl(seoConfig.siteUrl, '/');
  return {
    title: seoConfig.defaultMetaTitle,
    description: seoConfig.defaultMetaDescription,
    alternates: { canonical },
    openGraph: {
      title: seoConfig.defaultMetaTitle,
      description: seoConfig.defaultMetaDescription,
      url: canonical,
      images: [{ url: seoConfig.defaultOgImage }],
      type: 'website',
    },
  };
}

export default async function HomePage() {
  const sections = await getPageSections('home');
  const faqSection = sections.find((s) => s.sectionType === 'FAQ_LIST');
  const faqContent = (faqSection?.contentJson || {}) as { items?: FaqItem[] };
  const faqItems = faqContent.items || [];

  return (
    <>
      {faqItems.length > 0 && <JsonLd data={buildFaqSchema(faqItems)} />}
      <ShowcaseExperience />
    </>
  );
}
