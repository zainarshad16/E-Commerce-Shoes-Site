'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  ArrowUpRight,
  Rotate3d,
  X,
  ArrowDown,
  Lock,
  Sparkles,
} from 'lucide-react';
import type { Product } from '@/types/cms';
import { useStore } from '@/context/StoreContext';
import type { ShoeStageProps } from '@/components/three/ShoeStage';

const ShoeStage = dynamic<ShoeStageProps>(
  () => import('@/components/three/ShoeStage'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#CCFF00]/30 border-t-[#CCFF00]" />
          <span className="font-mono text-[10px] tracking-[0.22em] text-zinc-500">
            INITIALIZING 3D STUDIO LAMP ENGINE...
          </span>
        </div>
      </div>
    ),
  }
);

function resolveSilhouetteVariant(
  product: Product,
  glbModelUrl?: string
): 'runner' | 'high' | 'sculpt' | 'zero' {
  const src = `${product.slug} ${product.category} ${glbModelUrl || ''}`.toLowerCase();
  if (src.includes('vortex') || src.includes('high') || src.includes('monolith')) {
    return 'high';
  }
  if (src.includes('kinetix') || src.includes('sculpt') || src.includes('recovery')) {
    return 'sculpt';
  }
  if (src.includes('nebula') || src.includes('zero') || src.includes('cryo')) {
    return 'zero';
  }
  return 'runner';
}

interface Progressive3DHeroProps {
  initialProducts: Product[];
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  compactPreview?: boolean;
}

