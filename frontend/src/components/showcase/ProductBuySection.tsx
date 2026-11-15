'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Check,
  Minus,
  Plus,
  RefreshCw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import {
  BRAND_CONFIG,
  SupportedCurrency,
  formatBrandPrice,
} from '@/config/brand.config';
import {
  SHOWCASE_PRODUCTS,
  getColorwayForProduct,
  getShowcaseProductById,
} from '@/data/products';
import { SizeSystem, useSneakerStore } from '@/store/useSneakerStore';
import { useStore } from '@/context/StoreContext';
import { openProductWithDoor } from '@/components/storefront/AtelierDoorTransition';

/**
 * Interactive pair selector, size converter (US / EU / UK), currency switch,
 * and bag addition panel synchronized with both Showcase Zustand state and StoreContext.
 */
export function ProductBuySection() {
  const [addedFeedback, setAddedFeedback] = useState(false);

  const selectedProductId = useSneakerStore((s) => s.selectedProductId);
  const selectedColorwayId = useSneakerStore((s) => s.selectedColorwayId);
  const sizeSystem = useSneakerStore((s) => s.sizeSystem);
  const selectedSizeUs = useSneakerStore((s) => s.selectedSizeUs);
  const quantity = useSneakerStore((s) => s.quantity);
  const currency = useSneakerStore((s) => s.currency);
  const isSizeGuideOpen = useSneakerStore((s) => s.isSizeGuideOpen);

  const selectProduct = useSneakerStore((s) => s.selectProduct);
  const selectColorway = useSneakerStore((s) => s.selectColorway);
  const setSizeSystem = useSneakerStore((s) => s.setSizeSystem);
  const setSelectedSizeUs = useSneakerStore((s) => s.setSelectedSizeUs);
  const setQuantity = useSneakerStore((s) => s.setQuantity);
  const setCurrency = useSneakerStore((s) => s.setCurrency);
  const setSizeGuideOpen = useSneakerStore((s) => s.setSizeGuideOpen);
  const addShowcaseCart = useSneakerStore((s) => s.addToCart);
  const setShowcaseCartOpen = useSneakerStore((s) => s.setCartOpen);
  const setCursorMode = useSneakerStore((s) => s.setCursorMode);

  // Sync seamlessly with StoreContext checkout & Neon PostgreSQL orders
  const {
    products: dbProducts,
    addToCart: addLegacyCart,
    setIsCartOpen,
  } = useStore();

  const baseProduct = getShowcaseProductById(selectedProductId);
  const matchedCmsProd = dbProducts.find(
    (p) => p.slug === baseProduct.slug || p.id === baseProduct.id
  );
  const product = matchedCmsProd
    ? {
        ...baseProduct,
        name: matchedCmsProd.name || baseProduct.name,
        description: matchedCmsProd.description || baseProduct.description,
        price: matchedCmsProd.basePrice ?? baseProduct.price,
      }
    : baseProduct;
  const colorway = getColorwayForProduct(baseProduct, selectedColorwayId);
  const activeSize =
    product.sizes.find((s) => s.us === selectedSizeUs) ||
    product.sizes.find((s) => s.stock > 0) ||
    product.sizes[0];

  const handleAddToCart = () => {
    if (!activeSize || activeSize.stock <= 0) return;

    addShowcaseCart({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      colorwayId: colorway.id,
      colorwayName: colorway.name,
      accentHex: colorway.accentHex,
      imageUrl: colorway.imageUrl || product.imageUrl,
      sizeUs: activeSize.us,
      sizeEu: activeSize.eu,
      sizeUk: activeSize.uk,
      unitPriceUsd: product.price,
      quantity,
      maxStock: activeSize.stock,
    });

    const matchedDb =
      dbProducts.find((p) => p.slug === product.slug) || dbProducts[0];
    if (matchedDb) {
      const dbVariant = matchedDb.variants[0];
      const dbSize =
        dbVariant?.sizes.find(
          (s) =>
            s.sizeLabel.includes(`US ${activeSize.us}`) && s.stockCount > 0
        ) || dbVariant?.sizes.find((s) => s.stockCount > 0);
      if (dbVariant && dbSize) {
        for (let i = 0; i < quantity; i++) {
          addLegacyCart({
            productId: matchedDb.id,
            productSlug: matchedDb.slug,
            productName: matchedDb.name,
            variantId: dbVariant.id,
            colorName: colorway.name,
            primaryGlowHex: colorway.accentHex,
            posterImageUrl: dbVariant.posterImageUrl || '',
            sizeSku: dbSize.sku,
            sizeLabel: `US ${activeSize.us} / EU ${activeSize.eu}`,
            unitPrice: product.price,
            maxStock: activeSize.stock,
          });
        }
      }
    }

    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
    setShowcaseCartOpen(true);
    setIsCartOpen(true);
  };

  return (
    <section
      id="buy-panel"
      aria-labelledby="buy-panel-heading"
      className="relative z-20 flex min-h-screen items-center py-24"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-12">
        {/* Left gutter remains open so the floating sneaker rests naturally on screen */}
        <div className="hidden lg:col-span-6 lg:block" />

        {/* Right Editorial Order Card */}
        <div className="lg:col-span-6">
          <div className="rounded-3xl border border-stone-900/10 bg-white/95 p-6 shadow-xl shadow-stone-900/5 backdrop-blur-xl sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-900/10 pb-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8C4A27]">
                  Select Your Size &amp; Pair
                </p>
                <h2
                  id="buy-panel-heading"
                  className="mt-1 font-serif text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl"
                >
                  {product.name}
                </h2>
              </div>

              {/* Currency Switcher */}
              <div
                className="inline-flex rounded-full border border-stone-900/10 bg-[#EFECE4] p-1"
                role="group"
                aria-label="Currency selector"
              >
                {(['USD', 'PKR'] as SupportedCurrency[]).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    onMouseEnter={() => setCursorMode('pointer')}
                    onMouseLeave={() => setCursorMode('default')}
                    className={`rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition ${
                      currency === curr
                        ? 'bg-[#18181B] text-[#F6F3EC]'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Weight */}
            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-condensed text-4xl tabular-nums tracking-tight text-stone-900">
                  {formatBrandPrice(product.price, currency)}
                </span>
                <span className="text-xs font-medium text-stone-500">
                  {product.weight} · In Stock
                </span>
              </div>
              <Link
                href={`/product/${product.slug}`}
                onMouseEnter={() => setCursorMode('pointer')}
                onMouseLeave={() => setCursorMode('default')}
                className="font-mono text-[11px] font-medium text-[#8C4A27] underline-offset-4 hover:underline"
              >
                View Full Product Page →
              </Link>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              {product.description}
            </p>

            {/* Silhouette Selector */}
            <div className="mt-6">
              <p className="mb-2.5 text-xs font-medium text-stone-500">
                1. Choose Silhouette
              </p>
              <div className="flex flex-wrap gap-2">
                {SHOWCASE_PRODUCTS.map((item) => {
                  const active = item.id === product.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectProduct(item.id)}
                      onMouseEnter={() => setCursorMode('pointer')}
                      onMouseLeave={() => setCursorMode('default')}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                        active
                          ? 'border-[#18181B] bg-[#18181B] text-[#F6F3EC]'
                          : 'border-stone-900/10 bg-[#F6F3EC] text-stone-700 hover:border-stone-900/30 hover:text-stone-900'
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colorway Selector */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-stone-500">
                  2. Color & Leather
                </span>
                <span className="font-medium text-stone-800">
                  {colorway.name}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colorways.map((cw) => {
                  const isActive = cw.id === colorway.id;
                  return (
                    <button
                      key={cw.id}
                      type="button"
                      onClick={() => selectColorway(cw.id)}
                      onMouseEnter={() => setCursorMode('pointer')}
                      onMouseLeave={() => setCursorMode('default')}
                      aria-label={`Select colorway ${cw.name}`}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        isActive
                          ? 'border-[#18181B] bg-[#EFECE4] text-stone-900 shadow-sm'
                          : 'border-stone-900/10 bg-white text-stone-600 hover:border-stone-900/25'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-stone-900/15"
                        style={{ backgroundColor: cw.accentHex }}
                      />
                      <span>{cw.name}</span>
                      {cw.isLimited && (
                        <span className="rounded-full bg-[#8C4A27]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#8C4A27]">
                          Small Batch
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size System Toggle + Size Guide */}
            <div className="mt-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-stone-500">
                    3. Select Size
                  </span>
                  <div
                    className="inline-flex rounded-full border border-stone-900/10 bg-[#EFECE4] p-0.5"
                    role="group"
                    aria-label="Size system toggle"
                  >
                    {(['US', 'EU', 'UK'] as SizeSystem[]).map((sys) => (
                      <button
                        key={sys}
                        type="button"
                        onClick={() => setSizeSystem(sys)}
                        onMouseEnter={() => setCursorMode('pointer')}
                        onMouseLeave={() => setCursorMode('default')}
                        className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold transition ${
                          sizeSystem === sys
                            ? 'bg-[#18181B] text-[#F6F3EC]'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {sys}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  onMouseEnter={() => setCursorMode('pointer')}
                  onMouseLeave={() => setCursorMode('default')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8C4A27] underline-offset-4 hover:underline"
                >
                  <Ruler className="h-3.5 w-3.5" />
                  <span>Size & Fit Guide</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
                {product.sizes.map((entry) => {
                  const outOfStock = entry.stock <= 0;
                  const isSelected = activeSize?.us === entry.us;
                  const displayVal =
                    sizeSystem === 'US'
                      ? `US ${entry.us}`
                      : sizeSystem === 'EU'
                      ? `EU ${entry.eu}`
                      : `UK ${entry.uk}`;

                  return (
                    <button
                      key={entry.us}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => setSelectedSizeUs(entry.us)}
                      onMouseEnter={() => setCursorMode('pointer')}
                      onMouseLeave={() => setCursorMode('default')}
                      className={`relative flex flex-col items-center justify-center rounded-xl border py-2.5 font-mono text-xs transition ${
                        outOfStock
                          ? 'cursor-not-allowed border-stone-900/5 bg-stone-100 text-stone-400 line-through'
                          : isSelected
                          ? 'border-[#18181B] bg-[#18181B] font-semibold text-[#F6F3EC] shadow-sm'
                          : 'border-stone-900/10 bg-[#F6F3EC]/70 text-stone-800 hover:border-stone-900/35 hover:bg-white'
                      }`}
                    >
                      <span>{displayVal}</span>
                      {!outOfStock && entry.stock <= 5 && (
                        <span
                          className={`mt-0.5 text-[9px] font-normal ${
                            isSelected ? 'text-[#EFECE4]' : 'text-[#8C4A27]'
                          }`}
                        >
                          {entry.stock} left
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity & Primary CTA */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <div className="inline-flex h-12 items-center justify-between rounded-full border border-stone-900/15 bg-[#F6F3EC] px-2 sm:w-36">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(quantity - 1)}
                  onMouseEnter={() => setCursorMode('pointer')}
                  onMouseLeave={() => setCursorMode('default')}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-900/10"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono text-sm font-semibold tabular-nums text-stone-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(quantity + 1)}
                  onMouseEnter={() => setCursorMode('pointer')}
                  onMouseLeave={() => setCursorMode('default')}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-900/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                type="button"
                disabled={!activeSize || activeSize.stock <= 0}
                onClick={handleAddToCart}
                onMouseEnter={() => setCursorMode('pointer')}
                onMouseLeave={() => setCursorMode('default')}
                className="btn-atelier inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold shadow-md disabled:cursor-not-allowed disabled:opacity-40"
              >
                {addedFeedback ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Added to Shopping Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>
                      Add to Bag ·{' '}
                      {formatBrandPrice(product.price * quantity, currency)}
                    </span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  openProductWithDoor(`/product/${product.slug}`, product.name)
                }
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-stone-900/15 bg-[#F6F3EC] px-4 text-xs font-semibold text-stone-800 transition hover:border-[#8C4A27]/60 hover:text-[#8C4A27]"
              >
                <span>Open Full Showroom (3D Door)</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
              <Link
                href="/checkout"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-stone-900/15 bg-white px-4 text-xs font-semibold text-stone-800 transition hover:border-stone-900/45"
              >
                <span>Proceed to Checkout</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Delivery & Trust Badges */}
            <p className="mt-4 text-center text-xs text-stone-500">
              {BRAND_CONFIG.deliveryLine}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-2.5 border-t border-stone-900/10 pt-5 sm:grid-cols-3">
              {BRAND_CONFIG.trustBadges.map((badge, idx) => {
                const Icon =
                  idx === 0 ? Truck : idx === 1 ? RefreshCw : ShieldCheck;
                return (
                  <div
                    key={badge.title}
                    className="rounded-xl border border-stone-900/10 bg-[#F6F3EC]/70 p-3"
                  >
                    <Icon className="h-4 w-4 text-[#8C4A27]" />
                    <p className="mt-1.5 text-xs font-semibold text-stone-900">
                      {badge.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-stone-600">
                      {badge.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Footwear Size Conversion Guide"
        >
          <div className="w-full max-w-lg rounded-3xl border border-stone-900/15 bg-[#FAF8F4] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-900/10 pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8C4A27]">
                  Sizing Reference
                </p>
                <h3 className="mt-1 font-condensed text-3xl uppercase text-stone-900">
                  US / EU / UK Fit Guide
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close size guide"
                onClick={() => setSizeGuideOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-900/10 text-stone-600 transition hover:bg-stone-900/5 hover:text-stone-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-stone-600">
              All Atelier Vance lasts run true to Brannock sizing. If you sit
              between half sizes in leather oxfords or wear thick wool socks in
              high-tops, choose the next half size up.
            </p>

            <div className="mt-4 overflow-hidden rounded-2xl border border-stone-900/10 bg-white">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-stone-900/10 bg-[#EFECE4] text-stone-700">
                  <tr>
                    <th className="px-4 py-2.5">US</th>
                    <th className="px-4 py-2.5">EU</th>
                    <th className="px-4 py-2.5">UK</th>
                    <th className="px-4 py-2.5">Foot Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-900/5 text-stone-800">
                  {[
                    ['7', '40', '6', '25.0 cm'],
                    ['8', '41', '7', '25.8 cm'],
                    ['9', '42.5', '8', '26.7 cm'],
                    ['10', '44', '9', '27.6 cm'],
                    ['11', '45', '10', '28.5 cm'],
                  ].map(([us, eu, uk, cm]) => (
                    <tr key={us}>
                      <td className="px-4 py-2.5 font-semibold">{us}</td>
                      <td className="px-4 py-2.5">{eu}</td>
                      <td className="px-4 py-2.5">{uk}</td>
                      <td className="px-4 py-2.5 text-stone-500">{cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
