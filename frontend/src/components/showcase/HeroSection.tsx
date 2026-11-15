'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ArrowDown, ArrowUpRight, BookOpen } from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand.config';
import { useStore } from '@/context/StoreContext';
import { getActiveVisualState, useSneakerStore } from '@/store/useSneakerStore';
import { openProductWithDoor } from '@/components/storefront/AtelierDoorTransition';

interface HeroSectionProps {
  onScrollNext: () => void;
}

function splitHeadlineLines(raw: string): string[] {
  const cleaned = (raw.trim() || BRAND_CONFIG.hero.headlineLines.join(' ').trim());
  if (!cleaned) return [];
  if (cleaned.includes('\n')) {
    return cleaned
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  }
  const words = cleaned.split(/\s+/);
  if (words.length <= 2) return [cleaned];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

/**
 * Section 1 — Hero: Live-synced with Admin CMS `HERO_CONFIG` and `products` catalog,
 * featuring gentle line-by-line typography reveal and 3D Door showroom launch.
 */
export function HeroSection({ onScrollNext }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const bgWordRef = useRef<HTMLDivElement | null>(null);
  const storeState = useSneakerStore();
  const { product, colorway } = getActiveVisualState(storeState);
  const { products: cmsProducts, pageSections } = useStore();

  const heroSection = useMemo(
    () => pageSections.find((s) => s.sectionType === 'HERO_CONFIG'),
    [pageSections]
  );

  const heroContent = (heroSection?.contentJson || {}) as {
    eyebrow?: string;
    headline?: string;
    subheadline?: string;
    primaryCtaText?: string;
    primaryCtaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
  };

  const eyebrow =
    heroContent.eyebrow?.trim() || BRAND_CONFIG.hero.eyebrow;
  const headlineLines = useMemo(
    () =>
      splitHeadlineLines(
        heroContent.headline?.trim() || BRAND_CONFIG.hero.headlineLines.join(' ')
      ),
    [heroContent.headline]
  );
  const subheadline =
    heroContent.subheadline?.trim() || BRAND_CONFIG.hero.subhead;
  const primaryCtaText = heroContent.primaryCtaText?.trim() || 'Shop Collection';
  const primaryCtaHref = heroContent.primaryCtaHref?.trim() || '/shop';
  const secondaryCtaText = heroContent.secondaryCtaText?.trim() || 'Read Journal';
  const secondaryCtaHref =
    heroContent.secondaryCtaHref?.trim() && heroContent.secondaryCtaHref !== '/admin'
      ? heroContent.secondaryCtaHref
      : '/blog';

  const featuredCmsProduct = useMemo(() => {
    return (
      cmsProducts.find(
        (p) => p.slug === product.slug || p.id === product.id
      ) ||
      cmsProducts.find((p) => p.isFeaturedHero) ||
      cmsProducts[0]
    );
  }, [cmsProducts, product.slug, product.id]);

  const activeName = featuredCmsProduct?.name || product.name;
  const activeSlug = featuredCmsProduct?.slug || product.slug;
  const activeVariant =
    featuredCmsProduct?.variants?.find((v) =>
      v.colorName.toLowerCase().includes(colorway.name.toLowerCase())
    ) || featuredCmsProduct?.variants?.[0];
  const activeColorName = activeVariant?.colorName || colorway.name;
  const activeAccentHex = activeVariant?.primaryGlowHex || colorway.accentHex;

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.hero-line-inner', {
        yPercent: 105,
        duration: 0.85,
        stagger: 0.08,
        ease: 'expo.out',
        delay: 0.15,
      });
      gsap.from('.hero-fade-in', {
        opacity: 0,
        y: 16,
        duration: 0.75,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.3,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (heroSection?.isVisible === false) {
    return null;
  }

  return (
    <section
      id="hero"
      ref={sectionRef}
      aria-label="Hero Showcase"
      className="relative flex min-h-screen flex-col justify-between overflow-hidden px-6 pb-10 pt-24 sm:px-10 lg:px-16"
    >
      {/* Subtle Studio Backdrop Watermark */}
      <div
        ref={bgWordRef}
        aria-hidden="true"
        className="hero-parallax-word pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 select-none text-center"
      >
        <span
          className="font-serif block whitespace-nowrap text-[clamp(8rem,24vw,24rem)] font-bold uppercase leading-none tracking-tight text-transparent opacity-100"
          style={{
            WebkitTextStroke: '1.5px rgba(24,24,27,0.06)',
          }}
        >
          {BRAND_CONFIG.shortName}
        </span>
      </div>

      {/* Top row: seasonal note + currently featured shoe */}
      <div className="hero-fade-in relative z-20 flex flex-wrap items-center justify-between gap-4 pt-2">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-600">
          {eyebrow}
        </p>
        <button
          type="button"
          onClick={() =>
            openProductWithDoor(`/product/${activeSlug}`, activeName)
          }
          className="group flex items-center gap-2.5 rounded-full border border-stone-900/10 bg-white/85 px-4 py-1.5 shadow-sm backdrop-blur-md transition hover:border-[#8C4A27]/50 hover:bg-white"
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: activeAccentHex }}
          />
          <span className="text-xs font-medium text-stone-800">
            {activeName} · {activeColorName}
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 text-[#8C4A27] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>

      {/* Center Display Headline */}
      <div className="pointer-events-none relative z-20 my-auto flex flex-col items-center text-center">
        <h1
          className="mt-6 max-w-4xl font-condensed uppercase leading-[0.88] tracking-tight text-stone-900 drop-shadow-[0_1px_16px_rgba(246,243,236,0.9)]"
          style={{ fontSize: 'clamp(2.25rem, 11vw, 5rem)' }}
        >
          {headlineLines.map((line, idx) => (
            <span key={`${idx}-${line}`} className="block overflow-hidden py-0.5">
              <span className="hero-line-inner block leading-[0.88]">
                {line}
              </span>
            </span>
          ))}
        </h1>
      </div>

      {/* Bottom Bar: honest copy + clean CTAs */}
      <div className="hero-fade-in relative z-20 flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end">
        <p className="max-w-md rounded-2xl border border-stone-900/10 bg-white/80 px-4 py-3 text-sm leading-relaxed text-stone-700 shadow-sm backdrop-blur-md">
          {subheadline}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={primaryCtaHref}
            className="btn-atelier inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold shadow-sm"
          >
            <span>{primaryCtaText}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>

          <Link
            href={secondaryCtaHref}
            className="inline-flex items-center gap-2 rounded-full border border-stone-900/15 bg-white/90 px-5 py-3 text-xs font-semibold text-stone-800 shadow-sm backdrop-blur-md transition hover:border-stone-900/40"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#8C4A27]" />
            <span>{secondaryCtaText}</span>
          </Link>

          <button
            type="button"
            onClick={onScrollNext}
            className="group flex items-center gap-2.5 rounded-full border border-stone-900/15 bg-white/90 px-4 py-2 text-xs font-semibold text-stone-900 shadow-sm backdrop-blur-md transition hover:border-stone-900/40"
          >
            <span>{BRAND_CONFIG.hero.scrollCueLabel}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#18181B] text-[#FAF8F4] transition-transform group-hover:translate-y-0.5">
              <ArrowDown className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
