'use client';

import React, { useEffect, useRef } from 'react';
import { BRAND_CONFIG } from '@/config/brand.config';
import { sneakerScrollState } from '@/components/three/sneakerScrollState';

interface AnatomyExplodeSectionProps {
  explodeProgress: number;
}

/**
 * Section 3 — Materials & Construction:
 * Zooms cleanly onto the intact studio photograph while subtle pointer lines
 * and warm craft cards explain each part of the shoe's build.
 */
export function AnatomyExplodeSection({
  explodeProgress,
}: AnatomyExplodeSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const lineRefs = useRef<Record<string, SVGLineElement | null>>({});
  const dotRefs = useRef<Record<string, SVGCircleElement | null>>({});

  useEffect(() => {
    let rafId = 0;

    const updateLeaderLines = () => {
      for (const part of BRAND_CONFIG.anatomyParts) {
        const anchor = sneakerScrollState.projectedAnchors[part.meshName];
        const line = lineRefs.current[part.meshName];
        const dot = dotRefs.current[part.meshName];
        if (!anchor || !line || !dot) continue;

        const targetX = part.cardPosition.side === 'left' ? 24 : 76;
        const targetY = part.cardPosition.topPct;

        line.setAttribute('x1', `${anchor.xPct}%`);
        line.setAttribute('y1', `${anchor.yPct}%`);
        line.setAttribute('x2', `${targetX}%`);
        line.setAttribute('y2', `${targetY}%`);

        dot.setAttribute('cx', `${anchor.xPct}%`);
        dot.setAttribute('cy', `${anchor.yPct}%`);
      }
      rafId = window.requestAnimationFrame(updateLeaderLines);
    };

    if (explodeProgress > 0.04) {
      rafId = window.requestAnimationFrame(updateLeaderLines);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [explodeProgress]);

  const showLabels = explodeProgress > 0.14;

  return (
    <section
      id="anatomy"
      ref={sectionRef}
      aria-label="Materials and Construction Details"
      className="relative min-h-[220vh]"
    >
      <div className="sticky top-0 flex h-screen flex-col justify-between overflow-hidden px-6 pb-10 pt-24 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="relative z-20 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8C4A27]">
              Craft &amp; Materials
            </p>
            <h2 className="mt-1 font-serif text-4xl font-semibold tracking-tight text-stone-900 sm:text-6xl">
              Built Layer by Layer
            </h2>
          </div>

          <div className="rounded-full border border-stone-900/10 bg-white/85 px-4 py-1.5 text-xs font-medium text-stone-700 shadow-sm backdrop-blur-md">
            6 Craft Details Highlighted
          </div>
        </div>

        {/* Clean Subtle Pointer Lines Anchored to Intact Shoe */}
        <svg
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-10 hidden h-full w-full transition-opacity duration-300 md:block ${
            showLabels ? 'opacity-85' : 'opacity-0'
          }`}
        >
          {BRAND_CONFIG.anatomyParts.map((part) => (
            <g key={part.meshName}>
              <line
                ref={(el) => {
                  lineRefs.current[part.meshName] = el;
                }}
                x1="50%"
                y1="50%"
                x2={part.cardPosition.side === 'left' ? '24%' : '76%'}
                y2={`${part.cardPosition.topPct}%`}
                stroke="rgba(140, 74, 39, 0.42)"
                strokeWidth="1.25"
              />
              <circle
                ref={(el) => {
                  dotRefs.current[part.meshName] = el;
                }}
                cx="50%"
                cy="50%"
                r="4"
                fill="#8C4A27"
                stroke="#FAF8F4"
                strokeWidth="1.5"
              />
            </g>
          ))}
        </svg>

        {/* Desktop Craft Callout Cards */}
        <div className="pointer-events-none relative z-20 my-auto hidden h-[64vh] w-full md:block">
          {BRAND_CONFIG.anatomyParts.map((part, idx) => {
            const isLeft = part.cardPosition.side === 'left';
            return (
              <div
                key={part.meshName}
                style={{ top: `${part.cardPosition.topPct}%` }}
                className={`absolute w-64 -translate-y-1/2 rounded-2xl border border-stone-900/10 bg-white/92 p-4 shadow-md backdrop-blur-md transition-all duration-500 ${
                  isLeft ? 'left-0' : 'right-0 text-right'
                } ${
                  showLabels
                    ? 'translate-y-[-50%] scale-100 opacity-100'
                    : 'translate-y-[-35%] scale-95 opacity-0'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C4A27]">
                  0{idx + 1} · {part.material}
                </span>
                <h3 className="mt-0.5 text-base font-bold text-stone-900">
                  {part.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  {part.benefit}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mobile Compact Stack */}
        <div className="relative z-20 my-auto grid grid-cols-1 gap-2.5 md:hidden">
          {BRAND_CONFIG.anatomyParts.slice(0, 4).map((part) => (
            <div
              key={part.meshName}
              className="rounded-xl border border-stone-900/10 bg-white/90 px-3.5 py-2.5 shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-stone-900">
                  {part.title}
                </span>
                <span className="text-[11px] font-medium text-[#8C4A27]">
                  {part.material}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-stone-600">{part.benefit}</p>
            </div>
          ))}
        </div>

        <div className="relative z-20 flex items-center justify-between text-xs font-medium text-stone-500">
          <span>Full-grain leather, organic cotton twill &amp; cushioned support</span>
          <span>Keep scrolling to compare styles</span>
        </div>
      </div>
    </section>
  );
}
