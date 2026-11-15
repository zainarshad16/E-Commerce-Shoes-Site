'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type DoorPhase = 'idle' | 'unlatching' | 'opening' | 'entering';

const DOOR_NAV_EVENT = 'atelier:door-navigate';

const PREFETCH_PRODUCT_ROUTES = [
  '/product/heritage-mocha-hightop',
  '/product/velocity-crimson-knit',
  '/product/crosby-navy-suede',
  '/product/camden-onyx-oxford',
  '/product/highland-chestnut-walker',
  '/product/tempo-cobalt-trainer',
  '/product/mercer-ivory-canvas',
];

/**
 * Triggers the fast single-door 3D showroom walkthrough from any product card or CTA
 * before entering `/product/[slug]`.
 */
export function openProductWithDoor(href: string, title?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(DOOR_NAV_EVENT, { detail: { href, title } })
  );
}

function formatSlugTitle(path: string): string {
  const clean = path.replace(/^\/product\//, '').split(/[?#]/)[0] || '';
  if (!clean) return 'Private Showroom';
  return clean
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function resolveShowroomShoeImage(path: string): string {
  const s = path.toLowerCase();
  if (s.includes('heritage') || s.includes('mocha')) {
    return '/images/shoes/espresso-hightop.png';
  }
  if (s.includes('velocity') || s.includes('crimson')) {
    return '/images/shoes/crimson-runner.png';
  }
  if (s.includes('crosby') || s.includes('suede') || s.includes('navy')) {
    return '/images/shoes/navy-suede.png';
  }
  if (s.includes('camden') || s.includes('oxford') || s.includes('black')) {
    return '/images/shoes/black-oxford.png';
  }
  if (s.includes('highland') || s.includes('walker') || s.includes('chestnut')) {
    return '/images/shoes/chestnut-walker.png';
  }
  if (s.includes('mercer') || s.includes('canvas') || s.includes('ivory')) {
    return '/images/shoes/ivory-canvas.png';
  }
  if (s.includes('tempo') || s.includes('cobalt') || s.includes('trainer')) {
    return '/images/shoes/cobalt-trainer.png';
  }
  return '/images/shoes/espresso-hightop.png';
}

/**
 * Single 3D Grey Architectural Door with Golden Round Arch & Corner Angles:
 * Clear, continuous 3-beat 1.68s walkthrough (with immediate parallel route push):
 * - t=0ms..340ms (`unlatching`): Closed grey & gold door stands clearly in view as lever unlatches
 * - t=340ms..1080ms (`opening`): Door leaf swings open (-112deg) revealing the lit 3D shoe pedestal
 * - t=1080ms..1680ms (`entering`): Camera walks forward through the open doorway into `/product/[slug]`
 */
export function AtelierDoorTransition() {
  const pathname = usePathname();
  const router = useRouter();

  const [phase, setPhase] = useState<DoorPhase>('idle');
  const [targetTitle, setTargetTitle] = useState<string>('Private Showroom');
  const [shoePreviewUrl, setShoePreviewUrl] = useState<string>(
    '/images/shoes/espresso-hightop.png'
  );

  const pathnameRef = useRef<string>(pathname);
  const inFlightRef = useRef<boolean>(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Pre-warm product routes so client navigation resolves instantaneously
  useEffect(() => {
    PREFETCH_PRODUCT_ROUTES.forEach((route) => {
      try {
        router.prefetch(route);
      } catch {
        // Ignore background prefetch errors
      }
    });
  }, [router]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const resetDoor = useCallback(() => {
    clearTimers();
    inFlightRef.current = false;
    setPhase('idle');
  }, [clearTimers]);

  const startDoorNavigation = useCallback(
    (hrefAttr: string, customTitle?: string) => {
      const cleanTarget = hrefAttr.split(/[?#]/)[0];
      if (!cleanTarget) return;
      if (inFlightRef.current) return;

      const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      if (reduced) {
        router.push(hrefAttr);
        return;
      }

      clearTimers();
      inFlightRef.current = true;
      setTargetTitle(customTitle || formatSlugTitle(hrefAttr));
      setShoePreviewUrl(resolveShowroomShoeImage(hrefAttr));
      setPhase('unlatching');

      // Kick off navigation immediately while the user watches the 3-beat door walkthrough
      router.push(hrefAttr);

      const tOpen = window.setTimeout(() => {
        if (!inFlightRef.current) return;
        setPhase('opening');
      }, 340);

      const tEnter = window.setTimeout(() => {
        if (!inFlightRef.current) return;
        setPhase('entering');
      }, 1080);

      const tDone = window.setTimeout(() => {
        inFlightRef.current = false;
        setPhase('idle');
      }, 1680);

      timersRef.current.push(tOpen, tEnter, tDone);
    },
    [clearTimers, router]
  );

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  useEffect(() => {
    const handleCustomDoorNav = (e: Event) => {
      const custom = e as CustomEvent<{ href?: string; title?: string }>;
      const href = custom.detail?.href;
      if (!href) return;
      startDoorNavigation(href, custom.detail?.title);
    };

    const handlePointerOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      const hrefAttr = anchor.getAttribute('href');
      if (hrefAttr && hrefAttr.startsWith('/product/')) {
        router.prefetch(hrefAttr);
      }
    };

    const handleDocumentClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;

      const hrefAttr = anchor.getAttribute('href');
      if (!hrefAttr || !hrefAttr.startsWith('/product/')) return;
      const cleanHref = hrefAttr.split(/[?#]/)[0];
      if (cleanHref === pathnameRef.current) return;

      e.preventDefault();
      startDoorNavigation(hrefAttr);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'idle') {
        resetDoor();
      }
    };

    window.addEventListener(DOOR_NAV_EVENT, handleCustomDoorNav);
    document.addEventListener('pointerover', handlePointerOver, { passive: true });
    document.addEventListener('click', handleDocumentClick, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener(DOOR_NAV_EVENT, handleCustomDoorNav);
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('click', handleDocumentClick, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [phase, resetDoor, router, startDoorNavigation]);

  const isIdle = phase === 'idle';
  const isUnlatching = phase === 'unlatching';
  const isOpening = phase === 'opening';
  const isEntering = phase === 'entering';

  const doorOpenAngle = isOpening || isEntering ? -112 : 0;

  // Distinct door stages: stand before door -> lean in as door swings -> walk straight through
  const corridorTransform = isEntering
    ? 'translate3d(0, 0, 780px) scale(2.85)'
    : isOpening
    ? 'translate3d(0, 0, 95px) scale(1.1)'
    : isUnlatching
    ? 'translate3d(0, 0, 22px) scale(1.03)'
    : 'translate3d(0, 0, 0px) scale(1)';

  return (
    <div
      onClick={resetDoor}
      aria-hidden="true"
      className={`fixed inset-0 z-[120] flex items-center justify-center overflow-hidden select-none will-change-[opacity] ${
        isIdle
          ? 'pointer-events-none invisible opacity-0'
          : isEntering
          ? 'pointer-events-auto visible opacity-0 transition-opacity duration-[280ms] delay-[280ms] ease-in'
          : 'pointer-events-auto visible opacity-100 transition-opacity duration-200 ease-out'
      }`}
      style={{
        perspective: '1400px',
        perspectiveOrigin: '50% 48%',
      }}
    >
      {/* Cool Architectural Slate-Grey Atelier Wall Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(72,77,89,0.92) 0%, rgba(30,33,40,0.98) 62%, #111318 100%)',
        }}
      />

      {/* 3D Golden Round-Arch Doorway & Walkthrough Chamber */}
      <div
        className="relative flex items-center justify-center will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transform: corridorTransform,
          transition: isIdle
            ? 'none'
            : isEntering
            ? 'transform 600ms cubic-bezier(0.32, 0, 0.2, 1)'
            : isOpening
            ? 'transform 720ms cubic-bezier(0.22, 1, 0.36, 1)'
            : 'transform 260ms ease-out',
        }}
      >
        {/* Metallic Golden Round-Arch Outer Frame with Rounded Corner Angles */}
        <div
          className="atelier-golden-arch-frame relative rounded-t-[200px] rounded-b-[28px] p-[9px]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Golden Crown Keystone */}
          <div className="pointer-events-none absolute -top-3.5 left-1/2 z-30 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#FAF0CA] bg-gradient-to-b from-[#F5E2A8] to-[#A67C23] shadow-lg">
            <span className="h-2.5 w-2.5 rounded-full bg-[#24272F]" />
          </div>

          {/* Bottom-Left & Bottom-Right Golden Rounded Angle Corner Brackets */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 h-6 w-6 rounded-bl-2xl border-b-2 border-l-2 border-[#FAF0CA]/85" />
          <div className="pointer-events-none absolute bottom-3 right-3 z-20 h-6 w-6 rounded-br-2xl border-b-2 border-r-2 border-[#FAF0CA]/85" />

          {/* Dark Slate Inner Casing Well */}
          <div
            className="relative h-[440px] w-[280px] rounded-t-[192px] rounded-b-[20px] border-4 border-[#22252D] bg-[#14171D] shadow-inner sm:h-[530px] sm:w-[346px]"
            style={{
              perspective: '1300px',
              perspectiveOrigin: '32% 50%',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* 3D Showroom Interior Behind the Grey Door */}
            <div className="relative h-full w-full overflow-hidden rounded-t-[188px] rounded-b-[16px] bg-gradient-to-b from-[#23262F] via-[#151820] to-[#0D0F14]">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 44%, rgba(240,213,138,0.26) 0%, rgba(118,125,143,0.14) 38%, rgba(13,15,20,0.92) 78%)',
                }}
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(21,24,32,0) 0%, rgba(26,29,38,0.92) 46%, #0D0F14 100%)',
                }}
              >
                <div
                  className="mx-auto mt-12 h-20 w-56 rounded-[100%] border border-[#D4AF37]/60 bg-[#D4AF37]/10 shadow-[0_0_40px_rgba(212,175,55,0.28)] sm:w-64"
                  style={{ transform: 'rotateX(70deg)' }}
                />
              </div>

              <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pb-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shoePreviewUrl}
                  alt={targetTitle}
                  className="h-44 w-auto object-contain drop-shadow-[0_24px_30px_rgba(0,0,0,0.85)] sm:h-52"
                />
                <p className="mt-4 text-center font-serif text-xl font-semibold italic text-[#FAF8F4] sm:text-2xl">
                  {targetTitle}
                </p>
              </div>
            </div>

            {/* Single Hinged Brushed Grey Door with Golden Round Arch & Round Angles */}
            <div
              className="atelier-door-panel absolute inset-0 rounded-t-[188px] rounded-b-[16px] border-2 border-[#D4AF37]/75 shadow-[14px_0_44px_rgba(0,0,0,0.8)] will-change-transform"
              style={{
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                transform: `rotateY(${doorOpenAngle}deg)`,
                transition: isIdle
                  ? 'none'
                  : 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {/* Left-Edge Golden Hinges */}
              <div className="pointer-events-none absolute top-36 -left-1.5 h-8 w-2 rounded-r-full bg-gradient-to-b from-[#FAF0CA] via-[#D4AF37] to-[#8A6619]" />
              <div className="pointer-events-none absolute top-[62%] -left-1.5 h-8 w-2 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#FAF0CA] via-[#D4AF37] to-[#8A6619]" />
              <div className="pointer-events-none absolute bottom-12 -left-1.5 h-8 w-2 rounded-r-full bg-gradient-to-b from-[#FAF0CA] via-[#D4AF37] to-[#8A6619]" />

              {/* Right-Edge Steel-Grey & Gold Thickness Slab */}
              <div
                className="pointer-events-none absolute inset-y-6 right-0 w-4 border-l border-[#D4AF37]/70 bg-gradient-to-b from-[#666C7A] via-[#454A56] to-[#2B2E36]"
                style={{
                  transformOrigin: 'right center',
                  transform: 'rotateY(90deg)',
                }}
              />

              {/* Upper Golden Round-Arch Panel & Lower Golden Round-Angle Panel */}
              <div className="pointer-events-none absolute inset-x-5 top-5 bottom-5 flex flex-col gap-3.5 sm:inset-x-6 sm:top-6 sm:bottom-6">
                <div className="relative flex flex-1 flex-col items-center justify-center rounded-t-[160px] rounded-b-[26px] border-2 border-[#D4AF37]/80 bg-black/20 px-4 pt-6 text-center shadow-[inset_0_0_24px_rgba(0,0,0,0.45)]">
                  <div className="pointer-events-none absolute inset-2.5 rounded-t-[150px] rounded-b-[18px] border border-[#F5E2A8]/35" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#F5E2A8]">
                    3D Showroom
                  </span>
                  <span className="mt-2 font-serif text-xl font-semibold italic leading-snug text-[#F8FAFC] sm:text-2xl">
                    {targetTitle}
                  </span>
                  <span className="mt-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                </div>

                <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#2D313A]">
                  <span className="h-2 w-2 rounded-full bg-[#F5E2A8]" />
                </div>

                <div className="relative h-[34%] rounded-[24px] border-2 border-[#D4AF37]/75 bg-black/25 shadow-[inset_0_0_24px_rgba(0,0,0,0.48)]">
                  <div className="pointer-events-none absolute inset-2.5 rounded-[16px] border border-[#F5E2A8]/30" />
                </div>
              </div>

              {/* Golden Round Escutcheon & Rotating Handle */}
              <div className="pointer-events-none absolute right-5 top-[56%] -translate-y-1/2 sm:right-6">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#FAF0CA]/75 bg-gradient-to-b from-[#F5E2A8] via-[#D4AF37] to-[#8C6417] shadow-lg">
                  <div
                    className="absolute right-4 h-2.5 w-11 origin-right rounded-full border border-[#FAF0CA]/45 bg-gradient-to-r from-[#FFF5D1] via-[#E2BD52] to-[#9A701C] shadow-xl"
                    style={{
                      transform: isUnlatching || isOpening || isEntering
                        ? 'rotateZ(-36deg)'
                        : 'rotateZ(0deg)',
                      transition: 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  />
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-6 bottom-0 h-3 rounded-t-xl bg-gradient-to-r from-[#8A6619] via-[#F5E2A8] to-[#8A6619] opacity-90" />
            </div>
          </div>

          <div className="mx-auto mt-1 h-2.5 w-[94%] rounded-b-xl bg-gradient-to-r from-[#2D3039] via-[#D4AF37]/80 to-[#2D3039]" />
        </div>
      </div>
    </div>
  );
}
