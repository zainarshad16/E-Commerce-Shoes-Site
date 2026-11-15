'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand.config';
import { useStore } from '@/context/StoreContext';
import { useSneakerStore } from '@/store/useSneakerStore';

export function Navbar() {
  const pathname = usePathname();
  const isHomeShowcase = pathname === '/';

  const { cart: legacyCart, setIsCartOpen, authUser, logout } = useStore();
  const showcaseCart = useSneakerStore((s) => s.cart);
  const setShowcaseCartOpen = useSneakerStore((s) => s.setCartOpen);
  const currency = useSneakerStore((s) => s.currency);
  const setCurrency = useSneakerStore((s) => s.setCurrency);

  const [mobileOpen, setMobileOpen] = useState(false);

  const showcaseCount = showcaseCart.reduce((sum, item) => sum + item.quantity, 0);
  const legacyCount = legacyCart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCount = Math.max(showcaseCount, legacyCount);

  const openBag = () => {
    setShowcaseCartOpen(true);
    setIsCartOpen(true);
  };

  return (
    <header
      className={`${
        isHomeShowcase
          ? 'fixed inset-x-0 top-0 z-50 bg-[#F6F3EC]/80 backdrop-blur-xl border-b border-stone-900/10'
          : 'sticky top-0 z-50 border-b border-stone-900/10 bg-[#F6F3EC]/92 backdrop-blur-xl'
      } transition-all duration-300`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 sm:px-10 lg:px-16">
        {/* Clean Editorial Wordmark */}
        <Link
          href="/"
          className="group flex items-center gap-3 text-stone-900"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shadow-sm transition-transform duration-500 group-hover:scale-125"
            style={{ backgroundColor: 'var(--glow-primary)' }}
          />
          <span className="font-sans text-[13px] font-bold tracking-[0.22em] uppercase">
            {BRAND_CONFIG.name}
          </span>
        </Link>

        {/* Primary Navigation + Store Controls */}
        <div className="flex items-center gap-5">
          <nav
            aria-label="Primary Navigation"
            className="hidden items-center gap-7 md:flex"
          >
            {BRAND_CONFIG.navLinks.map((item) => {
              const targetHref = isHomeShowcase ? item.href : item.route;
              const isActive =
                pathname === item.route ||
                (item.route === '/blog' && pathname.startsWith('/blog'));
              return (
                <Link
                  key={item.label}
                  href={targetHref}
                  className={`nav-link-editorial text-[13px] font-medium tracking-wide transition-colors ${
                    isActive
                      ? 'font-semibold text-[#8C4A27]'
                      : 'text-stone-600 hover:text-stone-950'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Currency Switcher */}
          <button
            type="button"
            onClick={() => setCurrency(currency === 'USD' ? 'PKR' : 'USD')}
            aria-label="Toggle Currency USD or PKR"
            className="hidden rounded-full border border-stone-900/15 bg-white/80 px-3 py-1 font-mono text-[11px] font-medium text-stone-700 transition hover:border-[#8C4A27]/40 hover:text-stone-950 sm:inline-flex"
          >
            {currency}
          </button>

          {authUser ? (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-full border border-stone-900/15 bg-white/85 px-3.5 py-1.5 text-xs font-medium text-stone-800 transition hover:border-[#8C4A27]/45 hover:bg-white"
              >
                <User className="h-3.5 w-3.5 text-[#8C4A27]" />
                <span className="max-w-[92px] truncate">
                  {authUser.name.split(' ')[0]}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                aria-label="Sign out"
                className="rounded-full border border-stone-900/15 bg-white/85 p-1.5 text-stone-500 transition hover:border-red-300 hover:text-red-700"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-full border border-stone-900/15 bg-white/85 px-3.5 py-1.5 text-xs font-medium text-stone-800 transition hover:border-[#8C4A27]/45 hover:bg-white sm:inline-flex"
            >
              <LogIn className="h-3.5 w-3.5 text-[#8C4A27]" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Shopping Bag Pill */}
          <button
            type="button"
            onClick={openBag}
            aria-label="Open Shopping Bag"
            className="btn-atelier flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Bag</span>
            <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[11px] tabular-nums">
              {cartCount}
            </span>
          </button>

          {/* Mobile Drawer Trigger */}
          <button
            type="button"
            className="rounded-full border border-stone-900/15 bg-white/80 p-2 text-stone-800 md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="border-t border-stone-900/10 bg-[#FAF8F4] px-6 py-5 md:hidden">
          <div className="flex flex-col gap-3.5">
            {BRAND_CONFIG.navLinks.map((item) => (
              <Link
                key={item.label}
                href={isHomeShowcase ? item.href : item.route}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-stone-800"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center justify-between border-t border-stone-900/10 pt-3">
              <button
                type="button"
                onClick={() => setCurrency(currency === 'USD' ? 'PKR' : 'USD')}
                className="rounded-full border border-stone-900/15 px-3 py-1 text-xs font-medium text-stone-800"
              >
                Currency: {currency}
              </button>
              <Link
                href="/checkout"
                onClick={() => setMobileOpen(false)}
                className="text-xs font-medium text-[#8C4A27]"
              >
                Checkout
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="text-xs font-medium text-stone-700"
              >
                {authUser ? authUser.name : 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
