'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSneakerStore } from '@/store/useSneakerStore';

/**
 * Subtle desktop cursor indicator that scales softly over interactive elements
 * and displays "Drag" over the interactive shoe stage.
 */
export function CustomCursor() {
  const cursorMode = useSneakerStore((s) => s.cursorMode);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [pointerMode, setPointerMode] = useState<'default' | 'pointer'>('default');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isTouch =
      window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || reduced) return;
    setEnabled(true);

    let targetX = -100;
    let targetY = -100;
    let curX = -100;
    let curY = -100;
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      const el = e.target as HTMLElement | null;
      const interactive = el?.closest(
        'a, button, input, select, [data-cursor="pointer"]'
      );
      setPointerMode(interactive ? 'pointer' : 'default');
    };

    const tick = () => {
      curX += (targetX - curX) * 0.22;
      curY += (targetY - curY) * 0.22;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%)`;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  if (!enabled) return null;

  const isDrag = cursorMode === 'drag';
  const isPointer = pointerMode === 'pointer' && !isDrag;

  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[80] will-change-transform"
    >
      <div
        className={`flex items-center justify-center rounded-full border transition-all duration-200 ${
          isDrag
            ? 'h-14 w-14 border-stone-900 bg-[#18181B] text-[#FAF8F4] shadow-lg'
            : isPointer
            ? 'h-10 w-10 border-[#8C4A27]/60 bg-[#8C4A27]/10'
            : 'h-5 w-5 border-stone-900/35 bg-transparent'
        }`}
      >
        {isDrag ? (
          <span className="text-[11px] font-semibold tracking-wider uppercase">
            Drag
          </span>
        ) : (
          <span
            className={`h-1.5 w-1.5 rounded-full transition-transform ${
              isPointer ? 'scale-125 bg-[#8C4A27]' : 'bg-stone-800/75'
            }`}
          />
        )}
      </div>
    </div>
  );
}
