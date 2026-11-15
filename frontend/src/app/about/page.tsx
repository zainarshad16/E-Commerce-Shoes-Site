import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { getSiteSeoConfig } from '@/lib/api';
import { buildBreadcrumbSchema, buildCanonicalUrl } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeoConfig();
  return {
    title: 'Our Craft & Materials | Atelier Vance',
    description:
      'Learn how Atelier Vance crafts small-batch leather shoes, suede sneakers, and lightweight knit runners designed for honest everyday comfort.',
    alternates: {
      canonical: buildCanonicalUrl(seo.siteUrl, '/about'),
    },
  };
}

const CRAFT_PILLARS = [
  {
    eyebrow: '01 · Honest Materials',
    title: 'Supple Full-Grain Leather, Suede & Breathable Knits',
    body: 'Every material is chosen for how it feels on hour eight, not just how it looks in the box. We pair full-grain vegetable-tanned hides, brushed navy suede, heavyweight cotton canvas, and engineered knit meshes that breathe naturally.',
  },
  {
    eyebrow: '02 · Lasted For Movement',
    title: 'All-Day Arch Support & Zero Stiff Break-In',
    body: 'Whether it is the Blake-stitched Camden Cap-Toe Oxford or the dual-density Velocity Knit Runner, each last gives your toes room to splay naturally while cradling your heel securely.',
  },
  {
    eyebrow: '03 · Small-Batch Responsibility',
    title: 'Made in Short Runs & Individually Inspected',
    body: 'Instead of warehousing tens of thousands of unsold pairs, we produce numbered small runs every season and inspect every stitch, welt seam, and lace eyelet before boxing.',
  },
];

export default async function AboutPage() {
  const seo = await getSiteSeoConfig();
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: 'Home', pathname: '/' },
      { name: 'Our Craft', pathname: '/about' },
    ],
    seo.siteUrl
  );

  return (
    <main className="min-h-screen bg-[#F6F3EC] pt-28 pb-20 text-stone-900">
      <JsonLd data={breadcrumbSchema} />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-2 font-mono text-xs text-stone-500"
        >
          <Link href="/" className="transition hover:text-stone-900">
            Home
          </Link>
          <span>/</span>
          <span className="font-medium text-stone-900">Our Craft</span>
        </nav>

        <header className="rounded-3xl border border-stone-900/10 bg-white p-8 shadow-sm sm:p-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8C4A27]">
            Atelier Vance Workshop · Est. 2019
          </p>
          <h1 className="mt-3 font-condensed text-5xl uppercase leading-[0.95] tracking-tight text-stone-900 sm:text-6xl">
            Footwear Built Around Real Days & Real Miles
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-600">
            We started Atelier Vance because too many shoes forced a choice
            between looking pulled-together and actually feeling good by the end
            of the evening. Our collection brings timeless leatherwork together
            with modern cushioned soles so every pair earns a permanent spot by
            your front door.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 border-t border-stone-900/10 pt-6 sm:grid-cols-3">
            {[
              'Vegetable-Tanned Full-Grain Hides',
              'Cushioned Cork & EVA Footbeds',
              '30-Day Home Trial & Exchanges',
            ].map((point) => (
              <div
                key={point}
                className="flex items-center gap-2 text-xs font-medium text-stone-800"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#8C4A27]" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </header>

        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {CRAFT_PILLARS.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-3xl border border-stone-900/10 bg-[#EFECE4] p-7 shadow-sm"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8C4A27]">
                {pillar.eyebrow}
              </p>
              <h2 className="mt-2 font-condensed text-2xl uppercase text-stone-900">
                {pillar.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                {pillar.body}
              </p>
            </article>
          ))}
        </section>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-stone-900/10 bg-[#18181B] px-8 py-8 text-[#F6F3EC]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#D8B998]">
              Ready to Explore?
            </p>
            <h2 className="mt-1 font-condensed text-3xl uppercase">
              Find Your Pair in the Shop
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#F6F3EC] px-6 text-xs font-semibold text-[#18181B] transition hover:bg-[#D8B998]"
          >
            <span>Browse All 7 Styles</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
