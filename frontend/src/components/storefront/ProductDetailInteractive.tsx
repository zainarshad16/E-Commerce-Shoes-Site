'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  GitCompare,
  Lock,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import { Product } from '@/types/cms';
import { useStore } from '@/context/StoreContext';
import {
  SneakerStudioThumb,
  resolveOriginalShoeImage,
  resolveSilhouetteFromText,
} from './SneakerStudioThumb';

const ShoeStage = dynamic(() => import('@/components/three/ShoeStage'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[380px] w-full items-center justify-center rounded-3xl bg-[#EFECE4] font-mono text-xs text-stone-500">
      Preparing studio viewer...
    </div>
  ),
});

interface ProductDetailInteractiveProps {
  product: Product;
}

export function ProductDetailInteractive({
  product,
}: ProductDetailInteractiveProps) {
  const router = useRouter();
  const {
    addToCart,
    setActiveGlowColors,
    compareSlugs,
    toggleCompareSlug,
    setIsCompareOpen,
    authUser,
  } = useStore();

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id || ''
  );
  const [selectedSizeSku, setSelectedSizeSku] = useState<string>('');
  const [inspectScale, setInspectScale] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'studio' | 'turnview'>('studio');
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);

  const activeVariant = useMemo(
    () =>
      product.variants.find((v) => v.id === selectedVariantId) ||
      product.variants[0],
    [product.variants, selectedVariantId]
  );

  useEffect(() => {
    if (activeVariant) {
      setActiveGlowColors(
        activeVariant.primaryGlowHex,
        activeVariant.secondaryAccentHex
      );
      const firstAvailable =
        activeVariant.sizes.find((s) => s.stockCount > 0) ||
        activeVariant.sizes[0];
      setSelectedSizeSku(firstAvailable?.sku || '');
    }
  }, [activeVariant, setActiveGlowColors]);

  const activeSize = activeVariant?.sizes.find(
    (s) => s.sku === selectedSizeSku
  );

  const silhouette = resolveSilhouetteFromText(
    `${product.name} ${product.slug} ${product.category}`
  );
  const studioImage =
    activeVariant?.posterImageUrl ||
    product.ogImageUrl ||
    resolveOriginalShoeImage(
      product.name,
      activeVariant?.skuPrefix,
      product.category
    );

  const handleAddToBag = () => {
    if (!activeVariant || !activeSize || activeSize.stockCount <= 0) return;

    if (!authUser) {
      router.push(`/login?redirect=/product/${product.slug}`);
      return;
    }

    addToCart({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantId: activeVariant.id,
      colorName: activeVariant.colorName,
      primaryGlowHex: activeVariant.primaryGlowHex,
      posterImageUrl: activeVariant.posterImageUrl,
      sizeSku: activeSize.sku,
      sizeLabel: activeSize.sizeLabel,
      unitPrice: product.basePrice,
      maxStock: activeSize.stockCount,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  const isComparing = compareSlugs.includes(product.slug);

  return (
    <div className="animate-atelier-in grid grid-cols-1 gap-10 lg:grid-cols-12">
      {/* Left Studio Photo / 3D Turnview Stage */}
      <div className="space-y-4 lg:col-span-7">
        <div
          className={`relative flex min-h-[430px] flex-col justify-between overflow-hidden rounded-3xl border p-5 shadow-md transition-colors duration-500 sm:min-h-[520px] sm:p-7 ${
            viewMode === 'turnview'
              ? 'border-[#2E261F] bg-gradient-to-b from-[#181310] via-[#110D0B] to-[#090706] text-[#F6F3EC]'
              : 'border-stone-900/10 bg-[#EFECE4] text-stone-900'
          }`}
        >
          {/* Top Viewer Controls */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <span
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
                viewMode === 'turnview'
                  ? 'border-[#C89D66]/45 bg-[#1C1612]/90 text-[#E5C79D]'
                  : 'border-stone-900/10 bg-white/90 text-stone-700'
              }`}
            >
              {viewMode === 'studio'
                ? 'Studio Angle'
                : '360° Interactive 3D Showroom · Drag to Orbit'}
            </span>

            <div
              className={`inline-flex rounded-full border p-1 ${
                viewMode === 'turnview'
                  ? 'border-white/15 bg-black/45'
                  : 'border-stone-900/10 bg-white/90'
              }`}
            >
              <button
                type="button"
                onClick={() => setViewMode('studio')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  viewMode === 'studio'
                    ? 'bg-[#18181B] text-[#F6F3EC] font-semibold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                Studio Photo
              </button>
              <button
                type="button"
                onClick={() => setViewMode('turnview')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  viewMode === 'turnview'
                    ? 'bg-[#C89D66] text-[#14110F] font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                3D Showroom
              </button>
            </div>
          </div>

          {/* Stage Display */}
          <div className="relative my-4 flex flex-1 items-center justify-center">
            {viewMode === 'turnview' ? (
              <div className="h-[340px] w-full sm:h-[420px]">
                <ShoeStage
                  mode="product-viewer"
                  primaryGlowHex={activeVariant?.primaryGlowHex || '#C89D66'}
                  secondaryAccentHex={
                    activeVariant?.secondaryAccentHex || '#8C4A27'
                  }
                  glbModelUrl={
                    activeVariant?.glbModelUrl || studioImage
                  }
                  silhouetteVariant={silhouette}
                  deconstructFactor={inspectScale}
                />
              </div>
            ) : (
              <div className="flex w-full items-center justify-center p-4">
                <img
                  src={studioImage}
                  alt={activeVariant?.altText || product.name}
                  style={{
                    transform: `scale(${1 + inspectScale * 0.22})`,
                  }}
                  className="max-h-[340px] w-auto object-contain drop-shadow-[0_24px_30px_rgba(24,24,27,0.18)] transition-transform duration-300"
                />
              </div>
            )}
          </div>

          {/* Close-Up Inspection Slider */}
          <div
            className={`relative z-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-4 py-3 backdrop-blur-sm ${
              viewMode === 'turnview'
                ? 'border-white/10 bg-black/50 text-[#F6F3EC]'
                : 'border-stone-900/10 bg-white/85 text-stone-800'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-[#C89D66]" />
              <span>
                {viewMode === 'turnview'
                  ? '3D Zoom & Stage Elevation'
                  : 'Inspect Stitching & Grain'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={inspectScale}
                aria-label="Inspect close-up details"
                onChange={(e) => setInspectScale(parseFloat(e.target.value))}
                className="w-32 accent-[#C89D66] sm:w-44"
              />
              <span
                className={`w-10 text-right font-mono text-[11px] tabular-nums ${
                  viewMode === 'turnview' ? 'text-zinc-300' : 'text-stone-600'
                }`}
              >
                {Math.round(inspectScale * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Finish Thumbnail Preview Strip */}
        {product.variants.length > 1 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {product.variants.map((variant) => {
              const selected = variant.id === activeVariant?.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    selected
                      ? 'border-[#18181B] bg-white shadow-sm'
                      : 'border-stone-900/10 bg-white/70 hover:border-stone-900/25'
                  }`}
                >
                  <SneakerStudioThumb
                    name={product.name}
                    category={product.category}
                    sku={variant.skuPrefix}
                    imageUrl={variant.posterImageUrl}
                    primaryGlowHex={variant.primaryGlowHex}
                    secondaryAccentHex={variant.secondaryAccentHex}
                    silhouette={silhouette}
                    compact
                    className="h-14 w-16 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-stone-900">
                      {variant.colorName}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-stone-500">
                      {variant.skuPrefix}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Purchase & Fit Column */}
      <div className="lg:col-span-5">
        <div className="sticky top-24 space-y-6 rounded-3xl border border-stone-900/10 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8C4A27]">
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-xs text-stone-700">
                <Star className="h-3.5 w-3.5 fill-[#8C4A27] text-[#8C4A27]" />
                <span className="font-semibold tabular-nums">
                  {product.ratingValue.toFixed(1)}
                </span>
                <span className="text-stone-400">
                  ({product.reviewCount} reviews)
                </span>
              </div>
            </div>

            <h1 className="mt-2 font-condensed text-4xl uppercase tracking-tight text-stone-900 sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              {product.tagline}
            </p>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-condensed text-4xl tabular-nums text-stone-900">
                ${product.basePrice}
              </span>
              <span className="text-xs text-stone-500">
                Free shipping over $150
              </span>
            </div>
          </div>

          <p className="border-t border-stone-900/10 pt-4 text-sm leading-relaxed text-stone-600">
            {product.description}
          </p>

          {/* Colorway Selection */}
          <div>
            <div className="mb-2.5 flex items-center justify-between text-xs">
              <span className="font-medium text-stone-500">Finish / Color</span>
              <span className="font-semibold text-stone-900">
                {activeVariant?.colorName}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant) => {
                const selected = variant.id === activeVariant?.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                      selected
                        ? 'border-[#18181B] bg-[#EFECE4] text-stone-900'
                        : 'border-stone-900/10 bg-white text-stone-600 hover:border-stone-900/30'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-stone-900/20"
                      style={{ backgroundColor: variant.primaryGlowHex }}
                    />
                    <span>{variant.colorName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <div className="mb-2.5 flex items-center justify-between text-xs">
              <span className="font-medium text-stone-500">Select Size</span>
              <Link
                href="/faq"
                className="font-medium text-[#8C4A27] underline-offset-4 hover:underline"
              >
                Sizing Help
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {activeVariant?.sizes.map((size) => {
                const out = size.stockCount <= 0;
                const selected = size.sku === selectedSizeSku;
                return (
                  <button
                    key={size.id}
                    type="button"
                    disabled={out}
                    onClick={() => setSelectedSizeSku(size.sku)}
                    className={`flex flex-col items-center justify-center rounded-xl border py-2.5 font-mono text-xs transition ${
                      out
                        ? 'cursor-not-allowed border-stone-900/5 bg-stone-100 text-stone-400 line-through'
                        : selected
                        ? 'border-[#18181B] bg-[#18181B] font-semibold text-[#F6F3EC]'
                        : 'border-stone-900/10 bg-[#F6F3EC] text-stone-800 hover:border-stone-900/35'
                    }`}
                  >
                    <span>{size.sizeLabel}</span>
                    {!out && size.stockCount <= 4 && (
                      <span
                        className={`mt-0.5 text-[9px] ${
                          selected ? 'text-[#EFECE4]' : 'text-[#8C4A27]'
                        }`}
                      >
                        {size.stockCount} left
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bag & Compare Buttons */}
          <div className="space-y-3 pt-2">
            {!authUser && (
              <div className="flex items-center gap-2 rounded-2xl border border-[#8C4A27]/20 bg-[#8C4A27]/5 px-4 py-2.5 text-xs text-stone-700">
                <Lock className="h-3.5 w-3.5 shrink-0 text-[#8C4A27]" />
                <span>
                  Sign in with your account to reserve your pair and check out.
                </span>
              </div>
            )}

            <button
              type="button"
              disabled={!activeSize || activeSize.stockCount <= 0}
              onClick={handleAddToBag}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#18181B] px-6 text-sm font-semibold text-[#F6F3EC] shadow-md transition hover:bg-[#8C4A27] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {addedFeedback ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Added to Shopping Bag</span>
                </>
              ) : !authUser ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Sign In to Order · ${product.basePrice}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  <span>Add to Shopping Bag · ${product.basePrice}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                toggleCompareSlug(product.slug);
                if (!isComparing) setIsCompareOpen(true);
              }}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-stone-900/15 bg-[#F6F3EC] px-4 text-xs font-semibold text-stone-800 transition hover:border-stone-900/35 hover:bg-[#EFECE4]"
            >
              <GitCompare className="h-3.5 w-3.5 text-[#8C4A27]" />
              <span>
                {isComparing ? 'Remove from Comparison' : 'Compare This Style'}
              </span>
            </button>
          </div>

          {/* Trust Footnote */}
          <div className="grid grid-cols-3 gap-2 border-t border-stone-900/10 pt-4 text-center text-[11px] text-stone-600">
            <div className="flex flex-col items-center gap-1">
              <Truck className="h-4 w-4 text-[#8C4A27]" />
              <span>Free Shipping $150+</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RefreshCw className="h-4 w-4 text-[#8C4A27]" />
              <span>30-Day Returns</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-[#8C4A27]" />
              <span>Inspected Pairs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