export function Progressive3DHero({
  initialProducts,
  eyebrow,
  headline,
  subheadline,
  primaryCtaText,
  primaryCtaHref,
  compactPreview = false,
}: Progressive3DHeroProps) {
  const router = useRouter();
  const {
    products,
    setActiveProductId,
    setActiveVariantId,
    setActiveGlowColors,
    addToCart,
    authUser,
  } = useStore();

  const liveProducts = products.length > 0 ? products : initialProducts;

  // Include ALL shoes across ALL categories in one single horizontal row sorted by displayOrder
  const allShoes = useMemo(() => {
    const published = liveProducts.filter((p) => p.published !== false);
    const base = published.length > 0 ? published : liveProducts;
    return [...base].sort(
      (a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99)
    );
  }, [liveProducts]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const p of allShoes) {
      if (p.category && !seen.has(p.category)) {
        seen.add(p.category);
        list.push(p.category);
      }
    }
    return list;
  }, [allShoes]);

  const BANNER_PHASE_END = 0.22;
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [carouselReveal, setCarouselReveal] = useState(
    compactPreview ? 1 : 0
  );
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<
    Record<string, number>
  >({});
  const [selectedSizeSku, setSelectedSizeSku] = useState<string>('');
  const [inspectedIndex, setInspectedIndex] = useState<number | null>(null);
  const [inspectProgress, setInspectProgress] = useState(0);
  const touchStartYRef = useRef<number | null>(null);
  const exitLockRef = useRef(false);

  const safeIndex = Math.min(
    activeProductIndex,
    Math.max(0, allShoes.length - 1)
  );
  const currentProduct = allShoes[safeIndex] || allShoes[0];
  const currentVariants = useMemo(
    () => currentProduct?.variants || [],
    [currentProduct]
  );
  const variantIdx =
    selectedVariantByProduct[currentProduct?.id || ''] ?? 0;
  const currentVariant =
    currentVariants[variantIdx] || currentVariants[0];

  const primaryGlow = currentVariant?.primaryGlowHex || '#CCFF00';
  const secondaryGlow = currentVariant?.secondaryAccentHex || '#10B981';

  // Sync dynamic colorway glow engine with StoreContext
  useEffect(() => {
    if (!currentProduct || !currentVariant) return;
    setActiveProductId(currentProduct.id);
    setActiveVariantId(currentVariant.id);
    setActiveGlowColors(
      currentVariant.primaryGlowHex,
      currentVariant.secondaryAccentHex
    );
  }, [
    currentProduct,
    currentVariant,
    setActiveProductId,
    setActiveVariantId,
    setActiveGlowColors,
  ]);

  // Select first available US size when product/variant changes
  useEffect(() => {
    const sizes = currentVariant?.sizes || [];
    const available = sizes.find((s) => s.stockCount > 0) || sizes[0];
    setSelectedSizeSku(available?.sku || '');
  }, [currentProduct?.id, currentVariant]);

  const scrollToShoeIndex = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(allShoes.length - 1, idx));
      setCarouselReveal(1);
      setScrollIndex(clamped);
      setActiveProductIndex(clamped);

      if (compactPreview || !trackRef.current || allShoes.length <= 1) return;
      const rect = trackRef.current.getBoundingClientRect();
      const docTop = window.scrollY + rect.top - 64;
      const scrollableDistance = Math.max(
        1,
        rect.height - (window.innerHeight - 64)
      );
      const stageProgress = clamped / (allShoes.length - 1);
      const targetProgress =
        BANNER_PHASE_END + stageProgress * (1 - BANNER_PHASE_END);
      window.scrollTo({
        top: Math.max(0, docTop + targetProgress * scrollableDistance),
        behavior: 'smooth',
      });
    },
    [allShoes.length, compactPreview]
  );

  const revealCarouselNow = useCallback(() => {
    setCarouselReveal(1);
    setScrollIndex(0);
    setActiveProductIndex(0);
    if (compactPreview || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const docTop = window.scrollY + rect.top - 64;
    const scrollableDistance = Math.max(
      1,
      rect.height - (window.innerHeight - 64)
    );
    window.scrollTo({
      top: Math.max(0, docTop + (BANNER_PHASE_END + 0.02) * scrollableDistance),
      behavior: 'smooth',
    });
  }, [compactPreview]);

  // Drive Starting Hero Banner -> Overhead Lamp Carousel transition from vertical scroll
  useEffect(() => {
    if (compactPreview || allShoes.length <= 1) return;

    const handleScroll = () => {
      if (inspectedIndex !== null) return;
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const maxScroll = Math.max(1, rect.height - (window.innerHeight - 64));
      const raw = Math.max(0, Math.min(1, (64 - rect.top) / maxScroll));

      const nextReveal =
        raw <= 0.04
          ? 0
          : Math.min(1, (raw - 0.04) / (BANNER_PHASE_END - 0.04));
      setCarouselReveal(nextReveal);

      const rowProgress = Math.max(
        0,
        Math.min(1, (raw - BANNER_PHASE_END) / (1 - BANNER_PHASE_END))
      );
      const nextFloatIndex = rowProgress * (allShoes.length - 1);
      setScrollIndex(nextFloatIndex);
      const nearest = Math.round(nextFloatIndex);
      setActiveProductIndex((prev) => (prev === nearest ? prev : nearest));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [allShoes.length, compactPreview, inspectedIndex]);

  const finishInspectionAndAdvance = useCallback(() => {
    if (exitLockRef.current) return;
    exitLockRef.current = true;
    setTimeout(() => {
      setInspectedIndex(null);
      setInspectProgress(0);
      exitLockRef.current = false;
      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  }, []);

  // Capture scroll wheel / touch swipe inside 360° 3D Inspection Mode to fill top progress bar -> exit to next section
  useEffect(() => {
    if (inspectedIndex === null || compactPreview) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setInspectProgress((prev) => {
        const delta = e.deltaY / 920;
        const next = Math.max(0, Math.min(1, prev + delta));
        if (next >= 1) {
          finishInspectionAndAdvance();
        }
        return next;
      });
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current === null) return;
      const currentY = e.touches[0]?.clientY ?? touchStartYRef.current;
      const dy = touchStartYRef.current - currentY;
      touchStartYRef.current = currentY;
      e.preventDefault();
      setInspectProgress((prev) => {
        const next = Math.max(0, Math.min(1, prev + dy / 620));
        if (next >= 1) {
          finishInspectionAndAdvance();
        }
        return next;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInspectedIndex(null);
        setInspectProgress(0);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [inspectedIndex, compactPreview, finishInspectionAndAdvance]);

  const handleInspectShoe = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(allShoes.length - 1, idx));
      setActiveProductIndex(clamped);
      setScrollIndex(clamped);
      setInspectedIndex(clamped);
      setInspectProgress(0);
    },
    [allShoes.length]
  );

  const carouselItems = useMemo(
    () =>
      allShoes.map((prod) => {
        const vIdx = selectedVariantByProduct[prod.id] ?? 0;
        const variant = prod.variants[vIdx] || prod.variants[0];
        return {
          id: prod.id,
          name: prod.name,
          primaryGlowHex: variant?.primaryGlowHex || '#CCFF00',
          secondaryAccentHex: variant?.secondaryAccentHex || '#10B981',
          glbModelUrl: variant?.glbModelUrl || '',
          silhouetteVariant: resolveSilhouetteVariant(prod, variant?.glbModelUrl),
        };
      }),
    [allShoes, selectedVariantByProduct]
  );

  const handleQuickBuy = () => {
    if (!authUser) {
      router.push('/login?redirect=/');
      return;
    }
    if (!currentProduct || !currentVariant) return;
    const sizeObj =
      currentVariant.sizes.find((s) => s.sku === selectedSizeSku) ||
      currentVariant.sizes[0];
    if (!sizeObj) return;
    addToCart({
      productId: currentProduct.id,
      productSlug: currentProduct.slug,
      productName: currentProduct.name,
      variantId: currentVariant.id,
      colorName: currentVariant.colorName,
      primaryGlowHex: currentVariant.primaryGlowHex,
      posterImageUrl:
        currentVariant.posterImageUrl || currentProduct.ogImageUrl,
      sizeSku: sizeObj.sku,
      sizeLabel: sizeObj.sizeLabel,
      unitPrice: Number(currentProduct.basePrice),
      maxStock: sizeObj.stockCount,
    });
  };

  if (!currentProduct || !currentVariant) return null;

  const isInspecting = inspectedIndex !== null;
  const effectiveReveal = isInspecting ? 1 : compactPreview ? 1 : carouselReveal;
  const bannerOpacity = isInspecting
    ? 0
    : Math.max(0, 1 - effectiveReveal * 1.45);
  const carouselUiOpacity = isInspecting
    ? 0
    : Math.max(0, Math.min(1, (effectiveReveal - 0.38) / 0.62));
  const trackVh = compactPreview
    ? undefined
    : `${Math.max(300, 150 + allShoes.length * 36)}vh`;

  return (
    <section
      ref={trackRef}
      aria-label="Interactive 3D Studio Lamp Sneaker Lineup"
      className={
        compactPreview
          ? 'relative overflow-hidden border-b border-white/10 bg-[#09090B]'
          : 'relative bg-[#09090B]'
      }
      style={trackVh ? { height: trackVh } : undefined}
    >
      <div
        className={
          compactPreview
            ? 'relative h-[560px] w-full overflow-hidden'
            : 'sticky top-16 h-[calc(100vh-4rem)] min-h-[600px] w-full overflow-hidden border-b border-white/10'
        }
      >
        {/* Top Progress Bar during 360° 3D Inspection Mode (scroll fills 0 -> 100%, then advances to #catalog-section) */}
        {isInspecting && (
          <div className="absolute inset-x-0 top-0 z-40 border-b border-white/15 bg-black/85 backdrop-blur-md">
            <div className="h-1.5 w-full bg-white/10">
              <div
                className="h-full transition-all duration-100"
                style={{
                  width: `${Math.round(inspectProgress * 100)}%`,
                  backgroundColor: primaryGlow,
                  boxShadow: `0 0 18px ${primaryGlow}`,
                }}
              />
            </div>
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-8">
              <div className="flex items-center gap-2.5">
                <Rotate3d
                  className="h-4 w-4 animate-pulse"
                  style={{ color: primaryGlow }}
                />
                <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-white">
                  360° 3D INSPECTOR • {currentProduct.name}
                </span>
                <span className="hidden font-mono text-[10px] text-zinc-400 md:inline">
                  DRAG TO ROTATE 360° • SCROLL TO COMPLETE &amp; JUMP TO CATALOG
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold"
                  style={{
                    borderColor: `${primaryGlow}66`,
                    color: primaryGlow,
                  }}
                >
                  {Math.round(inspectProgress * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setInspectedIndex(null);
                    setInspectProgress(0);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-[10px] font-bold text-white transition hover:bg-white/20"
                >
                  <X className="h-3.5 w-3.5" />
                  EXIT 3D
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overhead Lamp Ambient Pool + Volumetric Background Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 46% 62% at 50% 42%, ${primaryGlow}26 0%, #09090B 72%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[55%] w-[38%] -translate-x-1/2 opacity-35 blur-3xl"
          style={{
            background: `linear-gradient(180deg, rgba(255,250,235,0.45) 0%, ${primaryGlow}20 55%, transparent 100%)`,
          }}
        />

        {/* Starting Hero Banner Overlay (fades smoothly upward on scroll as Overhead Lamp Carousel reveals) */}
        {!isInspecting && bannerOpacity > 0.02 && (
          <div
            className="absolute inset-0 z-20 flex items-center transition-opacity duration-150"
            style={{
              opacity: bannerOpacity,
              transform: `translateY(${-(1 - bannerOpacity) * 32}px)`,
              pointerEvents: bannerOpacity > 0.4 ? 'auto' : 'none',
            }}
          >
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 sm:px-8 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3.5 py-1.5 backdrop-blur-md">
                  <span
                    className="h-2 w-2 animate-pulse rounded-full"
                    style={{
                      backgroundColor: primaryGlow,
                      boxShadow: `0 0 12px ${primaryGlow}`,
                    }}
                  />
                  <span
                    className="font-mono text-[10px] font-bold tracking-[0.22em]"
                    style={{ color: primaryGlow }}
                  >
                    {eyebrow}
                  </span>
                </div>

                <h1 className="mt-4 font-display text-4xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {headline}
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-300 sm:text-base">
                  {subheadline}
                </p>

                {/* Biomechanical Telemetry Stats */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-md">
                    <p
                      className="font-mono text-lg font-extrabold sm:text-xl"
                      style={{ color: primaryGlow }}
                    >
                      214G
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] tracking-widest text-zinc-400">
                      CARBON CHASSIS
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-md">
                    <p
                      className="font-mono text-lg font-extrabold sm:text-xl"
                      style={{ color: primaryGlow }}
                    >
                      84.6%
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] tracking-widest text-zinc-400">
                      ENERGY RETURN
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-md">
                    <p className="font-mono text-lg font-extrabold text-white sm:text-xl">
                      0{allShoes.length}
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] tracking-widest text-zinc-400">
                      3D SILHOUETTES
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={revealCarouselNow}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-mono text-xs font-extrabold tracking-widest text-black transition hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      backgroundColor: primaryGlow,
                      boxShadow: `0 0 28px ${primaryGlow}55`,
                    }}
                  >
                    <span>EXPLORE 3D SHOE CAROUSEL</span>
                    <ArrowDown className="h-4 w-4 animate-bounce" />
                  </button>
                  <Link
                    href={primaryCtaHref || '/shop'}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/65 px-5 py-3.5 font-mono text-xs font-bold tracking-wider text-white backdrop-blur-md transition hover:border-white/50"
                  >
                    <span>VIEW FULL CATALOG</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Right Column Floating 3D Spec Callouts */}
              <div className="pointer-events-none hidden lg:col-span-6 lg:flex lg:h-[380px] lg:flex-col lg:items-end lg:justify-between">
                <div className="rounded-2xl border border-white/15 bg-black/65 px-4 py-2.5 backdrop-blur-md">
                  <p className="font-mono text-[9px] tracking-[0.2em] text-zinc-400">
                    FLAGSHIP REAL-TIME .GLB
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-bold text-white">
                    {currentProduct.name} • 2.4MM CARBON SPINE
                  </p>
                </div>
                <div className="rounded-full border border-white/15 bg-black/70 px-4 py-2 font-mono text-[10px] tracking-widest text-zinc-300 backdrop-blur-md">
                  SCROLL DOWN ↓ TO REVEAL ALL {allShoes.length} SHOES UNDER STUDIO LAMP
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overhead Lamp Carousel Header Overlay (reveals smoothly once scrolled past Starting Banner) */}
        {!isInspecting && carouselUiOpacity > 0.02 && (
          <div
            className="pointer-events-none relative z-20 mx-auto flex max-w-7xl flex-col gap-3 px-4 pt-5 transition-opacity duration-150 sm:px-8 lg:flex-row lg:items-start lg:justify-between"
            style={{
              opacity: carouselUiOpacity,
              pointerEvents: carouselUiOpacity > 0.45 ? 'auto' : 'none',
            }}
          >
            <div className="max-w-xl">
              <p
                className="font-mono text-[10px] font-bold tracking-[0.22em]"
                style={{ color: primaryGlow }}
              >
                {eyebrow}
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                STUDIO LAMP 3D LINEUP
              </p>
              <p className="mt-1 max-w-md text-xs text-zinc-400 sm:text-sm">
                {subheadline}
              </p>
            </div>

            {/* Category Quick-Jump Pills + Instruction Hint */}
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <div className="flex flex-wrap items-center gap-1.5">
                {categories.map((cat) => {
                  const isActiveCat = currentProduct.category === cat;
                  const firstIdx = allShoes.findIndex(
                    (s) => s.category === cat
                  );
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => scrollToShoeIndex(firstIdx)}
                      className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition ${
                        isActiveCat
                          ? 'border-white bg-white text-black'
                          : 'border-white/15 bg-black/55 text-zinc-400 hover:border-white/40 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/65 px-3 py-1 font-mono text-[10px] tracking-widest text-zinc-300 backdrop-blur-md">
                <Sparkles className="h-3 w-3" style={{ color: primaryGlow }} />
                <span>
                  {String(safeIndex + 1).padStart(2, '0')}/
                  {String(allShoes.length).padStart(2, '0')} UNDER SPOTLIGHT •
                  SCROLL LINEUP OR CLICK ANY SHOE FOR 3D
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Full-Width 3D Stage (Transitions from Banner Centerpiece to Overhead Lamp Single-Row Carousel) */}
        <div className="absolute inset-0 z-10">
          <ShoeStage
            mode="hero-carousel"
            primaryGlowHex={primaryGlow}
            secondaryAccentHex={secondaryGlow}
            glbModelUrl={currentVariant.glbModelUrl}
            silhouetteVariant={resolveSilhouetteVariant(
              currentProduct,
              currentVariant.glbModelUrl
            )}
            carouselItems={carouselItems}
            activeCarouselIndex={safeIndex}
            scrollIndex={scrollIndex}
            carouselReveal={effectiveReveal}
            inspectedIndex={inspectedIndex}
            inspectScrollProgress={inspectProgress}
            onSelectCarouselIndex={(idx) => scrollToShoeIndex(idx)}
            onInspectCarouselIndex={handleInspectShoe}
          />
        </div>

        {/* Left / Right Manual Conveyor Navigation */}
        {!isInspecting && allShoes.length > 1 && carouselUiOpacity > 0.25 && (
          <>
            <button
              type="button"
              aria-label="Previous shoe in row"
              onClick={() =>
                scrollToShoeIndex(
                  safeIndex <= 0 ? allShoes.length - 1 : safeIndex - 1
                )
              }
              style={{ opacity: carouselUiOpacity }}
              className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/75 text-white backdrop-blur-md transition hover:border-white/50 sm:left-6"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next shoe in row"
              onClick={() =>
                scrollToShoeIndex((safeIndex + 1) % allShoes.length)
              }
              style={{ opacity: carouselUiOpacity }}
              className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/75 text-white backdrop-blur-md transition hover:border-white/50 sm:right-6"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Bottom Dock: Spotlighted Shoe Telemetry + Colorways + Inspect 3D + Auth-Gated Quick Buy */}
        {(isInspecting || carouselUiOpacity > 0.25) && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-4 z-30 mx-auto max-w-7xl px-4 transition-opacity duration-150 sm:px-8"
          style={{ opacity: isInspecting ? 1 : carouselUiOpacity }}
        >
          <div className="pointer-events-auto flex flex-col gap-3 rounded-2xl border border-white/15 bg-black/80 p-3.5 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
            {/* Spotlight Product Info + Colorway Switcher */}
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-black"
                    style={{ backgroundColor: primaryGlow }}
                  >
                    {currentProduct.category}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    SKU {currentVariant.skuPrefix}
                  </span>
                </div>
                <h2 className="mt-1 font-display text-base font-extrabold tracking-tight text-white sm:text-lg">
                  {currentProduct.name}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:border-l sm:border-white/10 sm:pl-3">
                {currentVariants.map((variant, vIdx) => {
                  const isActiveVar = variant.id === currentVariant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() =>
                        setSelectedVariantByProduct((prev) => ({
                          ...prev,
                          [currentProduct.id]: vIdx,
                        }))
                      }
                      title={variant.colorName}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] transition ${
                        isActiveVar
                          ? 'border-white/45 bg-white/15 text-white'
                          : 'border-white/10 bg-black/40 text-zinc-400 hover:border-white/30'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: variant.primaryGlowHex,
                          boxShadow: isActiveVar
                            ? `0 0 8px ${variant.primaryGlowHex}`
                            : 'none',
                        }}
                      />
                      <span className="hidden sm:inline">
                        {variant.colorName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Cluster */}
            <div className="flex flex-wrap items-center gap-2">
              {!isInspecting ? (
                <button
                  type="button"
                  onClick={() => handleInspectShoe(safeIndex)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 font-mono text-[11px] font-bold tracking-wider text-white transition hover:border-white/60 hover:bg-white/20"
                >
                  <Rotate3d className="h-3.5 w-3.5" style={{ color: primaryGlow }} />
                  <span>360° 3D MODEL</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setInspectProgress(1);
                    finishInspectionAndAdvance();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 font-mono text-[11px] font-bold tracking-wider text-white transition hover:border-white/60"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                  <span>SKIP TO CATALOG</span>
                </button>
              )}

              <select
                aria-label="Select US shoe size"
                value={selectedSizeSku}
                onChange={(e) => setSelectedSizeSku(e.target.value)}
                className="rounded-full border border-white/15 bg-black/70 px-3 py-2 font-mono text-xs text-white focus:border-white/40 focus:outline-none"
              >
                {currentVariant.sizes.map((s) => (
                  <option
                    key={s.sku}
                    value={s.sku}
                    disabled={s.stockCount === 0}
                  >
                    {s.sizeLabel}{' '}
                    {s.stockCount === 0
                      ? '(OUT)'
                      : `(${s.stockCount} left)`}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleQuickBuy}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-mono text-xs font-extrabold tracking-wider text-black transition hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: primaryGlow,
                  boxShadow: `0 0 22px ${primaryGlow}55`,
                }}
              >
                {authUser ? (
                  <ShoppingBag className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                <span>
                  {authUser ? 'QUICK BUY' : 'LOGIN TO BUY'} • $
                  {Number(currentProduct.basePrice).toFixed(0)}
                </span>
              </button>

              <Link
                href={`/product/${currentProduct.slug}`}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-2 font-mono text-[11px] text-zinc-200 transition hover:border-white/40 hover:text-white"
              >
                <span>SPECS</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>

              <Link
                href={primaryCtaHref || '/shop'}
                className="hidden items-center gap-1 rounded-full border border-white/15 px-3 py-2 font-mono text-[11px] text-zinc-400 transition hover:border-white/40 hover:text-white xl:inline-flex"
              >
                <span>{primaryCtaText || 'SHOP ALL'}</span>
              </Link>
            </div>
          </div>

          {/* Interactive Single-Row Shoe Selector Track */}
          {allShoes.length > 1 && !isInspecting && (
            <div className="pointer-events-auto mt-2 flex items-center justify-center gap-1.5 overflow-x-auto pb-0.5">
              {allShoes.map((shoe, idx) => {
                const isActive = idx === safeIndex;
                const shoeGlow =
                  shoe.variants[0]?.primaryGlowHex || '#CCFF00';
                return (
                  <button
                    key={shoe.id}
                    type="button"
                    onClick={() => scrollToShoeIndex(idx)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] transition ${
                      isActive
                        ? 'border-white/70 bg-white/15 text-white'
                        : 'border-white/10 bg-black/60 text-zinc-400 hover:border-white/30 hover:text-zinc-200'
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: shoeGlow }}
                    />
                    <span>{shoe.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        )}
      </div>
    </section>
  );
}
