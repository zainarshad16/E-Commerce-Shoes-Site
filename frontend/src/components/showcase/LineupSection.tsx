'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { formatBrandPrice } from '@/config/brand.config';
import { SHOWCASE_PRODUCTS } from '@/data/products';
import { useStore } from '@/context/StoreContext';
import { useSneakerStore } from '@/store/useSneakerStore';
import { SneakerStudioThumb } from '@/components/storefront/SneakerStudioThumb';
import { openProductWithDoor } from '@/components/storefront/AtelierDoorTransition';

interface LineupSectionProps {
  onSelectForBuy: () => void;
}

/**
 * Section 5 — The Essential Collection: Warm luxury product showcase cards
 * with 3D Showroom Door navigation and quick-buy sizing access.
 */
export function LineupSection({ onSelectForBuy }: LineupSectionProps) {
  const selectedProductId = useSneakerStore((s) => s.selectedProductId);
  const currency = useSneakerStore((s) => s.currency);
  const selectProduct = useSneakerStore((s) => s.selectProduct);
  const setHoveredProduct = useSneakerStore((s) => s.setHoveredProduct);
  const { products: cmsProducts } = useStore();

  const [tiltById, setTiltById] = useState<
    Record<string, { rx: number; ry: number }>
  >({});

  const handleCardMouseMove = (
    id: string,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTiltById((prev) => ({
      ...prev,
      [id]: { rx: -py * 8, ry: px * 10 },
    }));
  };

  const handleCardLeave = (id: string) => {
    setHoveredProduct(null);
    setTiltById((prev) => ({
      ...prev,
      [id]: { rx: 0, ry: 0 },
    }));
  };

  return (
    <section
      id="lineup"
      aria-label="Essential Footwear Collection"
      className="relative z-20 px-6 py-28 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8C4A27]">
              Seasonal Release · 7 Original Silhouettes
            </p>
            <h2 className="mt-1 font-serif text-5xl font-semibold tracking-tight text-stone-900 sm:text-6xl">
              The Essential Collection
            </h2>
          </div>

          <Link
            href="/shop"
            className="btn-atelier inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold shadow-sm"
          >
            <span>Browse Full Store</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SHOWCASE_PRODUCTS.map((baseProduct) => {
            const cmsMatch = cmsProducts.find(
              (p) => p.slug === baseProduct.slug || p.id === baseProduct.id
            );
            const product = cmsMatch
              ? {
                  ...baseProduct,
                  name: cmsMatch.name || baseProduct.name,
                  tagline: cmsMatch.tagline || baseProduct.tagline,
                  category: (cmsMatch.category || baseProduct.category) as typeof baseProduct.category,
                  price: cmsMatch.basePrice ?? baseProduct.price,
                  imageUrl:
                    cmsMatch.variants?.[0]?.posterImageUrl &&
                    !cmsMatch.variants[0].posterImageUrl.endsWith('.glb')
                      ? cmsMatch.variants[0].posterImageUrl
                      : baseProduct.imageUrl,
                  colorways:
                    cmsMatch.variants && cmsMatch.variants.length > 0
                      ? baseProduct.colorways.map((cw, idx) => {
                          const mv = cmsMatch.variants[idx] || cmsMatch.variants[0];
                          return {
                            ...cw,
                            name: mv?.colorName || cw.name,
                            accentHex: mv?.primaryGlowHex || cw.accentHex,
                            secondaryHex: mv?.secondaryAccentHex || cw.secondaryHex,
                          };
                        })
                      : baseProduct.colorways,
                }
              : baseProduct;
            const leadColor = product.colorways[0];
            const isSelected = selectedProductId === product.id;
            const tilt = tiltById[product.id] || { rx: 0, ry: 0 };

            const enterShowroom = () => {
              selectProduct(product.id);
              setHoveredProduct(null);
              openProductWithDoor(`/product/${product.slug}`, product.name);
            };

            return (
              <div
                key={product.id}
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseMove={(e) => handleCardMouseMove(product.id, e)}
                onMouseLeave={() => handleCardLeave(product.id)}
                onClick={enterShowroom}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    enterShowroom();
                  }
                }}
                aria-label={`Enter 3D showroom for ${product.name}`}
                className={`atelier-card group flex cursor-pointer flex-col justify-between rounded-3xl p-5 ${
                  isSelected ? 'ring-1 ring-[#8C4A27]/45' : ''
                }`}
              >
                <div>
                  <div
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-stone-900/5 transition-transform duration-200 will-change-transform"
                    style={{
                      transform: `perspective(850px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                    }}
                  >
                    <SneakerStudioThumb
                      name={product.name}
                      category={product.category}
                      imageUrl={product.imageUrl}
                      primaryGlowHex={leadColor.accentHex}
                      secondaryAccentHex={leadColor.secondaryHex}
                    />
                    <span className="absolute left-3 top-3 z-20 rounded-full bg-white/95 px-3 py-1 text-[11px] font-medium text-stone-700 shadow-sm">
                      {product.category}
                    </span>
                    <span className="absolute right-3 top-3 z-20 rounded-full bg-stone-900/5 px-2.5 py-0.5 text-[11px] text-stone-600">
                      {product.weight}
                    </span>
                  </div>

                  <div className="mt-5 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-xl font-semibold tracking-tight text-stone-900 transition-colors group-hover:text-[#8C4A27]">
                        {product.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">
                        {product.tagline}
                      </p>
                    </div>
                    <span className="text-base font-bold tabular-nums text-stone-900">
                      {formatBrandPrice(product.price, currency)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-3 border-t border-stone-900/10 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-stone-500">Finishes</span>
                      <div className="flex items-center gap-1.5">
                        {product.colorways.map((cw) => (
                          <span
                            key={cw.id}
                            title={cw.name}
                            className="h-3 w-3 rounded-full border border-stone-900/15"
                            style={{ backgroundColor: cw.accentHex }}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectProduct(product.id);
                        setHoveredProduct(null);
                        onSelectForBuy();
                      }}
                      className="rounded-full border border-stone-900/15 bg-[#F6F3EC] px-2.5 py-1 font-mono text-[10px] font-semibold text-stone-700 transition hover:border-stone-900/40 hover:text-stone-900"
                    >
                      Quick Size
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-[#8C4A27]">
                    <span>Enter 3D Showroom</span>
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
