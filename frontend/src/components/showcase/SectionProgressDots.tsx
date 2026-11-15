'use client';

import React from 'react';
import { BRAND_CONFIG } from '@/config/brand.config';
import { useSneakerStore } from '@/store/useSneakerStore';

interface SectionProgressDotsProps {
  onNavigateSection: (sectionId: string) => void;
}

/**
 * Right-edge section index navigation across the 8 showcase sections.
 */
export function SectionProgressDots({
  onNavigateSection,
}: SectionProgressDotsProps) {
  const activeSection = useSneakerStore((s) => s.activeSection);

  return (
    <nav
      aria-label="Section Progress Navigation"
      className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 sm:right-6 md:flex"
    >
      {BRAND_CONFIG.sectionMeta.map((sec, idx) => {
        const isActive = activeSection === idx;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => onNavigateSection(sec.id)}
            aria-label={`Jump to ${sec.label}`}
            className="group flex items-center gap-3 py-0.5 focus:outline-none"
          >
            <span
              className={`rounded-full border border-stone-900/10 px-2.5 py-0.5 text-[11px] font-medium transition-all duration-200 ${
                isActive
                  ? 'translate-x-0 bg-white/95 text-stone-900 shadow-sm opacity-100'
                  : 'translate-x-2 bg-white/80 text-stone-600 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
              }`}
            >
              {sec.label}
            </span>
            <span
              className={`block rounded-full transition-all duration-300 ${
                isActive
                  ? 'h-5 w-1.5 bg-[#8C4A27]'
                  : 'h-2 w-2 bg-stone-900/20 group-hover:scale-125 group-hover:bg-stone-900/55'
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
