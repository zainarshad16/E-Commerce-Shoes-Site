'use client';

import Link from 'next/link';
import { useStore } from '@/context/StoreContext';

export function Footer() {
  const { contactSettings } = useStore();
  const waDigits = contactSettings.whatsappNumber.replace(/[^\d]/g, '') || '923001234567';

  return (
    <footer className="border-t border-stone-900/10 bg-[#EFECE4] py-16 text-stone-800">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <p className="text-base font-bold tracking-[0.18em] text-stone-900 uppercase">
            ATELIER VANCE
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-600">
            Independent footwear workshop focused on honest full-grain hides,
            brushed indigo suede, organic canvas, and everyday cushioned comfort
            made in thoughtful small batches.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-stone-600">
            <span className="rounded-full border border-stone-900/10 bg-white/70 px-3 py-1">
              Free Shipping Over $150
            </span>
            <span className="rounded-full border border-stone-900/10 bg-white/70 px-3 py-1">
              30-Day Wear Trial
            </span>
            <span className="rounded-full border border-stone-900/10 bg-white/70 px-3 py-1">
              Easy Size Exchanges
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
            Shop
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-stone-600">
            <li>
              <Link href="/shop" className="hover:text-stone-950">
                All Footwear
              </Link>
            </li>
            <li>
              <Link href="/collections/cyber-runner" className="hover:text-stone-950">
                Everyday Runners
              </Link>
            </li>
            <li>
              <Link href="/collections/zero-gravity" className="hover:text-stone-950">
                Casual &amp; Court
              </Link>
            </li>
            <li>
              <Link href="/collections/obsidian-series" className="hover:text-stone-950">
                Heritage Leather &amp; Dress
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
            Customer Care
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-stone-600">
            <li>
              <Link href="/about" className="hover:text-stone-950">
                Our Craft &amp; Materials
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-stone-950">
                Sizing, Care &amp; Returns FAQ
              </Link>
            </li>
            <li>
              <Link href="/blog" className="nav-link-editorial hover:text-stone-950">
                Atelier Journal
              </Link>
            </li>
            <li>
              <Link href="/login" className="nav-link-editorial hover:text-stone-950">
                Customer Account
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="nav-link-editorial hover:text-stone-950">
                Checkout &amp; Shipping
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-stone-900/10 px-4 pt-8 text-xs text-stone-500 sm:flex-row sm:px-6 lg:px-8">
        <p>© 2026 Atelier Vance Footwear. All rights reserved.</p>
        <p className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={`mailto:${contactSettings.adminEmail}`}
            className="hover:text-stone-900"
          >
            {contactSettings.adminEmail}
          </a>
          <span>·</span>
          <span>{contactSettings.supportPhone}</span>
          <span>·</span>
          <a
            href={`https://wa.me/${waDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-700 hover:underline"
          >
            WhatsApp Support
          </a>
          <span>·</span>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('atelier:open-cookie-settings'))}
            className="font-medium text-stone-700 underline-offset-2 hover:text-stone-950 hover:underline"
          >
            Cookie Preferences
          </button>
        </p>
      </div>
    </footer>
  );
}
