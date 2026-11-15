import React from 'react';

/**
 * Instant App Router Suspense boundary for `/product/[slug]`:
 * Ensures `router.push('/product/...')` commits immediately inside Next.js so
 * the 3D door walkthrough flows without stalling on SSR fetches.
 */
export default function ProductShowroomLoading() {
  return (
    <main className="min-h-screen bg-[#F6F3EC] pt-28 pb-20 text-stone-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-2 font-mono text-xs text-stone-400">
          <span>Home</span>
          <span>/</span>
          <span>Shop</span>
          <span>/</span>
          <span className="h-3 w-36 animate-pulse rounded bg-stone-300/70" />
        </div>

        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="relative flex h-[480px] items-center justify-center overflow-hidden rounded-[2rem] border border-stone-900/10 bg-gradient-to-b from-[#181310] via-[#110D0B] to-[#090706] shadow-2xl sm:h-[540px]">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#F5E2A8]/80">
                  Loading 3D Showroom...
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-5 lg:col-span-5">
            <div className="h-4 w-28 animate-pulse rounded bg-stone-300/60" />
            <div className="h-12 w-3/4 animate-pulse rounded-xl bg-stone-300/60" />
            <div className="h-8 w-32 animate-pulse rounded-lg bg-stone-300/60" />
            <div className="h-24 w-full animate-pulse rounded-2xl bg-stone-300/50" />
            <div className="h-14 w-full animate-pulse rounded-full bg-stone-300/70" />
          </div>
        </div>
      </div>
    </main>
  );
}
