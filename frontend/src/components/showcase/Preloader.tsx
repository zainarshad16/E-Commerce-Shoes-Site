'use client';

import React, { useEffect, useState } from 'react';
import { BRAND_CONFIG } from '@/config/brand.config';
import { useSneakerStore } from '@/store/useSneakerStore';

/**
 * Subtle studio preloader displayed briefly while product imagery finishes initializing.
 */
export function Preloader() {
  const loadProgress = useSneakerStore((s) => s.loadProgress);
  const isLoaded = useSneakerStore((s) => s.isLoaded);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      const t = window.setTimeout(() => setDismissed(true), 360);
      return () => window.clearTimeout(t);
    }
  }, [isLoaded]);

  if (dismissed) return null;

  return (
    <div
      aria-label="Loading Footwear Storefront"
      className={`fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#F6F3EC] transition-opacity duration-500 ${
        isLoaded ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-stone-800">
          {BRAND_CONFIG.name}
        </span>

        <p className="font-condensed text-5xl uppercase tracking-tight text-stone-900 sm:text-6xl tabular-nums">
          {loadProgress}%
        </p>

        <div className="h-[2px] w-48 overflow-hidden rounded-full bg-stone-900/10">
          <div
            className="h-full bg-[#8C4A27] transition-all duration-200"
            style={{ width: `${loadProgress}%` }}
          />
        </div>

        <p className="text-xs text-stone-500">
          Preparing seasonal footwear collection...
        </p>
      </div>
    </div>
  );
}
