'use client';

import React from 'react';
import Link from 'next/link';
import { GitCompare, X } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import {
  SneakerStudioThumb,
  resolveSilhouetteFromText,
} from './SneakerStudioThumb';

export function ComparisonModal() {
  const {
    products,
    compareSlugs,
    toggleCompareSlug,
    isCompareOpen,
    setIsCompareOpen,
  } = useStore();

  if (!isCompareOpen || compareSlugs.length === 0) return null;

  const comparedProducts = products.filter((p) =>
    compareSlugs.includes(p.slug)
  );

  if (comparedProducts.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Compare footwear styles"
    >
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-stone-900/15 bg-[#FAF8F4] p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-stone-900/10 pb-4">
          <div className="flex items-center gap-2.5">
            <GitCompare className="h-5 w-5 text-[#8C4A27]" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8C4A27]">
                Side-by-Side Comparison
              </p>
              <h2 className="font-condensed text-3xl uppercase text-stone-900">
                Compare Styles
              </h2>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close comparison dialog"
            onClick={() => setIsCompareOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-900/10 text-stone-600 transition hover:bg-stone-900/5 hover:text-stone-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {comparedProducts.map((product) => {
            const v = product.variants[0];
            const specs = product.specsJson || {};
            const silhouette = resolveSilhouetteFromText(
              `${product.name} ${product.slug} ${product.category}`
            );

            return (
              <div
                key={product.id}
                className="flex flex-col justify-between rounded-2xl border border-stone-900/10 bg-white p-5 shadow-sm"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8C4A27]">
                      {product.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCompareSlug(product.slug)}
                      className="text-[11px] font-medium text-stone-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>

                  <SneakerStudioThumb
                    name={product.name}
                    category={product.category}
                    sku={v?.skuPrefix}
                    imageUrl={v?.posterImageUrl}
                    primaryGlowHex={v?.primaryGlowHex}
                    secondaryAccentHex={v?.secondaryAccentHex}
                    silhouette={silhouette}
                    compact
                    className="h-40 w-full"
                  />

                  <div className="mt-4 flex items-baseline justify-between gap-2">
                    <h3 className="font-condensed text-2xl uppercase text-stone-900">
                      {product.name}
                    </h3>
                    <span className="font-condensed text-2xl tabular-nums text-stone-900">
                      ${product.basePrice}
                    </span>
                  </div>

                  <dl className="mt-4 divide-y divide-stone-900/10 border-t border-stone-900/10 text-xs">
                    <div className="flex justify-between py-2">
                      <dt className="text-stone-500">Weight</dt>
                      <dd className="font-medium text-stone-900">
                        {specs.weight || 'Light Everyday Build'}
                      </dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-stone-500">Midsole & Welt</dt>
                      <dd className="font-medium text-stone-900">
                        {specs.midsole || 'Cushioned Support'}
                      </dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-stone-500">Outsole</dt>
                      <dd className="font-medium text-stone-900">
                        {specs.outsole || 'Natural Rubber Tread'}
                      </dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-stone-500">Rating</dt>
                      <dd className="font-medium tabular-nums text-stone-900">
                        {product.ratingValue.toFixed(1)} ★ ({product.reviewCount})
                      </dd>
                    </div>
                  </dl>
                </div>

                <Link
                  href={`/product/${product.slug}`}
                  onClick={() => setIsCompareOpen(false)}
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#18181B] px-4 text-xs font-semibold text-[#F6F3EC] transition hover:bg-[#8C4A27]"
                >
                  View Details
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
