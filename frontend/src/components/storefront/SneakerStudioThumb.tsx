'use client';

import React from 'react';

interface SneakerStudioThumbProps {
  name: string;
  category?: string;
  sku?: string;
  imageUrl?: string;
  primaryGlowHex?: string;
  secondaryAccentHex?: string;
  silhouette?: 'runner' | 'high' | 'sculpt' | 'zero';
  compact?: boolean;
  className?: string;
}

export function resolveSilhouetteFromText(
  text: string
): 'runner' | 'high' | 'sculpt' | 'zero' {
  const s = text.toLowerCase();
  if (s.includes('mocha') || s.includes('espresso') || s.includes('camden')) {
    return 'high';
  }
  if (s.includes('ivory') || s.includes('mercer') || s.includes('court')) {
    return 'sculpt';
  }
  if (s.includes('navy') || s.includes('crosby') || s.includes('suede')) {
    return 'zero';
  }
  return 'runner';
}

export function resolveOriginalShoeImage(
  name: string,
  sku?: string,
  category?: string
): string {
  const s = `${name} ${sku || ''} ${category || ''}`.toLowerCase();
  if (
    s.includes('espresso') ||
    s.includes('mocha') ||
    s.includes('av-mht') ||
    s.includes('a01')
  ) {
    return '/images/shoes/espresso-hightop.png';
  }
  if (
    s.includes('crimson') ||
    s.includes('velocity') ||
    s.includes('av-vkr') ||
    s.includes('kv2')
  ) {
    return '/images/shoes/crimson-runner.png';
  }
  if (
    s.includes('navy') ||
    s.includes('crosby') ||
    s.includes('suede') ||
    s.includes('av-cns') ||
    s.includes('nb0')
  ) {
    return '/images/shoes/navy-suede.png';
  }
  if (
    s.includes('oxford') ||
    s.includes('camden') ||
    s.includes('black') ||
    s.includes('av-cco') ||
    s.includes('formal')
  ) {
    return '/images/shoes/black-oxford.png';
  }
  if (
    s.includes('chestnut') ||
    s.includes('highland') ||
    s.includes('walker') ||
    s.includes('av-hlw') ||
    s.includes('heritage')
  ) {
    return '/images/shoes/chestnut-walker.png';
  }
  if (
    s.includes('ivory') ||
    s.includes('mercer') ||
    s.includes('canvas') ||
    s.includes('av-mcl') ||
    s.includes('court')
  ) {
    return '/images/shoes/ivory-canvas.png';
  }
  if (s.includes('cobalt') || s.includes('tempo') || s.includes('av-trt')) {
    return '/images/shoes/cobalt-trainer.png';
  }
  return '/images/shoes/espresso-hightop.png';
}

export function SneakerStudioThumb({
  name,
  category,
  sku,
  imageUrl,
  primaryGlowHex = '#8C4A27',
  secondaryAccentHex = '#5E3A24',
  compact = false,
  className = '',
}: SneakerStudioThumbProps) {
  const resolvedSrc = imageUrl || resolveOriginalShoeImage(name, sku, category);

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-[#EFECE4] select-none ${className}`}
      aria-label={`${name} studio photograph`}
    >
      {/* Subtle Warm Studio Paper Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 74% 66% at 50% 45%, #FAF8F4 0%, ${primaryGlowHex}10 55%, ${secondaryAccentHex}0A 100%)`,
        }}
      />

      {/* Natural Soft Contact Shadow on Studio Surface */}
      {!compact && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-4 left-1/2 h-3.5 w-[64%] -translate-x-1/2 rounded-[100%] bg-stone-900/15 blur-md"
        />
      )}

      {/* Real Uploaded Original Shoe Photograph */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={name}
        loading="lazy"
        className={`relative z-10 object-contain drop-shadow-[0_14px_20px_rgba(28,25,23,0.18)] transition-transform duration-500 group-hover:scale-105 ${
          compact ? 'h-[86%] w-[86%]' : 'h-[82%] w-[82%]'
        }`}
      />
    </div>
  );
}
