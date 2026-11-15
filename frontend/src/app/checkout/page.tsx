import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckoutClient } from '@/components/storefront/CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout & Stripe Payment | Atelier Vance',
  description:
    'Complete your Atelier Vance footwear order securely with Stripe or alternate modular payment methods.',
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#F6F3EC] pt-28 pb-20 text-stone-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 font-mono text-xs text-stone-500"
        >
          <Link href="/" className="transition hover:text-stone-900">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="transition hover:text-stone-900">
            Shop
          </Link>
          <span>/</span>
          <span className="font-medium text-stone-900">Checkout</span>
        </nav>

        <header className="mb-10 border-b border-stone-900/10 pb-6">
          <p className="font-serif text-base italic text-[#8C4A27]">
            Workshop Dispatch &amp; Encrypted Settlement
          </p>
          <h1 className="mt-1 font-condensed text-5xl uppercase tracking-tight text-stone-900 sm:text-6xl">
            Checkout
          </h1>
        </header>

        <CheckoutClient />
      </div>
    </main>
  );
}

