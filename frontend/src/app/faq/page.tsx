import type { Metadata } from 'next';
import Link from 'next/link';
import { getPageSections, getSiteSeoConfig } from '@/lib/api';
import {
  buildBreadcrumbSchema,
  buildCanonicalUrl,
  buildFaqSchema,
} from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { FaqItem } from '@/types/cms';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeoConfig();
  return {
    title: 'Sizing, Care & Returns FAQ | Atelier Vance',
    description:
      'Answers to common questions about Atelier Vance sizing, leather and suede care, complimentary express shipping, and 30-day returns.',
    alternates: {
      canonical: buildCanonicalUrl(seo.siteUrl, '/faq'),
    },
  };
}

const FALLBACK_FAQS: FaqItem[] = [
  {
    question:
      'How do Atelier Vance shoes fit compared to standard sneaker brands?',
    answer:
      'Our lasts run true to standard US and EU sizing. Most customers wear their usual sneaker size. For structured leather dress pairs like the Camden Cap-Toe Oxford, if you sit between sizes or prefer thick socks, go up half a size.',
  },
  {
    question: 'Do your full-grain leather styles require a break-in period?',
    answer:
      'No. We line our leather shoes with soft glove calfskin and build in cushioned footbeds so they feel comfortable straight out of the box.',
  },
  {
    question: 'How should I care for brushed suede and leather uppers?',
    answer:
      'Use a soft dry suede brush on the Crosby Navy Suede Mid to keep the nap fresh. Wipe smooth leather pairs with a slightly damp cloth and condition sparingly once every season.',
  },
  {
    question: 'What is your shipping and 30-day return policy?',
    answer:
      'Orders over $150 ship free. Try your shoes indoors on clean surfaces, and reach out within 30 days for a free size exchange or straightforward refund.',
  },
];

export default async function FaqPage() {
  const [seo, homeSections] = await Promise.all([
    getSiteSeoConfig(),
    getPageSections('home'),
  ]);

  const faqSection = homeSections.find((s) => s.sectionType === 'FAQ_LIST');
  const faqContent = faqSection?.contentJson as
    | { heading?: string; subheading?: string; items?: FaqItem[] }
    | undefined;

  const items =
    faqContent?.items && faqContent.items.length > 0
      ? faqContent.items
      : FALLBACK_FAQS;

  const faqSchema = buildFaqSchema(items);
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: 'Home', pathname: '/' },
      { name: 'Fit & Care FAQ', pathname: '/faq' },
    ],
    seo.siteUrl
  );

  return (
    <main className="min-h-screen bg-[#F6F3EC] pt-28 pb-20 text-stone-900">
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-2 font-mono text-xs text-stone-500"
        >
          <Link href="/" className="transition hover:text-stone-900">
            Home
          </Link>
          <span>/</span>
          <span className="font-medium text-stone-900">Fit & Care FAQ</span>
        </nav>

        <header className="mb-10 border-b border-stone-900/10 pb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8C4A27]">
            Customer Support & Sizing
          </p>
          <h1 className="mt-2 font-condensed text-5xl uppercase tracking-tight text-stone-900 sm:text-6xl">
            {faqContent?.heading || 'Sizing, Materials & Returns FAQ'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
            {faqContent?.subheading ||
              'Honest guidance on fit, leather care, express shipping, and hassle-free size exchanges.'}
          </p>
        </header>

        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.question}
              className="rounded-3xl border border-stone-900/10 bg-white p-6 shadow-sm sm:p-7"
            >
              <h2 className="font-condensed text-2xl uppercase tracking-tight text-stone-900">
                {item.question}
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-stone-600">
                {item.answer}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-stone-900/10 bg-[#EFECE4] p-7 text-center sm:p-9">
          <p className="font-condensed text-3xl uppercase text-stone-900">
            Still Deciding Between Sizes?
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Write to us at{' '}
            <span className="font-semibold text-stone-900">
              hello@ateliervance.com
            </span>{' '}
            or browse the collection to inspect every style closely.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#18181B] px-6 text-xs font-semibold text-[#F6F3EC] transition hover:bg-[#8C4A27]"
          >
            Explore All Pairs
          </Link>
        </div>
      </div>
    </main>
  );
}
