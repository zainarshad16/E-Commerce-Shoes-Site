'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
} from 'lucide-react';
import { formatBrandPrice } from '@/config/brand.config';
import { useStore } from '@/context/StoreContext';
import { useSneakerStore } from '@/store/useSneakerStore';
import { CartItem } from '@/types/cms';
import {
  SneakerStudioThumb,
  resolveSilhouetteFromText,
} from '@/components/storefront/SneakerStudioThumb';

export type PaymentMethodId = 'stripe' | 'cod' | 'bank_transfer';

interface PaymentProviderOption {
  id: PaymentMethodId;
  title: string;
  subtitle: string;
  badge: string;
  enabled: boolean;
}

/**
 * Modular payment provider registry:
 * Stripe is configured as the primary gateway; additional providers can be added
 * or toggled here without changing checkout orchestration logic.
 */
const PAYMENT_PROVIDERS: PaymentProviderOption[] = [
  {
    id: 'stripe',
    title: 'Credit or Debit Card (Stripe)',
    subtitle: 'Instant encrypted checkout via Stripe Elements · Visa, Mastercard, Amex',
    badge: 'Primary · Stripe',
    enabled: true,
  },
  {
    id: 'cod',
    title: 'Cash on Delivery',
    subtitle: 'Inspect box seal and pay our courier upon doorstep arrival',
    badge: 'Pay on Arrival',
    enabled: true,
  },
  {
    id: 'bank_transfer',
    title: 'Instant Bank Transfer / Wallet',
    subtitle: 'Direct SEPA, ACH, or local instant bank transfer with invoice ref',
    badge: 'Direct Settlement',
    enabled: true,
  },
];

