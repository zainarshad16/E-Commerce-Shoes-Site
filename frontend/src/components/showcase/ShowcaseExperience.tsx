'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BRAND_CONFIG } from '@/config/brand.config';
import { Sneaker } from '@/components/three/Sneaker';
import {
  resetSneakerScrollState,
  sneakerScrollState,
} from '@/components/three/sneakerScrollState';
import { getActiveVisualState, useSneakerStore } from '@/store/useSneakerStore';
import { Preloader } from './Preloader';
import { CustomCursor } from './CustomCursor';
import { SectionProgressDots } from './SectionProgressDots';
import { HeroSection } from './HeroSection';
import { Showcase360Section } from './Showcase360Section';
import { AnatomyExplodeSection } from './AnatomyExplodeSection';
import { ColorwaySwitcherSection } from './ColorwaySwitcherSection';
import { LineupSection } from './LineupSection';
import { ProductBuySection } from './ProductBuySection';
import { SocialProofSection } from './SocialProofSection';
import { FinalCtaSection } from './FinalCtaSection';

gsap.registerPlugin(ScrollTrigger);

/**
 * Orchestrates smooth Lenis + GSAP scroll choreography driving `<Sneaker />`
 * across all 8 editorial showcase sections.
 */
export function ShowcaseExperience() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  const [spinDegrees, setSpinDegrees] = useState(0);
  const [explodeProgress, setExplodeProgress] = useState(0);

  const storeState = useSneakerStore();
  const { colorway } = getActiveVisualState(storeState);
  const setActiveSection = useSneakerStore((s) => s.setActiveSection);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--glow-primary', colorway.accentHex);
    root.style.setProperty('--glow-secondary', colorway.secondaryHex);
  }, [colorway.accentHex, colorway.secondaryHex]);

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, { duration: 1.15 });
    } else {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    resetSneakerScrollState();

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const isMobile = window.innerWidth < 768;

    if (!prefersReducedMotion) {
      sneakerScrollState.heroDropOffsetY = 1.4;
      gsap.to(sneakerScrollState, {
        heroDropOffsetY: 0,
        duration: 1.2,
        ease: 'expo.out',
        delay: 0.1,
      });
    }

    let lenis: Lenis | null = null;
    let tickerFn: ((time: number) => void) | null = null;

    if (!prefersReducedMotion) {
      lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.4,
      });
      lenisRef.current = lenis;

      lenis.on('scroll', ScrollTrigger.update);
      tickerFn = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);
    }

    const ctx = gsap.context(() => {
      BRAND_CONFIG.sectionMeta.forEach((sec, index) => {
        const targetEl = document.getElementById(sec.id);
        if (!targetEl) return;
        ScrollTrigger.create({
          trigger: targetEl,
          start: 'top 52%',
          end: 'bottom 48%',
          onEnter: () => setActiveSection(index),
          onEnterBack: () => setActiveSection(index),
        });
      });

      if (prefersReducedMotion) return;

      gsap.to('.hero-parallax-word', {
        yPercent: -24,
        xPercent: -4,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      gsap.to(sneakerScrollState, {
        positionX: 0,
        positionY: 0.04,
        rotationX: 0.1,
        rotationY: -0.22,
        rotationZ: 0.08,
        scale: 1.16,
        ease: 'none',
        scrollTrigger: {
          trigger: '#showcase-360',
          start: 'top bottom',
          end: 'top top',
          scrub: 1,
        },
      });

      gsap.to(sneakerScrollState, {
        showcaseRotationY: Math.PI * 2,
        ease: 'none',
        scrollTrigger: {
          trigger: '#showcase-360',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          onUpdate: (self) => {
            setSpinDegrees(self.progress * 360);
          },
        },
      });

      const explodeProxy = { value: 0 };
      gsap
        .timeline({
          scrollTrigger: {
            trigger: '#anatomy',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
            onUpdate: () => {
              sneakerScrollState.explodeProgress = explodeProxy.value;
              setExplodeProgress(explodeProxy.value);
            },
          },
        })
        .to(explodeProxy, { value: 1, duration: 0.42, ease: 'power2.out' })
        .to(explodeProxy, { value: 1, duration: 0.2, ease: 'none' })
        .to(explodeProxy, { value: 0, duration: 0.38, ease: 'power2.inOut' });

      gsap.to(sneakerScrollState, {
        positionX: 0,
        positionY: 0,
        rotationX: 0.04,
        rotationY: 0.08,
        rotationZ: 0.02,
        scale: 1.04,
        ease: 'none',
        scrollTrigger: {
          trigger: '#anatomy',
          start: 'top bottom',
          end: 'top top',
          scrub: 1,
        },
      });

      gsap.to(sneakerScrollState, {
        positionX: 0,
        positionY: 0.12,
        rotationX: 0.08,
        rotationY: -0.22,
        rotationZ: 0.1,
        scale: 1.2,
        ease: 'none',
        scrollTrigger: {
          trigger: '#colorways',
          start: 'top bottom',
          end: 'center center',
          scrub: 1,
        },
      });

      gsap.to(sneakerScrollState, {
        positionX: 0,
        positionY: 0.58,
        positionZ: -0.9,
        rotationX: 0.14,
        rotationY: 0.22,
        rotationZ: -0.06,
        scale: 0.65,
        ease: 'none',
        scrollTrigger: {
          trigger: '#lineup',
          start: 'top bottom',
          end: 'center center',
          scrub: 1,
        },
      });

      gsap.to(sneakerScrollState, {
        positionX: isMobile ? 0 : -1.12,
        positionY: isMobile ? 0.55 : 0.04,
        positionZ: 0,
        rotationX: 0.06,
        rotationY: 0.2,
        rotationZ: 0.08,
        scale: isMobile ? 0.78 : 1.12,
        ease: 'none',
        scrollTrigger: {
          trigger: '#buy-panel',
          start: 'top bottom',
          end: 'center center',
          scrub: 1,
        },
      });

      gsap.to(sneakerScrollState, {
        positionX: isMobile ? 0 : 1.22,
        positionY: 0.35,
        positionZ: -0.5,
        rotationX: 0.08,
        rotationY: -0.3,
        rotationZ: -0.08,
        scale: 0.76,
        ease: 'none',
        scrollTrigger: {
          trigger: '#social-proof',
          start: 'top bottom',
          end: 'center center',
          scrub: 1,
        },
      });

      gsap.to(sneakerScrollState, {
        positionX: 0,
        positionY: 0.08,
        positionZ: 0,
        rotationX: 0.06,
        rotationY: -0.18,
        rotationZ: 0.16,
        scale: 1.2,
        ease: 'none',
        scrollTrigger: {
          trigger: '#final-cta',
          start: 'top bottom',
          end: 'center center',
          scrub: 1,
        },
      });
    }, wrapperRef);

    return () => {
      ctx.revert();
      if (tickerFn) gsap.ticker.remove(tickerFn);
      if (lenis) lenis.destroy();
      lenisRef.current = null;
    };
  }, [setActiveSection]);

  return (
    <div ref={wrapperRef} className="relative min-h-screen bg-[#F6F3EC] text-[#18181B]">
      <Preloader />
      <CustomCursor />

      {/* Warm Editorial Studio Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-700 ease-out"
        style={{ background: colorway.bgGradient }}
      />

      {/* Subtle Paper Linen Texture */}
      <div
        aria-hidden="true"
        className="film-grain pointer-events-none fixed inset-0 z-[15] opacity-40"
      />

      <Sneaker />

      <SectionProgressDots onNavigateSection={scrollToSection} />

      <div className="relative z-20">
        <HeroSection onScrollNext={() => scrollToSection('showcase-360')} />
        <Showcase360Section spinDegrees={spinDegrees} />
        <AnatomyExplodeSection explodeProgress={explodeProgress} />
        <ColorwaySwitcherSection />
        <LineupSection onSelectForBuy={() => scrollToSection('buy-panel')} />
        <ProductBuySection />
        <SocialProofSection />
        <FinalCtaSection onFindYourPair={() => scrollToSection('buy-panel')} />
      </div>
    </div>
  );
}
