'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Crosshair, Layers3 } from 'lucide-react';
import { Product } from '@/types/cms';
import { useStore } from '@/context/StoreContext';

const ShoeStage = dynamic(() => import('@/components/three/ShoeStage'), {
  ssr: false,
});

gsap.registerPlugin(ScrollTrigger);

export function ScrollytellingDeconstruct({
  product: initialProduct,
}: {
  product: Product;
}) {
  const { products, activeProductId, activeVariantId } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const activeProduct = useMemo(
    () =>
      products.find((p) => p.id === activeProductId) ||
      products.find((p) => p.id === initialProduct.id) ||
      initialProduct,
    [products, activeProductId, initialProduct]
  );

  const activeVariant = useMemo(
    () =>
      activeProduct.variants.find((v) => v.id === activeVariantId) ||
      activeProduct.variants[0],
    [activeProduct, activeVariantId]
  );

  const sortedHotspots = useMemo(
    () =>
      [...(activeProduct.hotspots || [])].sort(
        (a, b) => a.scrollPercentage - b.scrollPercentage
      ),
    [activeProduct.hotspots]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4,
      onUpdate: (self) => {
        setScrollProgress(self.progress);
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  const currentPct = Math.round(scrollProgress * 100);

  const activeHotspotIndex = useMemo(() => {
    if (sortedHotspots.length === 0) return -1;
    let bestIdx = 0;
    let minDiff = Infinity;
    sortedHotspots.forEach((hs, idx) => {
      const diff = Math.abs(hs.scrollPercentage - currentPct);
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }, [sortedHotspots, currentPct]);

  const activeHotspot =
    activeHotspotIndex >= 0 ? sortedHotspots[activeHotspotIndex] : null;

  return (
    <section
      ref={containerRef}
      aria-label="3D Architectural Deconstruction"
      className="relative min-h-[240vh] border-b border-white/10 bg-[#09090B]"
    >
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col justify-between overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        {/* Kinetic Background Watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none">
          <p
            className="whitespace-nowrap font-display text-[15vw] font-black tracking-tighter text-white/[0.03] transition-transform duration-300"
            style={{
              transform: `translateX(${(0.5 - scrollProgress) * 18}%)`,
            }}
          >
            {activeProduct.name}
          </p>
        </div>

        {/* Top Telemetry Bar */}
        <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between">
          <div>
            <p className="font-mono text-[11px] tracking-widest text-zinc-400">
              CMS-DRIVEN 3D DECONSTRUCTION
            </p>
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              {activeProduct.name} — CHASSIS ANATOMY
            </h2>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/60 px-4 py-2 backdrop-blur-md">
            <Layers3
              className="h-4 w-4"
              style={{ color: activeVariant.primaryGlowHex }}
            />
            <span className="font-mono text-xs text-white">
              EXPLOSION: {currentPct}%
            </span>
          </div>
        </div>

        {/* Center 3D Deconstruction Canvas + CMS Callout Overlay */}
        <div className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-6 lg:grid-cols-12">
          {/* 3D Canvas */}
          <div className="relative h-[46vh] w-full lg:col-span-8 lg:h-[64vh]">
            <ShoeStage
              mode="scrollytelling"
              primaryGlowHex={activeVariant.primaryGlowHex}
              secondaryAccentHex={activeVariant.secondaryAccentHex}
              glbModelUrl={activeVariant.glbModelUrl}
              hotspots={sortedHotspots}
              scrollProgress={scrollProgress}
            />
          </div>

          {/* Glassmorphic CMS Hotspot Callout Cards */}
          <div className="space-y-3 lg:col-span-4">
            {sortedHotspots.map((hs, idx) => {
              const isActive = idx === activeHotspotIndex;
              return (
                <button
                  key={hs.id}
                  type="button"
                  onClick={() => setScrollProgress(hs.scrollPercentage / 100)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                    isActive
                      ? 'glass-panel glow-border scale-[1.02]'
                      : 'border-white/10 bg-white/[0.02] opacity-55 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest"
                      style={{
                        color: isActive
                          ? activeVariant.primaryGlowHex
                          : '#a1a1aa',
                      }}
                    >
                      <Crosshair className="h-3 w-3" />
                      SCROLL {hs.scrollPercentage}%
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      CAM ({hs.cameraPosition.x}, {hs.cameraPosition.y},{' '}
                      {hs.cameraPosition.z})
                    </span>
                  </div>
                  <h3 className="mt-1.5 font-display text-base font-bold text-white">
                    {hs.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    {hs.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Progress Rail */}
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full transition-all duration-150"
              style={{
                width: `${Math.max(4, currentPct)}%`,
                backgroundColor: activeVariant.primaryGlowHex,
                boxShadow: `0 0 18px ${activeVariant.primaryGlowHex}`,
              }}
            />
          </div>
          {activeHotspot && (
            <p className="mt-2 font-mono text-[11px] text-zinc-400">
              ACTIVE HOTSPOT: <span className="text-white">{activeHotspot.title}</span> —
              Configure camera coordinates visually inside <span className="text-white">/admin</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