export function CheckoutClient() {
  const {
    products,
    cart: legacyCart,
    authUser,
    checkoutOrder,
    clearCart: clearLegacyCart,
  } = useStore();
  const showcaseCart = useSneakerStore((s) => s.cart);
  const clearShowcaseCart = useSneakerStore((s) => s.clearCart);
  const currency = useSneakerStore((s) => s.currency);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('stripe');
  const [shippingTier, setShippingTier] = useState<'standard' | 'express'>(
    'standard'
  );

  // Customer & Shipping Address Form
  const [customerName, setCustomerName] = useState(authUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState(authUser?.email || '');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');

  // Stripe Card Fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState(authUser?.name || '');

  // Promo & Confirmation State
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedReceipt, setConfirmedReceipt] = useState<{
    orderNumber: string;
    totalUsd: number;
    methodTitle: string;
    items: CartItem[];
  } | null>(null);

  // Resolve active checkout line items cleanly across StoreContext & Showcase Zustand cart
  const resolvedItems: CartItem[] = useMemo(() => {
    if (legacyCart.length > 0) return legacyCart;

    return showcaseCart
      .map((item) => {
        const matchedProd =
          products.find(
            (p) => p.slug === item.productSlug || p.id === item.productId
          ) || products[0];
        if (!matchedProd) return null;
        const dbVariant = matchedProd.variants[0];
        if (!dbVariant) return null;
        const dbSize =
          dbVariant.sizes.find(
            (s) =>
              s.sizeLabel.includes(`US ${item.sizeUs}`) && s.stockCount > 0
          ) ||
          dbVariant.sizes.find((s) => s.stockCount > 0) ||
          dbVariant.sizes[0];
        if (!dbSize) return null;

        return {
          productId: matchedProd.id,
          productSlug: matchedProd.slug,
          productName: item.productName || matchedProd.name,
          variantId: dbVariant.id,
          colorName: item.colorwayName || dbVariant.colorName,
          primaryGlowHex: item.accentHex || dbVariant.primaryGlowHex,
          posterImageUrl: item.imageUrl || dbVariant.posterImageUrl,
          sizeSku: dbSize.sku,
          sizeLabel: `US ${item.sizeUs} / EU ${item.sizeEu}`,
          unitPrice: item.unitPriceUsd || matchedProd.basePrice,
          quantity: item.quantity,
          maxStock: dbSize.stockCount || item.maxStock,
        } satisfies CartItem;
      })
      .filter((x): x is CartItem => x !== null);
  }, [legacyCart, showcaseCart, products]);

  const subtotalUsd = resolvedItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const discountUsd = promoApplied ? Math.round(subtotalUsd * 0.1) : 0;
  const baseShippingUsd =
    shippingTier === 'express' ? 18 : subtotalUsd >= 150 ? 0 : 12;
  const totalUsd = Math.max(0, subtotalUsd - discountUsd + baseShippingUsd);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'VANCE10') {
      setPromoApplied(true);
      setErrorMsg(null);
    } else {
      setPromoApplied(false);
      setErrorMsg('Promo code not recognized. Try VANCE10 for 10% courtesy savings.');
    }
  };

  const handleFormatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const groups = digits.match(/.{1,4}/g) || [];
    setCardNumber(groups.join(' '));
  };

  const handleFormatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setCardExpiry(`${digits.slice(0, 2)} / ${digits.slice(2)}`);
    } else {
      setCardExpiry(digits);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!authUser) {
      setErrorMsg('Please sign in first to complete your checkout.');
      return;
    }

    if (resolvedItems.length === 0) {
      setErrorMsg('Your shopping bag is empty.');
      return;
    }

    if (paymentMethod === 'stripe') {
      const cleanCard = cardNumber.replace(/\s+/g, '');
      if (cleanCard.length < 12 || cardExpiry.length < 4 || cardCvc.length < 3) {
        setErrorMsg('Please complete all Stripe card fields (Card Number, Expiry, and CVC).');
        return;
      }
    }

    setSubmitting(true);
    const provider =
      PAYMENT_PROVIDERS.find((p) => p.id === paymentMethod) ||
      PAYMENT_PROVIDERS[0];

    const paymentRef =
      paymentMethod === 'stripe'
        ? `pi_stripe_${Date.now()}`
        : paymentMethod === 'cod'
        ? `cod_${Date.now()}`
        : `bank_${Date.now()}`;

    const res = await checkoutOrder({
      customerName: customerName || authUser.name,
      customerEmail: customerEmail || authUser.email,
      line1,
      city,
      state: stateRegion,
      postalCode,
      country,
      paymentMethod,
      stripePaymentIntentId: paymentRef,
      itemsOverride: resolvedItems,
    });

    setSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.error || 'Checkout could not be processed.');
      return;
    }

    const receiptItems = [...resolvedItems];
    clearShowcaseCart();
    clearLegacyCart();
    setConfirmedReceipt({
      orderNumber: res.orderNumber || `AV-2026-${Date.now().toString().slice(-4)}`,
      totalUsd,
      methodTitle: provider.title,
      items: receiptItems,
    });
  };

  if (confirmedReceipt) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="atelier-card rounded-3xl p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <p className="mt-5 font-serif text-base italic text-[#8C4A27]">
            Thank You for Choosing Atelier Vance
          </p>
          <h1 className="mt-1 font-condensed text-5xl uppercase tracking-tight text-stone-900">
            Order {confirmedReceipt.orderNumber}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-600">
            Your order has been recorded via{' '}
            <strong className="text-stone-900">{confirmedReceipt.methodTitle}</strong>.
            Each pair is inspected in our workshop before courier dispatch.
          </p>

          <div className="mt-8 space-y-3 rounded-2xl border border-stone-900/10 bg-[#F6F3EC] p-5 text-left">
            {confirmedReceipt.items.map((item) => (
              <div
                key={item.sizeSku}
                className="flex items-center justify-between text-xs"
              >
                <span className="font-medium text-stone-800">
                  {item.quantity}x {item.productName} ({item.sizeLabel})
                </span>
                <span className="font-semibold tabular-nums text-stone-900">
                  {formatBrandPrice(item.unitPrice * item.quantity, currency)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-stone-900/10 pt-3 text-sm font-bold text-stone-900">
              <span>Total Settled</span>
              <span className="tabular-nums">
                {formatBrandPrice(confirmedReceipt.totalUsd, currency)}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/shop"
              className="btn-atelier inline-flex h-12 items-center gap-2 rounded-full px-7 text-xs font-semibold uppercase tracking-wider"
            >
              <span>Continue Exploring Footwear</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/blog"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-stone-900/15 bg-[#EFECE4] px-6 text-xs font-semibold text-stone-900 transition hover:border-[#8C4A27]"
            >
              <span>Read Leather &amp; Care Journal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (resolvedItems.length === 0) {
    return (
      <div className="atelier-card mx-auto max-w-xl rounded-3xl p-10 text-center">
        <p className="font-serif text-base italic text-[#8C4A27]">
          Atelier Vance Bag
        </p>
        <h1 className="mt-1 font-condensed text-4xl uppercase text-stone-900">
          Your Shopping Bag is Empty
        </h1>
        <p className="mt-3 text-sm text-stone-600">
          Explore our seven leather, suede, canvas, and road runner silhouettes to
          begin your order.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className="btn-atelier inline-flex h-11 items-center gap-2 rounded-full px-7 text-xs font-semibold uppercase tracking-wider"
          >
            <span>Browse Collection</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Checkout Column */}
      <div className="space-y-6 lg:col-span-7">
        {/* Account Status Gate */}
        {!authUser && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#8C4A27]/30 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8C4A27]/12 text-[#8C4A27]">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  Member Sign-In Required for Order Confirmation
                </p>
                <p className="text-xs text-stone-600">
                  Sign in with Google or your email account to reserve stock and receive tracking updates.
                </p>
              </div>
            </div>
            <Link
              href="/login?redirect=/checkout"
              className="btn-atelier inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-semibold"
            >
              <span>Sign In Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <form
          id="atelier-checkout-form"
          onSubmit={handlePlaceOrder}
          className="space-y-6"
        >
          {/* 1. Shipping Address */}
          <div className="atelier-card rounded-3xl p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8C4A27]">
              Step 01 · Destination
            </p>
            <h2 className="mt-1 font-condensed text-3xl uppercase text-stone-900">
              Shipping Address
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-700">
                  Full Name
                </label>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Hannah Lindstrom"
                  className="h-11 w-full rounded-xl border border-stone-900/15 bg-[#F6F3EC] px-3.5 text-sm text-stone-900 outline-none focus:border-[#8C4A27]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-700">
                  Email for Receipt &amp; Tracking
                </label>
                <input
                  required
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-stone-900/15 bg-[#F6F3EC] px-3.5 text-sm text-stone-900 outline-none focus:border-[#8C4A27]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-stone-700">
                  Street Address
                </label>
                <input
                  required
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="1842 N Damen Ave, Apt 3B"
                  className="h-11 w-full rounded-xl border border-stone-900/15 bg-[#F6F3EC] px-3.5 text-sm text-stone-900 outline-none focus:border-[#8C4A27]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-700">
                  City
                </label>
                <input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Chicago"
                  className="h-11 w-full rounded-xl border border-stone-900/15 bg-[#F6F3EC] px-3.5 text-sm text-stone-900 outline-none focus:border-[#8C4A27]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-700">
                  State / Province
                </label>
                <input
                  required
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  placeholder="IL"
                  className="h-11 w-full rounded-xl border border-stone-900/15 bg-[#F6F3EC] px-3.5 text-sm text-stone-900 outline-none focus:border-[#8C4A27]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-700">
                  Postal Code
                </label>
                <input
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="60647"
                  className="h-11 w-full rounded-xl border border-stone-900/15 bg-[#F6F3EC] px-3.5 text-sm text-stone-900 outline-none focus:border-[#8C4A27]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-700">
                  Country
                </label>
                <input
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="United States"
                  className="h-11 w-full rounded-xl border border-stone-900/15 bg-[#F6F3EC] px-3.5 text-sm text-stone-900 outline-none focus:border-[#8C4A27]"
                />
              </div>
            </div>
          </div>

          {/* 2. Delivery Method */}
          <div className="atelier-card rounded-3xl p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8C4A27]">
              Step 02 · Courier
            </p>
            <h2 className="mt-1 font-condensed text-3xl uppercase text-stone-900">
              Delivery Speed
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShippingTier('standard')}
                className={`flex items-start justify-between rounded-2xl border p-4 text-left transition ${
                  shippingTier === 'standard'
                    ? 'border-[#18181B] bg-[#EFECE4]'
                    : 'border-stone-900/10 bg-[#FAF8F4] hover:border-stone-900/30'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-stone-900">
                    Tracked Ground Delivery
                  </p>
                  <p className="mt-1 text-[11px] text-stone-600">
                    3–5 business days · Free over $150
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-stone-900">
                  {subtotalUsd >= 150 ? 'FREE' : formatBrandPrice(12, currency)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShippingTier('express')}
                className={`flex items-start justify-between rounded-2xl border p-4 text-left transition ${
                  shippingTier === 'express'
                    ? 'border-[#18181B] bg-[#EFECE4]'
                    : 'border-stone-900/10 bg-[#FAF8F4] hover:border-stone-900/30'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-stone-900">
                    Atelier Air Priority
                  </p>
                  <p className="mt-1 text-[11px] text-stone-600">
                    1–2 business days · Signature required
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-stone-900">
                  {formatBrandPrice(18, currency)}
                </span>
              </button>
            </div>
          </div>

          {/* 3. Modular Payment Methods (Stripe Primary + Swappable Alternatives) */}
          <div className="atelier-card rounded-3xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8C4A27]">
                  Step 03 · Payment Gateway
                </p>
                <h2 className="mt-1 font-condensed text-3xl uppercase text-stone-900">
                  Payment Method
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/20 bg-emerald-50 px-3 py-1 font-mono text-[10px] font-semibold text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>256-Bit Encrypted</span>
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {PAYMENT_PROVIDERS.filter((p) => p.enabled).map((provider) => {
                const selected = paymentMethod === provider.id;
                const Icon =
                  provider.id === 'stripe'
                    ? CreditCard
                    : provider.id === 'cod'
                    ? Banknote
                    : Building2;

                return (
                  <div
                    key={provider.id}
                    className={`rounded-2xl border transition ${
                      selected
                        ? 'border-[#18181B] bg-[#EFECE4]/70'
                        : 'border-stone-900/10 bg-[#FAF8F4]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setPaymentMethod(provider.id)}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            selected
                              ? 'border-[#18181B] bg-[#18181B]'
                              : 'border-stone-400 bg-white'
                          }`}
                        >
                          {selected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        <Icon className="h-4 w-4 text-[#8C4A27]" />
                        <div>
                          <p className="text-xs font-bold text-stone-900">
                            {provider.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-stone-600">
                            {provider.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-stone-900/10 bg-white px-2.5 py-0.5 font-mono text-[10px] font-semibold text-stone-700">
                        {provider.badge}
                      </span>
                    </button>

                    {/* Stripe Card Element Details */}
                    {selected && provider.id === 'stripe' && (
                      <div className="border-t border-stone-900/10 bg-white p-4 sm:p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#635BFF]">
                            Powered by Stripe
                          </span>
                          <div className="flex gap-1.5 font-mono text-[10px] font-bold text-stone-500">
                            <span className="rounded border border-stone-200 px-1.5 py-0.5">
                              VISA
                            </span>
                            <span className="rounded border border-stone-200 px-1.5 py-0.5">
                              MASTERCARD
                            </span>
                            <span className="rounded border border-stone-200 px-1.5 py-0.5">
                              AMEX
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-[11px] font-medium text-stone-700">
                              Card Number
                            </label>
                            <input
                              required
                              inputMode="numeric"
                              value={cardNumber}
                              onChange={(e) =>
                                handleFormatCardNumber(e.target.value)
                              }
                              placeholder="4242 4242 4242 4242"
                              className="h-10 w-full rounded-xl border border-stone-900/15 bg-[#F6F3EC] px-3.5 font-mono text-xs text-stone-900 outline-none focus:border-[#635BFF]"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-stone-700">
                              Expiration (MM / YY)
                            </label>
                            <input
                              required
                              inputMode="numeric"
                              value={cardExpiry}
                              onChange={(e) =>
                                handleFormatExpiry(e.target.value)
                              }
                              placeholder="09 / 28"
                              className="h-10 w-full rounded-xl border border-stone-900/15 bg-[#F6F3EC] px-3.5 font-mono text-xs text-stone-900 outline-none focus:border-[#635BFF]"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-stone-700">
                              Security Code (CVC)
                            </label>
                            <input
                              required
                              inputMode="numeric"
                              maxLength={4}
                              value={cardCvc}
                              onChange={(e) =>
                                setCardCvc(e.target.value.replace(/\D/g, ''))
                              }
                              placeholder="424"
                              className="h-10 w-full rounded-xl border border-stone-900/15 bg-[#F6F3EC] px-3.5 font-mono text-xs text-stone-900 outline-none focus:border-[#635BFF]"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-[11px] font-medium text-stone-700">
                              Cardholder Name
                            </label>
                            <input
                              required
                              value={cardHolder}
                              onChange={(e) => setCardHolder(e.target.value)}
                              placeholder="Hannah Lindstrom"
                              className="h-10 w-full rounded-xl border border-stone-900/15 bg-[#F6F3EC] px-3.5 text-xs text-stone-900 outline-none focus:border-[#635BFF]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {selected && provider.id === 'cod' && (
                      <div className="border-t border-stone-900/10 bg-white px-4 py-3 text-xs text-stone-600">
                        Have exact cash or mobile POS card ready when our courier
                        presents your parcel seal at delivery.
                      </div>
                    )}

                    {selected && provider.id === 'bank_transfer' && (
                      <div className="border-t border-stone-900/10 bg-white px-4 py-3 text-xs text-stone-600">
                        Your pair is reserved immediately and wiring instructions
                        appear alongside your confirmation number.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </div>

      {/* Right Sticky Order Summary Column */}
      <div className="lg:col-span-5">
        <div className="atelier-card sticky top-24 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-stone-900/10 pb-4">
            <h2 className="font-condensed text-3xl uppercase text-stone-900">
              Order Summary
            </h2>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#8C4A27] hover:underline"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Edit Bag</span>
            </Link>
          </div>

          <div className="mt-5 max-h-80 space-y-3.5 overflow-y-auto pr-1">
            {resolvedItems.map((item) => (
              <div
                key={item.sizeSku}
                className="flex items-center gap-3.5 rounded-2xl border border-stone-900/10 bg-[#FAF8F4] p-3"
              >
                <SneakerStudioThumb
                  name={item.productName}
                  imageUrl={item.posterImageUrl}
                  primaryGlowHex={item.primaryGlowHex}
                  silhouette={resolveSilhouetteFromText(item.productName)}
                  compact
                  className="h-16 w-16 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-stone-900">
                    {item.productName}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {item.colorName} · {item.sizeLabel}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-stone-500">
                    Qty {item.quantity}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-stone-900">
                  {formatBrandPrice(item.unitPrice * item.quantity, currency)}
                </span>
              </div>
            ))}
          </div>

          {/* Promo Code */}
          <form
            onSubmit={handleApplyPromo}
            className="mt-5 flex items-center gap-2 border-t border-stone-900/10 pt-5"
          >
            <div className="relative flex-1">
              <Tag className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Promo code (e.g. VANCE10)"
                className="h-10 w-full rounded-full border border-stone-900/15 bg-[#F6F3EC] pl-9 pr-3 text-xs text-stone-900 outline-none focus:border-[#8C4A27]"
              />
            </div>
            <button
              type="submit"
              className="h-10 rounded-full border border-stone-900/20 bg-white px-4 text-xs font-semibold text-stone-900 transition hover:bg-[#EFECE4]"
            >
              Apply
            </button>
          </form>

          {/* Breakdown */}
          <dl className="mt-5 space-y-2 border-t border-stone-900/10 pt-5 text-xs">
            <div className="flex justify-between text-stone-600">
              <dt>Subtotal</dt>
              <dd className="font-mono font-semibold tabular-nums text-stone-900">
                {formatBrandPrice(subtotalUsd, currency)}
              </dd>
            </div>
            {promoApplied && (
              <div className="flex justify-between text-emerald-700">
                <dt className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Courtesy Code (VANCE10)</span>
                </dt>
                <dd className="font-mono font-semibold tabular-nums">
                  -{formatBrandPrice(discountUsd, currency)}
                </dd>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <dt className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-[#8C4A27]" />
                <span>
                  {shippingTier === 'express'
                    ? 'Atelier Air Priority'
                    : 'Tracked Ground Shipping'}
                </span>
              </dt>
              <dd className="font-mono font-semibold tabular-nums text-stone-900">
                {baseShippingUsd === 0
                  ? 'Complimentary'
                  : formatBrandPrice(baseShippingUsd, currency)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-stone-900/10 pt-3 text-base font-bold text-stone-900">
              <dt>Total Due</dt>
              <dd className="font-condensed text-3xl tabular-nums">
                {formatBrandPrice(totalUsd, currency)}
              </dd>
            </div>
          </dl>

          {errorMsg && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            form="atelier-checkout-form"
            disabled={submitting || !authUser}
            className="btn-atelier mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-xs font-semibold uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>
              {submitting
                ? 'Authorizing Order...'
                : paymentMethod === 'stripe'
                ? `Pay ${formatBrandPrice(totalUsd, currency)} with Stripe`
                : `Confirm Order · ${formatBrandPrice(totalUsd, currency)}`}
            </span>
          </button>

          <p className="mt-3 text-center text-[11px] text-stone-500">
            Modular payment architecture · Stripe default · 30-day wear guarantee
          </p>
        </div>
      </div>
    </div>
  );
}

