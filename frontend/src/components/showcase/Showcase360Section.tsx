'use client';

import React, { useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand.config';
import { useSneakerStore } from '@/store/useSneakerStore';
import { sneakerScrollState } from '@/components/three/sneakerScrollState';

interface Showcase360SectionProps {
  spinDegrees: number;
}

/**
 * Section 2 — Closer Inspection: Smooth scroll-driven rotation with
 * tactile craft callouts appearing naturally around the shoe.
 */
export function Showcase360Section({ spinDegrees }: Showcase360SectionProps) {
  const setCursorMode = useSneakerStore((s) => s.setCursorMode);
  const dragStartRef = useRef<{ x: number; yaw: number } | null>(null);
  const [manualSpinCount, setManualSpinCount] = useState(0);

  const normalizedDeg = ((Math.round(spinDegrees) % 360) + 360) % 360;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = {
      x: e.clientX,
      yaw: sneakerScrollState.userDragYaw,
    };
    sneakerScrollState.isDragging = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    sneakerScrollState.userDragYaw = dragStartRef.current.yaw + dx * 0.012;
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
    sneakerScrollState.isDragging = false;
  };

  const handleMobileTapRotate = () => {
    sneakerScrollState.userDragYaw += Math.PI / 2;
    setManualSpinCount((c) => c + 1);
  };

  return (
    <section
      id="showcase-360"
      aria-label="360 Degree Shoe Inspection"
      className="relative min-h-[220vh]"
    >
      <div className="sticky top-0 flex h-screen flex-col justify-between overflow-hidden px-6 pb-10 pt-24 sm:px-10 lg:px-16">
        {/* Top Bar */}
        <div className="relative z-20 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8C4A27]">
              Design &amp; Profile
            </p>
            <h2 className="mt-1 font-serif text-4xl font-semibold tracking-tight text-stone-900 sm:text-6xl">
              Every Angle, Considered
            </h2>
          </div>

          <div className="rounded-2xl border border-stone-900/10 bg-white/85 px-4 py-2 text-right shadow-sm backdrop-blur-md">
            <span className="block text-[11px] font-medium text-stone-500">
              View Angle
            </span>
            <span className="font-mono text-xl font-bold tabular-nums text-stone-900">
              {String(normalizedDeg).padStart(3, '0')}°
            </span>
          </div>
        </div>

        {/* Interactive center drag zone */}
        <div
          onMouseEnter={() => setCursorMode('drag')}
          onMouseLeave={() => {
            setCursorMode('default');
            handlePointerUp();
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative z-20 my-auto h-[52vh] w-full cursor-grab active:cursor-grabbing touch-pan-y select-none"
          aria-label="Drag horizontally to turn shoe"
        >
          {BRAND_CONFIG.showcaseCallouts.map((callout) => {
            const [minDeg, maxDeg] = callout.rangeDeg;
            const isVisible =
              normalizedDeg >= minDeg && normalizedDeg <= maxDeg;
            const sideClass =
              callout.position === 'left'
                ? 'left-0 sm:left-4'
                : 'right-0 sm:right-4 text-right';

            return (
              <div
                key={callout.id}
                className={`pointer-events-none absolute top-1/2 max-w-xs -translate-y-1/2 rounded-2xl border border-stone-900/10 bg-white/90 p-5 shadow-lg backdrop-blur-xl transition-all duration-500 ${sideClass} ${
                  isVisible
                    ? 'translate-y-[-50%] scale-100 opacity-100'
                    : 'translate-y-[-36%] scale-95 opacity-0'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C4A27]">
                  {callout.badge}
                </span>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-stone-900">
                  {callout.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-stone-600">
                  {callout.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom Helper Bar */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {BRAND_CONFIG.showcaseCallouts.map((c) => {
              const [minDeg, maxDeg] = c.rangeDeg;
              const active = normalizedDeg >= minDeg && normalizedDeg <= maxDeg;
              return (
                <span
                  key={c.id}
                  className={`rounded-full border px-3.5 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-[#8C4A27] bg-[#8C4A27]/10 text-stone-900'
                      : 'border-stone-900/10 bg-white/75 text-stone-500'
                  }`}
                >
                  {c.title}
                </span>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleMobileTapRotate}
            className="inline-flex items-center gap-2 rounded-full border border-stone-900/15 bg-white/90 px-4 py-2 text-xs font-medium text-stone-800 shadow-sm md:hidden"
          >
            <RotateCw className="h-3.5 w-3.5 text-[#8C4A27]" />
            <span>Tap to Turn ({manualSpinCount})</span>
          </button>

          <p className="hidden text-xs font-medium text-stone-500 md:block">
            Drag sideways across the shoe to inspect · Keep scrolling
          </p>
        </div>
      </div>
    </section>
  );
}
