'use client';

import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import {
  SHOWCASE_PRODUCTS,
  getColorwayForProduct,
  getShowcaseProductById,
} from '@/data/products';
import { useStore } from '@/context/StoreContext';
import { useSneakerStore } from '@/store/useSneakerStore';
import { openProductWithDoor } from '@/components/storefront/AtelierDoorTransition';

/**
 * Section 4 — Styles & Colorways Switcher:
 * Lets shoppers switch effortlessly across all 7 real shoes and inspect their materials.
 */
export function ColorwaySwitcherSection() {
  const selectedProductId = useSneakerStore((s) => s.selectedProductId);
  const selectedColorwayId = useSneakerStore((s) => s.selectedColorwayId);
  const selectProduct = useSneakerStore((s) => s.selectProduct);
  const selectColorway = useSneakerStore((s) => s.selectColorway);
  const { products: cmsProducts } = useStore();

  const baseProduct = getShowcaseProductById(selectedProductId);
  const cmsMatch = cmsProducts.find(
    (p) => p.slug === baseProduct.slug || p.id === baseProduct.id
  );
  const product = cmsMatch
    ? { ...baseProduct, name: cmsMatch.name || baseProduct.name }
    : baseProduct;
  const activeColorway = getColorwayForProduct(baseProduct, selectedColorwayId);

  return (
    <section
      id="colorways"
      aria-label="Signature Styles and Colorway Switcher"
      className="relative flex min-h-screen flex-col justify-between px-6 py-24 sm:px-10 lg:px-16"
    >
      {/* Top Heading */}
      <div className="relative z-20 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8C4A27]">
            Seasonal Wardrobe
          </p>
          <h2 className="mt-1 font-serif text-5xl font-semibold tracking-tight text-stone-900 sm:text-6xl">
            Signature Styles
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-900/10 bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: activeColorway.accentHex }}
              />
              <span className="text-xs font-semibold text-stone-900">
                {product.name} · {activeColorway.name}
              </span>
              {activeColorway.isLimited && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#8C4A27]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8C4A27]">
                  <Sparkles className="h-2.5 w-2.5" />
                  Small Batch
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Select a silhouette below or enter its private showroom page
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              openProductWithDoor(`/product/${product.slug}`, product.name)
            }
            className="btn-atelier inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold"
          >
            <span>Open Showroom</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Center Negative Space keeps the shoe clearly visible */}
      <div className="h-[34vh] sm:h-[40vh]" />

      {/* Bottom Switcher Deck */}
      <div className="relative z-20 mx-auto w-full max-w-5xl rounded-3xl border border-stone-900/10 bg-white/90 p-5 shadow-xl backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold text-stone-500">
              All 7 Silhouettes
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              {SHOWCASE_PRODUCTS.map((item) => {
                const isActive = item.id === product.id;
                const leadColor = item.colorways[0];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectProduct(item.id)}
                    className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2 transition-all duration-300 ${
                      isActive
                        ? 'border-stone-900 bg-stone-900/5 shadow-sm'
                        : 'border-stone-900/10 bg-stone-50/70 hover:border-stone-900/30'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-9 w-9 object-contain"
                    />
                    <div className="text-left">
                      <span className="block text-xs font-semibold text-stone-900">
                        {item.name.split(' ')[0]}
                      </span>
                      <span
                        className="block text-[11px] font-medium"
                        style={{ color: leadColor.accentHex }}
                      >
                        {item.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-stone-900/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              {product.colorways.map((cw) => {
                const isSelected = cw.id === activeColorway.id;
                return (
                  <button
                    key={cw.id}
                    type="button"
                    onClick={() => selectColorway(cw.id)}
                    aria-label={`Select ${cw.name} colorway`}
                    aria-pressed={isSelected}
                    className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 transition-all duration-300 ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                        : 'border-stone-900/15 bg-white text-stone-700 hover:border-stone-900/40'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-stone-900/15"
                      style={{
                        background: `linear-gradient(135deg, ${cw.upper} 45%, ${cw.accentHex} 55%)`,
                      }}
                    />
                    <span className="text-xs font-medium">{cw.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] sm:min-w-[240px]">
              {(
                [
                  ['Upper', activeColorway.upper],
                  ['Midsole', activeColorway.midsole],
                  ['Outsole', activeColorway.outsole],
                  ['Laces', activeColorway.laces],
                  ['Lining', activeColorway.tongue],
                  ['Trim', activeColorway.logo],
                ] as const
              ).map(([label, hex]) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-lg border border-stone-900/10 bg-stone-50 px-2 py-1"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm border border-stone-900/15"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="truncate text-stone-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
