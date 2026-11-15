'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CheckCircle2, Mail } from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand.config';
import { useStore } from '@/context/StoreContext';
import { useSneakerStore } from '@/store/useSneakerStore';

interface FinalCtaSectionProps {
  onFindYourPair: () => void;
}

/**
 * Closing showcase call to action, newsletter dispatch form, and warm footer links.
 */
export function FinalCtaSection({ onFindYourPair }: FinalCtaSectionProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const setCursorMode = useSneakerStore((s) => s.setCursorMode);
  const { pageSections } = useStore();
  const newsletterSec = pageSections.find(
    (s) => s.sectionType === 'NEWSLETTER'
  );
  const newsletterJson = (newsletterSec?.contentJson || {}) as {
    heading?: string;
    subheading?: string;
    placeholder?: string;
    ctaText?: string;
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <section
      id="final-cta"
      aria-labelledby="final-cta-heading"
      className="relative z-20 flex min-h-screen flex-col justify-between pt-28 pb-10"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 text-center sm:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/90 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#8C4A27] shadow-sm">
          Small-Batch Shoemaking
        </span>

        <h2
          id="final-cta-heading"
          className="mt-6 max-w-4xl font-condensed uppercase leading-[0.88] tracking-tight text-stone-900 drop-shadow-[0_1px_16px_rgba(246,243,236,0.9)]"
          style={{ fontSize: 'clamp(3.25rem, 11vw, 9.5rem)' }}
        >
          {BRAND_CONFIG.finalCta.headline}
        </h2>

        <p className="mt-5 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-base">
          {BRAND_CONFIG.finalCta.subhead}
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onFindYourPair}
            onMouseEnter={() => setCursorMode('pointer')}
            onMouseLeave={() => setCursorMode('default')}
            className="group inline-flex h-14 items-center gap-3 rounded-full bg-[#18181B] px-8 text-sm font-semibold text-[#F6F3EC] shadow-lg transition hover:scale-[1.02] hover:bg-[#8C4A27]"
          >
            <span>{BRAND_CONFIG.finalCta.ctaLabel}</span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>

          <Link
            href="/shop"
            onMouseEnter={() => setCursorMode('pointer')}
            onMouseLeave={() => setCursorMode('default')}
            className="inline-flex h-14 items-center gap-2 rounded-full border border-stone-900/15 bg-white/90 px-7 text-sm font-semibold text-stone-900 shadow-sm transition hover:border-stone-900/35 hover:bg-white"
          >
            <span>Browse Full Storefront</span>
            <ArrowUpRight className="h-4 w-4 text-[#8C4A27]" />
          </Link>
        </div>

        {/* Newsletter Signup Card */}
        <div className="mt-12 w-full max-w-md rounded-3xl border border-stone-900/10 bg-white/95 p-5 shadow-md">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-700">
            {newsletterJson.heading || 'Workshop Restock Notes'}
          </p>
          {newsletterJson.subheading && (
            <p className="mb-3 text-[11px] text-stone-500">
              {newsletterJson.subheading}
            </p>
          )}
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-[#8C4A27]">
              <CheckCircle2 className="h-4 w-4" />
              <span>You’re on the list — we’ll email before small batches restock.</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubscribe}
              className="flex items-center gap-2"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address for workshop dispatch
              </label>
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={newsletterJson.placeholder || 'you@example.com'}
                  className="h-11 w-full rounded-full border border-stone-900/15 bg-[#F6F3EC] pl-9 pr-4 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#8C4A27] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                onMouseEnter={() => setCursorMode('pointer')}
                onMouseLeave={() => setCursorMode('default')}
                className="h-11 shrink-0 rounded-full bg-[#18181B] px-5 text-xs font-semibold text-[#F6F3EC] transition hover:bg-[#8C4A27]"
              >
                {newsletterJson.ctaText || 'Notify Me'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Minimal Showcase Footer */}
      <footer className="mx-auto mt-16 flex w-full max-w-7xl flex-col items-center justify-between gap-4 border-t border-stone-900/10 px-5 pt-7 text-xs text-stone-500 sm:flex-row sm:px-8">
        <div>
          <span className="font-semibold text-stone-900">
            {BRAND_CONFIG.name}
          </span>{' '}
          · {BRAND_CONFIG.tagline}
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/shop" className="nav-link-editorial transition hover:text-stone-900">
            Shop
          </Link>
          <Link href="/blog" className="nav-link-editorial transition hover:text-stone-900">
            Journal
          </Link>
          <Link href="/about" className="nav-link-editorial transition hover:text-stone-900">
            Our Craft
          </Link>
          <Link href="/faq" className="nav-link-editorial transition hover:text-stone-900">
            Fit & Care
          </Link>
          <Link href="/login" className="nav-link-editorial transition hover:text-stone-900">
            Account
          </Link>
          <Link href="/checkout" className="nav-link-editorial transition hover:text-stone-900">
            Checkout
          </Link>
        </div>
      </footer>
    </section>
  );
}
