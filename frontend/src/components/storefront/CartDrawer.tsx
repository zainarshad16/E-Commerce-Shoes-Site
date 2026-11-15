'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { formatBrandPrice } from '@/config/brand.config';
import { useStore } from '@/context/StoreContext';
import { useSneakerStore } from '@/store/useSneakerStore';
import { SneakerStudioThumb } from '@/components/storefront/SneakerStudioThumb';

/**
 * Slide-in Shopping Bag drawer synced across the homepage showcase and catalog.
 */
export function CartDrawer() {
  const {
    cart: legacyCart,
    isCartOpen: legacyCartOpen,
    setIsCartOpen: setLegacyCartOpen,
    updateCartQuantity: updateLegacyQty,
    removeFromCart: removeLegacyCart,
    clearCart: clearLegacyCart,
    checkoutOrder,
    authUser,
  } = useStore();

  const showcaseCart = useSneakerStore((s) => s.cart);
  const showcaseOpen = useSneakerStore((s) => s.isCartOpen);
  const setShowcaseOpen = useSneakerStore((s) => s.setCartOpen);
  const updateShowcaseQty = useSneakerStore((s) => s.updateCartQty);
  const removeShowcaseItem = useSneakerStore((s) => s.removeFromCart);
  const clearShowcaseCart = useSneakerStore((s) => s.clearCart);
  const currency = useSneakerStore((s) => s.currency);
  const setCurrency = useSneakerStore((s) => s.setCurrency);

  const isOpen = showcaseOpen || legacyCartOpen;

  const [step, setStep] = useState<'bag' | 'checkout' | 'success'>('bag');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (authUser) {
      setCustomerName((prev) => prev || authUser.name);
      setCustomerEmail((prev) => prev || authUser.email);
    }
  }, [authUser]);

  if (!isOpen) return null;

  const closeAll = () => {
    setShowcaseOpen(false);
    setLegacyCartOpen(false);
    if (step === 'success') setStep('bag');
  };

  const usingShowcase = showcaseCart.length > 0;
  const totalCount = usingShowcase
    ? showcaseCart.reduce((acc, i) => acc + i.quantity, 0)
    : legacyCart.reduce((acc, i) => acc + i.quantity, 0);

  const subtotalUsd = usingShowcase
    ? showcaseCart.reduce((acc, i) => acc + i.unitPriceUsd * i.quantity, 0)
    : legacyCart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);

  const freeShippingThreshold = 150;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotalUsd);
  const shippingPct = Math.min(100, (subtotalUsd / freeShippingThreshold) * 100);

  async function handleCheckoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authUser) {
      setErrorMsg('Please sign in or create an account before placing an order.');
      return;
    }

    /**
     * TODO (Stripe Checkout Integration):
     * Replace direct order placement with `POST /api/v1/payments/stripe-session` and
     * `@stripe/stripe-js` redirect when live payment capture is enabled.
     * Required env vars:
     *   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
     *   - STRIPE_SECRET_KEY
     *   - STRIPE_WEBHOOK_SECRET
     */
    setSubmitting(true);
    setErrorMsg(null);

    const result = await checkoutOrder({
      customerName,
      customerEmail,
      line1,
      city,
      state,
      postalCode,
      country,
    });

    setSubmitting(false);

    if (!result.ok) {
      setErrorMsg(result.error || 'Checkout could not be completed.');
      return;
    }

    clearShowcaseCart();
    clearLegacyCart();
    setConfirmedOrderNumber(result.orderNumber || 'AV-2026-NEW');
    setStep('success');
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end bg-stone-950/45 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-stone-900/10 bg-[#FAF8F4] text-stone-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-900/10 px-6 py-5">
          <div>
            <p className="text-xs font-medium text-stone-500">
              Atelier Vance · {currency}
            </p>
            <h2 className="mt-0.5 text-2xl font-bold tracking-tight text-stone-900">
              {step === 'bag'
                ? `Shopping Bag (${totalCount})`
                : step === 'checkout'
                ? 'Shipping Details'
                : 'Order Confirmed'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrency(currency === 'USD' ? 'PKR' : 'USD')}
              className="rounded-full border border-stone-900/15 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:border-stone-900/35"
            >
              {currency}
            </button>
            <button
              type="button"
              onClick={closeAll}
              className="rounded-full border border-stone-900/15 bg-white p-2 text-stone-600 hover:text-stone-950"
              aria-label="Close Shopping Bag"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Free Shipping Bar */}
        {step === 'bag' && totalCount > 0 && (
          <div className="border-b border-stone-900/10 bg-[#F2EFE8] px-6 py-3">
            <p className="text-xs font-medium text-stone-700">
              {remainingForFreeShipping === 0
                ? 'Complimentary express shipping unlocked on this order.'
                : `Add ${formatBrandPrice(remainingForFreeShipping, currency)} more for complimentary express shipping.`}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-300/70">
              <div
                className="h-full rounded-full bg-[#8C4A27] transition-all duration-300"
                style={{ width: `${shippingPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'success' ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-stone-500">
                Thank you for your order
              </p>
              <h3 className="mt-1 text-3xl font-bold text-stone-900">
                {confirmedOrderNumber}
              </h3>
              <p className="mt-3 text-sm text-stone-600">
                Your order is saved and our workshop team is preparing your pair for dispatch.
              </p>
              <button
                type="button"
                onClick={closeAll}
                className="mt-8 rounded-full bg-[#18181B] px-7 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#27272A]"
              >
                Continue Browsing
              </button>
            </div>
          ) : step === 'checkout' ? (
            <form
              id="checkout-form"
              onSubmit={handleCheckoutSubmit}
              className="space-y-4"
            >
              {errorMsg && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-700">
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-700">
                  Full Name
                </label>
                <input
                  required
                  placeholder="Hannah Lindstrom"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-700">
                  Email for Order Updates
                </label>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-700">
                  Street Address
                </label>
                <input
                  required
                  placeholder="1842 N Damen Ave"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900"
                />
                <input
                  required
                  placeholder="Postal Code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="State / Region"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900"
                />
                <input
                  required
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900"
                />
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-3.5 text-xs text-stone-600">
                <div className="flex items-center gap-2 font-semibold text-stone-900">
                  <ShieldCheck className="h-4 w-4 text-[#8C4A27]" />
                  <span>Direct Store Checkout &amp; 30-Day Guarantee</span>
                </div>
                <p className="mt-1">
                  Inventory is reserved immediately on confirmation. Stripe Checkout can be attached via <code>STRIPE_SECRET_KEY</code>.
                </p>
              </div>
            </form>
          ) : totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-semibold text-stone-800">
                Your shopping bag is empty
              </p>
              <p className="mt-2 max-w-xs text-sm text-stone-500">
                Pick a pair and select your size to add it to your bag.
              </p>
            </div>
          ) : usingShowcase ? (
            <div className="space-y-4">
              {showcaseCart.map((item) => (
                <div
                  key={item.key}
                  className="flex gap-4 rounded-2xl border border-stone-900/10 bg-white p-3.5 shadow-sm"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-stone-900/10">
                    <SneakerStudioThumb
                      name={item.productName}
                      imageUrl={item.imageUrl}
                      primaryGlowHex={item.accentHex}
                      compact
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-stone-900">
                          {item.productName}
                        </h3>
                        <p className="text-xs text-stone-500">
                          {item.colorwayName} · US {item.sizeUs} / EU {item.sizeEu}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeShowcaseItem(item.key)}
                        className="text-stone-400 hover:text-red-600"
                        aria-label={`Remove ${item.productName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">
                        <button
                          type="button"
                          onClick={() => updateShowcaseQty(item.key, -1)}
                          className="p-0.5 text-stone-500 hover:text-stone-900"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-medium tabular-nums text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateShowcaseQty(item.key, 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-0.5 text-stone-500 hover:text-stone-900 disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-stone-900">
                        {formatBrandPrice(
                          item.unitPriceUsd * item.quantity,
                          currency
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {legacyCart.map((item) => (
                <div
                  key={item.sizeSku}
                  className="flex gap-4 rounded-2xl border border-stone-900/10 bg-white p-3.5 shadow-sm"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-stone-900/10">
                    <SneakerStudioThumb
                      name={item.productName}
                      primaryGlowHex={item.primaryGlowHex}
                      compact
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-stone-900">
                          {item.productName}
                        </h3>
                        <p className="text-xs text-stone-500">
                          {item.colorName} · {item.sizeLabel}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLegacyCart(item.sizeSku)}
                        className="text-stone-400 hover:text-red-600"
                        aria-label={`Remove ${item.productName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">
                        <button
                          type="button"
                          onClick={() => updateLegacyQty(item.sizeSku, -1)}
                          className="p-0.5 text-stone-500 hover:text-stone-900"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-medium tabular-nums text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateLegacyQty(item.sizeSku, 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-0.5 text-stone-500 hover:text-stone-900 disabled:opacity-30"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-stone-900">
                        {formatBrandPrice(item.unitPrice * item.quantity, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && totalCount > 0 && (
          <div className="border-t border-stone-900/10 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">
                Subtotal · {remainingForFreeShipping === 0 ? 'Free Shipping' : 'Standard Shipping'}
              </span>
              <span className="text-2xl font-bold tabular-nums text-stone-900">
                {formatBrandPrice(subtotalUsd, currency)}
              </span>
            </div>

            {step === 'bag' ? (
              authUser ? (
                <Link
                  href="/checkout"
                  onClick={closeAll}
                  className="btn-atelier flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-xs font-semibold uppercase tracking-wider"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/login?redirect=/checkout"
                  onClick={closeAll}
                  className="btn-atelier flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-xs font-semibold uppercase tracking-wider"
                >
                  <Lock className="h-4 w-4" />
                  <span>Sign In to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('bag')}
                  className="rounded-full border border-stone-300 px-5 py-3.5 text-xs font-semibold text-stone-700 hover:border-stone-900"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#18181B] py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#27272A] disabled:opacity-60"
                >
                  {submitting
                    ? 'Placing Order...'
                    : `Place Order · ${formatBrandPrice(subtotalUsd, currency)}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
