import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getBlogByProductSlug,
  getProductBySlug,
  getProducts,
  getSiteSeoConfig,
} from '@/lib/api';
import {
  buildBreadcrumbSchema,
  buildCanonicalUrl,
  buildProductSchema,
} from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { ProductDetailInteractive } from '@/components/storefront/ProductDetailInteractive';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [product, seo] = await Promise.all([
    getProductBySlug(slug),
    getSiteSeoConfig(),
  ]);

  if (!product) {
    return { title: 'Pair Not Found | Atelier Vance' };
  }

  const canonical = buildCanonicalUrl(seo.siteUrl, `/product/${product.slug}`);
  return {
    title: product.metaTitle || `${product.name} | Atelier Vance`,
    description: product.metaDescription || product.description,
    keywords: product.keywords,
    alternates: { canonical },
    openGraph: {
      title: product.metaTitle || product.name,
      description: product.metaDescription || product.description,
      url: canonical,
      images: [
        {
          url: product.ogImageUrl || product.variants[0]?.posterImageUrl || '',
        },
      ],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, allProducts, seo, matchingBlog] = await Promise.all([
    getProductBySlug(slug),
    getProducts(),
    getSiteSeoConfig(),
    getBlogByProductSlug(slug),
  ]);

  if (!product) {
    notFound();
  }

  const primaryVariant = product.variants[0];
  const productSchema = primaryVariant
    ? buildProductSchema(product, primaryVariant, seo.siteUrl)
    : null;
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: 'Home', pathname: '/' },
      { name: 'Shop', pathname: '/shop' },
      { name: product.name, pathname: `/product/${product.slug}` },
    ],
    seo.siteUrl
  );

  const specEntries = Object.entries(product.specsJson || {});
  const relatedProducts = allProducts
    .filter((p) => p.slug !== product.slug && p.published)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[#F6F3EC] pt-28 pb-20 text-stone-900">
      {productSchema && <JsonLd data={productSchema} />}
      <JsonLd data={breadcrumbSchema} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-2 font-mono text-xs text-stone-500"
        >
          <Link href="/" className="transition hover:text-stone-900">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="transition hover:text-stone-900">
            Shop
          </Link>
          <span>/</span>
          <span className="font-medium text-stone-900">{product.name}</span>
        </nav>

        {/* Interactive Product Viewer & Fit Selector */}
        <ProductDetailInteractive product={product} />

        {/* Workshop Story & Material Specifications */}
        <section className="mt-16 grid grid-cols-1 gap-8 border-t border-stone-900/10 pt-14 lg:grid-cols-12">
          <div className="rounded-3xl border border-stone-900/10 bg-white p-7 shadow-sm lg:col-span-7 sm:p-9">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8C4A27]">
              Workshop Notes & Story
            </p>
            <h2 className="mt-2 font-condensed text-3xl uppercase text-stone-900">
              How We Made the {product.name}
            </h2>
            <div
              className="prose prose-stone mt-5 max-w-none text-sm leading-relaxed text-stone-700 [&_h3]:mt-5 [&_h3]:font-condensed [&_h3]:text-xl [&_h3]:uppercase [&_h3]:text-stone-900"
              dangerouslySetInnerHTML={{
                __html:
                  product.richStoryHtml ||
                  `<p>${product.description}</p>`,
              }}
            />
          </div>

          <div className="rounded-3xl border border-stone-900/10 bg-[#EFECE4] p-7 shadow-sm lg:col-span-5 sm:p-9">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8C4A27]">
              Materials & Build
            </p>
            <h2 className="mt-2 font-condensed text-3xl uppercase text-stone-900">
              Construction Details
            </h2>

            {specEntries.length > 0 ? (
              <dl className="mt-6 divide-y divide-stone-900/10 border-t border-stone-900/10">
                {specEntries.map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-4 py-3.5 text-sm"
                  >
                    <dt className="font-mono text-xs uppercase tracking-wider text-stone-500">
                      {key}
                    </dt>
                    <dd className="text-right font-medium text-stone-900">
                      {val}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-5 text-sm text-stone-600">
                Crafted in small batches with cushioned insoles, natural rubber
                outsoles, and breathable linings.
              </p>
            )}
          </div>
        </section>

        {/* Dedicated Editorial Story from Atelier Journal */}
        {matchingBlog && (
          <section className="mt-12">
            <div className="atelier-card flex flex-col items-start justify-between gap-6 rounded-3xl bg-[#FAF8F4] p-7 sm:flex-row sm:items-center sm:p-9">
              <div className="max-w-2xl">
                <p className="font-serif text-base italic text-[#8C4A27]">
                  From the Atelier Journal · {matchingBlog.readTime}
                </p>
                <h2 className="mt-1 font-condensed text-3xl uppercase text-stone-900 sm:text-4xl">
                  {matchingBlog.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {matchingBlog.excerpt}
                </p>
              </div>
              <Link
                href={`/blog/${matchingBlog.slug}`}
                className="btn-atelier inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-6 text-xs font-semibold uppercase tracking-wider"
              >
                <span>Read the Feature Article →</span>
              </Link>
            </div>
          </section>
        )}

        {/* Related Pairs */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 border-t border-stone-900/10 pt-14">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8C4A27]">
                  You Might Also Wear
                </p>
                <h2 className="mt-1 font-condensed text-3xl uppercase text-stone-900">
                  More From Atelier Vance
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-xs font-semibold text-[#8C4A27] underline-offset-4 hover:underline"
              >
                View All Styles →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.slug}`}
                  className="group rounded-3xl border border-stone-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-44 items-center justify-center rounded-2xl bg-[#EFECE4] p-4">
                    <img
                      src={
                        item.variants[0]?.posterImageUrl ||
                        item.ogImageUrl ||
                        '/images/shoes/espresso-hightop.png'
                      }
                      alt={item.name}
                      className="max-h-36 w-auto object-contain transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-2">
                    <h3 className="font-condensed text-2xl uppercase text-stone-900 group-hover:text-[#8C4A27]">
                      {item.name}
                    </h3>
                    <span className="font-condensed text-2xl tabular-nums text-stone-900">
                      ${item.basePrice}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-stone-600">
                    {item.tagline}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
