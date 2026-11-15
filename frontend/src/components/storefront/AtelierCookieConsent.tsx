'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Check, Cookie, Settings2, ShieldCheck, X } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export interface CookieConsentState {
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
}

const CONSENT_STORAGE_KEY = 'atelier_cookie_consent_v1';
const CONSENT_COOKIE_NAME = 'atelier_cookie_consent';

const DEFAULT_PREFS: Omit<CookieConsentState, 'updatedAt'> = {
  essential: true,
  functional: true,
  analytics: false,
  marketing: false,
};

function writeConsentCookie(state: CookieConsentState) {
  const encoded = encodeURIComponent(
    JSON.stringify({
      essential: state.essential,
      functional: state.functional,
      analytics: state.analytics,
      marketing: state.marketing,
      updatedAt: state.updatedAt,
    })
  );
  document.cookie = `${CONSENT_COOKIE_NAME}=${encoded}; path=/; max-age=31536000; SameSite=Lax`;
}

export function AtelierCookieConsent() {
  const pathname = usePathname();
  const { contactSettings } = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [consent, setConsent] = useState<CookieConsentState | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [draft, setDraft] = useState<Omit<CookieConsentState, 'updatedAt'>>(DEFAULT_PREFS);

  useEffect(() => {
    setHydrated(true);
    try {
      const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
        const restored: CookieConsentState = {
          essential: true,
          functional: Boolean(parsed.functional),
          analytics: Boolean(parsed.analytics),
          marketing: Boolean(parsed.marketing),
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
        setConsent(restored);
        setDraft({
          essential: true,
          functional: restored.functional,
          analytics: restored.analytics,
          marketing: restored.marketing,
        });
        setIsOpen(false);
      } else if (contactSettings.cookieBannerEnabled !== false) {
        setIsOpen(true);
      }
    } catch {
      if (contactSettings.cookieBannerEnabled !== false) {
        setIsOpen(true);
      }
    }
  }, [contactSettings.cookieBannerEnabled]);

  useEffect(() => {
    const handleOpenEvent = () => {
      if (consent) {
        setDraft({
          essential: true,
          functional: consent.functional,
          analytics: consent.analytics,
          marketing: consent.marketing,
        });
      }
      setShowCustomize(true);
      setIsOpen(true);
    };

    window.addEventListener('atelier:open-cookie-settings', handleOpenEvent);
    return () => {
      window.removeEventListener('atelier:open-cookie-settings', handleOpenEvent);
    };
  }, [consent]);

  const persistConsent = (next: Omit<CookieConsentState, 'updatedAt'>) => {
    const saved: CookieConsentState = {
      ...next,
      essential: true,
      updatedAt: new Date().toISOString(),
    };
    setConsent(saved);
    setDraft({
      essential: true,
      functional: saved.functional,
      analytics: saved.analytics,
      marketing: saved.marketing,
    });
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(saved));
      writeConsentCookie(saved);
      window.dispatchEvent(
        new CustomEvent('atelier:cookie-consent-updated', { detail: saved })
      );
    } catch {
      // Ignore storage write errors in restricted browsing modes
    }
    setIsOpen(false);
    setShowCustomize(false);
  };

  const cfToken =
    contactSettings.cloudflareAnalyticsToken?.trim() ||
    process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN?.trim() ||
    '';
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <>
      {consent?.analytics && cfToken && (
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={JSON.stringify({ token: cfToken })}
        />
      )}

      {hydrated && !isAdminRoute && !isOpen && (
        <button
          type="button"
          onClick={() => {
            setShowCustomize(true);
            setIsOpen(true);
          }}
          aria-label="Open Cookie Settings"
          className="fixed bottom-4 left-4 z-[85] inline-flex items-center gap-1.5 rounded-full border border-stone-900/15 bg-white/95 px-3 py-1.5 text-[11px] font-medium text-stone-700 shadow-lg backdrop-blur-md transition hover:border-stone-900/30 hover:text-stone-950 sm:bottom-6 sm:left-6"
        >
          <Cookie className="h-3.5 w-3.5 text-[#8C4A27]" />
          <span>Cookie Settings</span>
        </button>
      )}

      {hydrated && isOpen && (
        <aside
          role="dialog"
          aria-live="polite"
          aria-label="Privacy and Cookie Consent"
          className="fixed bottom-4 left-4 right-4 z-[90] max-w-md rounded-3xl border border-stone-900/15 bg-[#FBF9F4]/98 p-5 text-stone-900 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:left-6 sm:right-auto"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/20 bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>CLOUDFLARE EDGE &amp; PRIVACY COMPLIANCE</span>
            </div>
            {consent && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowCustomize(false);
                }}
                aria-label="Close cookie preferences"
                className="rounded-full p-1 text-stone-500 transition hover:bg-stone-200/70 hover:text-stone-900"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <h2 className="mt-3 font-serif text-lg font-semibold text-stone-950">
            {contactSettings.cookieBannerTitle || 'Atelier Privacy & Cookie Consent'}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-stone-600">
            {contactSettings.cookieBannerDescription ||
              'We use essential cookies for bag & checkout security, Cloudflare edge protection, and optional analytics to refine your showroom experience.'}
          </p>

          {showCustomize && (
            <div className="mt-4 space-y-2.5 rounded-2xl border border-stone-900/10 bg-white/90 p-3.5 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-900">
                    Essential &amp; Cloudflare Security
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Cart, login session, checkout, and Cloudflare{' '}
                    <code className="text-[10px]">__cf_bm</code> /{' '}
                    <code className="text-[10px]">cf_clearance</code> protection.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-stone-900 px-2 py-0.5 font-mono text-[10px] font-semibold text-white">
                  ALWAYS ON
                </span>
              </div>

              <label className="flex cursor-pointer items-start justify-between gap-3 border-t border-stone-200/70 pt-2.5">
                <div>
                  <p className="font-semibold text-stone-900">Functional Preferences</p>
                  <p className="text-[11px] text-stone-500">
                    Remembers currency selection, chatbot language, and comparison tray.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={draft.functional}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, functional: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 accent-[#8C4A27]"
                />
              </label>

              <label className="flex cursor-pointer items-start justify-between gap-3 border-t border-stone-200/70 pt-2.5">
                <div>
                  <p className="font-semibold text-stone-900">
                    Cloudflare Analytics &amp; Performance
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Privacy-first Cloudflare Web Analytics &amp; anonymous Core Web Vitals.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={draft.analytics}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, analytics: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 accent-[#8C4A27]"
                />
              </label>

              <label className="flex cursor-pointer items-start justify-between gap-3 border-t border-stone-200/70 pt-2.5">
                <div>
                  <p className="font-semibold text-stone-900">Editorial &amp; Releases</p>
                  <p className="text-[11px] text-stone-500">
                    Helps tailor seasonal Atelier Vance footwear drop announcements.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={draft.marketing}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, marketing: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 accent-[#8C4A27]"
                />
              </label>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                persistConsent({
                  essential: true,
                  functional: true,
                  analytics: true,
                  marketing: true,
                })
              }
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-stone-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Accept All</span>
            </button>

            <button
              type="button"
              onClick={() =>
                persistConsent({
                  essential: true,
                  functional: false,
                  analytics: false,
                  marketing: false,
                })
              }
              className="rounded-full border border-stone-900/20 bg-white px-3.5 py-2 text-xs font-medium text-stone-800 transition hover:bg-stone-100"
            >
              Essential Only
            </button>

            {showCustomize ? (
              <button
                type="button"
                onClick={() => persistConsent(draft)}
                className="w-full rounded-full border border-[#8C4A27]/30 bg-[#8C4A27] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#753c1e]"
              >
                Save Preferences
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                className="inline-flex items-center gap-1 rounded-full border border-stone-900/15 bg-transparent px-3 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-200/60"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Customize</span>
              </button>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
