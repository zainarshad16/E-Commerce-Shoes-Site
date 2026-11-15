'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star } from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand.config';

gsap.registerPlugin(ScrollTrigger);

/**
 * Editorial customer reviews & milestone band with subtle count-up metrics.
 */
export function SocialProofSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [counts, setCounts] = useState<number[]>(() =>
    BRAND_CONFIG.socialProof.stats.map(() => 0)
  );

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setCounts(BRAND_CONFIG.socialProof.stats.map((s) => s.target));
      return;
    }

    const ctx = gsap.context(() => {
      const proxy = { progress: 0 };
      gsap.to(proxy, {
        progress: 1,
        duration: 1.5,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 78%',
          once: true,
        },
        onUpdate: () => {
          setCounts(
            BRAND_CONFIG.socialProof.stats.map((s) =>
              Math.round(s.target * proxy.progress)
            )
          );
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="social-proof"
      ref={sectionRef}
      aria-labelledby="social-proof-heading"
      className="relative z-20 flex min-h-screen items-center border-y border-stone-900/10 bg-[#EFECE4]/90 py-24 backdrop-blur-sm"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="mb-14 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8C4A27]">
              Community & Wear Notes
            </p>
            <h2
              id="social-proof-heading"
              className="mt-2 font-serif text-5xl font-semibold tracking-tight text-stone-900 sm:text-6xl"
            >
              Worn &amp; Loved Everywhere
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-stone-600">
            Real feedback from commuters, travellers, and studio creatives who
            put our shoes through thousands of daily miles.
          </p>
        </div>

        {/* Count-Up Milestones */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {BRAND_CONFIG.socialProof.stats.map((stat, idx) => (
            <div
              key={stat.id}
              className="atelier-card rounded-3xl p-7"
            >
              <div className="font-serif text-6xl font-semibold tracking-tight tabular-nums text-stone-900 sm:text-7xl">
                {counts[idx].toLocaleString('en-US')}
                <span className="text-[#8C4A27]">{stat.suffix}</span>
              </div>
              <p className="mt-2 text-xs font-medium uppercase tracking-widest text-stone-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Customer Testimonials */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {BRAND_CONFIG.socialProof.quotes.map((item) => (
            <blockquote
              key={item.author}
              className="atelier-card flex flex-col justify-between rounded-3xl p-7"
            >
              <div>
                <div className="mb-4 flex items-center gap-1 text-[#8C4A27]">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Star
                      key={star}
                      className="h-3.5 w-3.5 fill-current"
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-stone-700">
                  “{item.quote}”
                </p>
              </div>
              <footer className="mt-6 border-t border-stone-900/10 pt-4">
                <p className="text-sm font-semibold text-stone-900">
                  {item.author}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">{item.meta}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
