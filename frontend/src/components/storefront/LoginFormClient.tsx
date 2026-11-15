'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/config';
import { useStore } from '@/context/StoreContext';

type AuthMode = 'login' | 'register';
type CarpetStage = 'side' | 'walking' | 'unrolling' | 'open';

interface CurrentGoogleAccount {
  name: string;
  email: string;
  googleId?: string;
}

const GOOGLE_CURRENT_ACCOUNT_KEY = 'atelier_google_current_account_v1';
const PLACEHOLDER_SEED_EMAILS = new Set([
  'hannah.lindstrom@gmail.com',
  'tariq.mahmood@gmail.com',
  'guest.reader@gmail.com',
  'test.google@gmail.com',
]);

function GoogleGIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-8.97Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

function mergeGoogleAccounts(
  list: CurrentGoogleAccount[]
): CurrentGoogleAccount[] {
  const seen = new Set<string>();
  const result: CurrentGoogleAccount[] = [];
  for (const item of list) {
    const emailLower = item.email?.trim().toLowerCase();
    if (!emailLower || !emailLower.includes('@') || PLACEHOLDER_SEED_EMAILS.has(emailLower)) {
      continue;
    }
    if (seen.has(emailLower)) continue;
    seen.add(emailLower);
    result.push({
      email: emailLower,
      name:
        item.name?.trim() ||
        emailLower
          .split('@')[0]
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      googleId: item.googleId,
    });
  }
  return result;
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    prompt?: string;
    callback: (resp: { access_token?: string; error?: string }) => void;
    error_callback?: (err: { type?: string; message?: string }) => void;
  }) => { requestAccessToken: () => void };
}

const DEFAULT_GOOGLE_CLIENT_ID =
  '410827708760-5dd9s2sekl7vfro9gik90qf22irfetn5.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleAccountsOAuth2;
      };
    };
  }
}

/**
 * Animated Character in White Shirt, Denim Jeans & Blue Sneakers:
 * - Articulated walking stride (`walking`): alternating legs/feet and swinging arms
 * - Center unroll action (`unrolling`): leans slightly & sweeps arms down to roll out the carpet
 * - Standing side pose (`open`): stands on LEFT for Login or RIGHT for Sign Up with tablet & lock/star bubble
 */
function CasualBoyCharacter({
  mode,
  stage,
}: {
  mode: AuthMode;
  stage: CarpetStage;
}) {
  const isRegister = mode === 'register';
  const isWalking = stage === 'walking';
  const isUnrolling = stage === 'unrolling';
  const isOpen = stage === 'open';
  const isHoldingRoll = stage === 'side' || stage === 'walking';

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Floating Security / Status Thought Bubble (appears once standing beside the open card) */}
      <div
        className={`animate-boy-padlock mb-1 transition-all duration-400 ${
          isOpen
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-2 scale-75 opacity-0'
        }`}
      >
        <div className="relative flex items-center gap-1.5 rounded-2xl bg-[#E1F1FE] px-3 py-1.5 shadow-sm ring-1 ring-sky-200">
          {isRegister ? (
            <>
              <ShieldCheck className="h-4 w-4 text-[#F59E0B]" />
              <span className="text-[10px] font-semibold text-slate-700">
                Join Atelier
              </span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 fill-[#F59E0B] text-[#D97706]" />
              <span className="text-[10px] font-semibold text-slate-700">
                Secure Login
              </span>
            </>
          )}
          <span
            className={`absolute -bottom-1.5 h-3 w-3 rotate-45 bg-[#E1F1FE] ${
              isRegister ? 'left-4' : 'right-4'
            }`}
          />
        </div>
      </div>

      {/* Main Articulated Boy Character SVG */}
      <div
        className={
          isWalking
            ? 'animate-boy-walk-body'
            : isOpen
            ? 'animate-boy-idle'
            : ''
        }
      >
        <svg
          viewBox="0 0 210 315"
          className="h-60 w-44 drop-shadow-[0_14px_22px_rgba(30,41,59,0.14)] sm:h-72 sm:w-52"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="jeansGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3B4963" />
              <stop offset="55%" stopColor="#2A364B" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
            <linearGradient id="carpetDrum" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
          </defs>

          {/* Ground Contact Shadow */}
          <ellipse cx="106" cy="298" rx="52" ry="8" fill="rgba(51,65,85,0.16)" />

          {/* Flip horizontally on Sign Up so he walks in from right facing left toward center */}
          <g transform={isRegister ? 'translate(210, 0) scale(-1, 1)' : undefined}>
            {/* ============================================================== */}
            {/* ARTICULATED JEANS LEGS & BLUE/WHITE SNEAKERS (REAL WALK CYCLE) */}
            {/* ============================================================== */}
            {/* Left / Back Leg in Cuffed Navy Jeans + Blue Sneaker */}
            <g className={isWalking ? 'animate-boy-leg-left' : ''}>
              {/* Denim leg */}
              <path
                d="M84 182 L76 266 L97 268 L103 184 Z"
                fill="url(#jeansGrad)"
              />
              {/* Rolled Jean Cuff */}
              <rect
                x="75"
                y="262"
                width="23"
                height="7"
                rx="2.5"
                fill="#475569"
              />
              {/* Exposed Ankle */}
              <rect x="81" y="269" width="12" height="8" rx="3" fill="#FCA57A" />
              {/* Blue & White Sneaker */}
              <path
                d="M78 276 Q89 272 103 280 L108 289 Q92 292 75 289 Z"
                fill="#3B82F6"
              />
              {/* White Sneaker Outsole */}
              <path
                d="M74 288 L109 288 L108 294 Q91 295 75 293 Z"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="0.8"
              />
              {/* White Laces */}
              <line x1="90" y1="276" x2="96" y2="278" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="93" y1="280" x2="99" y2="282" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
            </g>

            {/* Right / Front Leg in Cuffed Navy Jeans + Blue Sneaker */}
            <g className={isWalking ? 'animate-boy-leg-right' : ''}>
              {/* Denim leg */}
              <path
                d="M106 182 L114 266 L135 268 L127 182 Z"
                fill="url(#jeansGrad)"
              />
              {/* Subtle vertical denim seam */}
              <line
                x1="122"
                y1="188"
                x2="127"
                y2="262"
                stroke="#475569"
                strokeWidth="1.4"
                strokeDasharray="4 3"
              />
              {/* Rolled Jean Cuff */}
              <rect
                x="113"
                y="262"
                width="23"
                height="7"
                rx="2.5"
                fill="#475569"
              />
              {/* Exposed Ankle */}
              <rect x="119" y="269" width="12" height="8" rx="3" fill="#FCA57A" />
              {/* Blue & White Sneaker */}
              <path
                d="M116 276 Q128 272 142 280 L147 289 Q131 292 114 289 Z"
                fill="#2563EB"
              />
              {/* White Sneaker Outsole */}
              <path
                d="M113 288 L148 288 L147 294 Q130 295 114 293 Z"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="0.8"
              />
              {/* White Laces */}
              <line x1="129" y1="276" x2="135" y2="278" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="132" y1="280" x2="138" y2="282" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
            </g>

            {/* Belt & Denim Waistband */}
            <rect x="81" y="176" width="49" height="12" rx="4" fill="#1E293B" />
            <rect x="102" y="177" width="9" height="9" rx="2" fill="#F59E0B" />

            {/* ============================================================== */}
            {/* BACK ARM (Swings while walking or supports tablet)             */}
            {/* ============================================================== */}
            <g className={isWalking ? 'animate-boy-arm-walk' : ''}>
              <path
                d="M84 106 Q70 132 76 154"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="15"
                strokeLinecap="round"
              />
              <circle cx="76" cy="156" r="7" fill="#FCA57A" />
            </g>

            {/* ============================================================== */}
            {/* CRISP WHITE SHIRT TORSO                                        */}
            {/* ============================================================== */}
            <g>
              {/* Main White Shirt */}
              <path
                d="M80 100 Q105 92 132 100 L133 178 Q106 182 79 178 Z"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />
              {/* Shirt Center Placket & Subtle Fold Shading */}
              <line x1="106" y1="102" x2="106" y2="177" stroke="#E2E8F0" strokeWidth="1.8" />
              <circle cx="106" cy="120" r="1.8" fill="#94A3B8" />
              <circle cx="106" cy="138" r="1.8" fill="#94A3B8" />
              <circle cx="106" cy="156" r="1.8" fill="#94A3B8" />
              {/* Left Collar & Pocket Detail */}
              <polygon points="94,96 106,108 101,95" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
              <polygon points="118,96 106,108 111,95" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
              <path
                d="M114 122 L126 122 L126 135 Q120 139 114 135 Z"
                fill="#F8FAFC"
                stroke="#E2E8F0"
                strokeWidth="1"
              />
            </g>

            {/* ============================================================== */}
            {/* HEAD & WAVY HAIR (CLEAN MODERN VECTOR LOOK LIKE SCREENSHOT 2)  */}
            {/* ============================================================== */}
            <g>
              {/* Neck */}
              <rect x="99" y="80" width="13" height="18" rx="5" fill="#F69B72" />
              {/* Ears */}
              <circle cx="88" cy="67" r="4.5" fill="#F69B72" />
              <circle cx="122" cy="67" r="4.5" fill="#F69B72" />
              {/* Head Silhouette */}
              <ellipse cx="105" cy="64" rx="16.5" ry="19.5" fill="#FCA57A" />
              {/* Friendly Eyes & Subtle Expression */}
              <circle cx="101" cy="63" r="2" fill="#1E293B" />
              <circle cx="112" cy="63" r="2" fill="#1E293B" />
              <path
                d="M101 72 Q107 76 112 72"
                fill="none"
                stroke="#C26D4F"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Stylized Wavy Dark Navy Hair matching Screenshot 2 */}
              <path
                d="M87 64 Q85 41 102 36 Q116 32 126 42 Q132 49 124 56 Q115 51 104 51 Q94 52 89 64 Z"
                fill="#1E293B"
              />
              <circle cx="123" cy="39" r="7" fill="#1E293B" />
            </g>

            {/* ============================================================== */}
            {/* FOREGROUND ARM & PROPS BY ANIMATION STAGE                      */}
            {/* ============================================================== */}
            {/* STAGE: SIDE / WALKING — Holding Rolled Blue & Amber Carpet Cylinder */}
            {isHoldingRoll && (
              <g>
                <g transform="translate(116, 128) rotate(-14)">
                  <rect
                    x="0"
                    y="0"
                    width="64"
                    height="22"
                    rx="11"
                    fill="#E0F2FE"
                    stroke="#38BDF8"
                    strokeWidth="2"
                  />
                  <rect x="0" y="0" width="64" height="7" rx="3.5" fill="#FB7185" />
                  <rect x="16" y="0" width="5" height="22" fill="url(#carpetDrum)" />
                  <rect x="44" y="0" width="5" height="22" fill="url(#carpetDrum)" />
                </g>
                {/* White Shirt Front Sleeve */}
                <path
                  d="M126 104 Q142 126 132 142"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="15"
                  strokeLinecap="round"
                />
                <path
                  d="M126 104 Q142 126 132 142"
                  fill="none"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="131" cy="143" r="7" fill="#FCA57A" />
              </g>
            )}

            {/* STAGE: UNROLLING — Pushing & rolling the carpet out from center */}
            {isUnrolling && (
              <g className="animate-boy-unroll">
                <path
                  d="M127 104 Q152 118 168 136"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="15"
                  strokeLinecap="round"
                />
                <path
                  d="M127 104 Q152 118 168 136"
                  fill="none"
                  stroke="#CBD5E1"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <circle cx="170" cy="138" r="7.5" fill="#FCA57A" />
              </g>
            )}

            {/* STAGE: OPEN — Holding Sleek Tablet beside Form (matches Screenshot 2!) */}
            {isOpen && (
              <g className="animate-boy-tablet">
                {/* White Shirt Sleeve holding Tablet */}
                <path
                  d="M127 105 Q142 128 156 132"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="15"
                  strokeLinecap="round"
                />
                <path
                  d="M127 105 Q142 128 156 132"
                  fill="none"
                  stroke="#CBD5E1"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                {/* Modern Slate Tablet */}
                <g transform="translate(136, 114) rotate(-8)">
                  <rect
                    x="0"
                    y="0"
                    width="36"
                    height="26"
                    rx="4"
                    fill="#334155"
                    stroke="#1E293B"
                    strokeWidth="1.5"
                  />
                  <rect x="4" y="4" width="28" height="18" rx="2" fill="#E0F2FE" />
                  <circle cx="18" cy="13" r="3.5" fill="#38BDF8" />
                </g>
                {/* Hand gripping edge */}
                <circle cx="170" cy="128" r="6" fill="#FCA57A" />
              </g>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}

export function LoginFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/shop';
  const initialMode: AuthMode =
    searchParams.get('mode') === 'register' ? 'register' : 'login';

  const {
    authUser,
    login,
    loginWithGoogle,
    register,
    logout,
    contactSettings,
  } = useStore();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [carpetStage, setCarpetStage] = useState<CarpetStage>('side');

  // Auth & Extended Address Sign-Up Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Current Browser Google Account Sign-In State
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleAccounts, setGoogleAccounts] = useState<CurrentGoogleAccount[]>(
    []
  );
  const [currentGoogleAccount, setCurrentGoogleAccount] =
    useState<CurrentGoogleAccount | null>(null);
  const [showSwitchGoogleForm, setShowSwitchGoogleForm] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);

  // Load the current browser's active Google accounts and backend-detected Google identities
  useEffect(() => {
    let cachedAccount: CurrentGoogleAccount | null = null;
    try {
      const saved = localStorage.getItem(GOOGLE_CURRENT_ACCOUNT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CurrentGoogleAccount;
        const emailLower = parsed.email?.trim().toLowerCase();
        if (emailLower && !PLACEHOLDER_SEED_EMAILS.has(emailLower)) {
          cachedAccount = {
            email: emailLower,
            name: parsed.name,
            googleId: parsed.googleId,
          };
          setCurrentGoogleAccount(cachedAccount);
          setGoogleAccounts([cachedAccount]);
        } else if (emailLower && PLACEHOLDER_SEED_EMAILS.has(emailLower)) {
          localStorage.removeItem(GOOGLE_CURRENT_ACCOUNT_KEY);
        }
      }
    } catch {
      // Ignore storage errors
    }

    let cancelled = false;
    fetch(`${API_BASE_URL}/auth/google/current`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            account?: CurrentGoogleAccount | null;
            accounts?: CurrentGoogleAccount[];
          } | null
        ) => {
          if (cancelled || !data) return;
          const incoming = [
            ...(Array.isArray(data.accounts) ? data.accounts : []),
            ...(data.account ? [data.account] : []),
            ...(cachedAccount ? [cachedAccount] : []),
          ];
          const merged = mergeGoogleAccounts(incoming);
          if (merged.length > 0) {
            setGoogleAccounts(merged);
            setCurrentGoogleAccount(merged[0]);
          }
        }
      )
      .catch(() => {
        // Offline / backend unreachable
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Preload Google Identity Services script so popup triggers synchronously on click
  useEffect(() => {
    if (typeof document === 'undefined' || window.google?.accounts?.oauth2) {
      return;
    }
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  const stageTimersRef = useRef<number[]>([]);

  const clearStageTimers = useCallback(() => {
    stageTimersRef.current.forEach((id) => window.clearTimeout(id));
    stageTimersRef.current = [];
  }, []);

  /**
   * Snappy real foot-walk -> center carpet unroll -> stand alongside open card (~920ms total)
   */
  const playEntrance = useCallback(() => {
    clearStageTimers();

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setCarpetStage('open');
      return;
    }

    setCarpetStage('side');

    const tWalk = window.setTimeout(() => {
      setCarpetStage('walking');
    }, 30);

    const tUnroll = window.setTimeout(() => {
      setCarpetStage('unrolling');
    }, 460);

    const tOpen = window.setTimeout(() => {
      setCarpetStage('open');
    }, 930);

    stageTimersRef.current.push(tWalk, tUnroll, tOpen);
  }, [clearStageTimers]);

  useEffect(() => {
    if (!authUser) {
      playEntrance();
    }
    return () => clearStageTimers();
  }, [mode, authUser, playEntrance, clearStageTimers]);

  const handleModeSwitch = (nextMode: AuthMode) => {
    if (nextMode === mode) return;
    setError('');
    setMode(nextMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const res =
      mode === 'login'
        ? await login(email, password)
        : await register(fullName, email, password, {
            phone,
            address,
            city,
            state: stateProvince,
            zipCode,
          });

    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || 'Unable to sign in. Please check your credentials.');
      return;
    }

    if (res.user?.role === 'ADMIN' && !searchParams.get('redirect')) {
      router.push('/admin');
      return;
    }

    router.push(redirectTarget);
  };

  const handleGoogleAuth = async (
    profileEmail: string,
    profileName: string,
    googleId?: string
  ) => {
    if (!profileEmail.trim() || !profileEmail.includes('@')) {
      setError('Please enter a valid Google email address.');
      return;
    }
    setGoogleBusy(true);
    setError('');
    const normalizedEmail = profileEmail.trim().toLowerCase();
    const resolvedName =
      profileName.trim() ||
      normalizedEmail
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const res = await loginWithGoogle({
      email: normalizedEmail,
      name: resolvedName,
      googleId: googleId || `google-${Date.now()}`,
    });
    setGoogleBusy(false);

    if (!res.ok) {
      setError(res.error || 'Google authentication failed.');
      return;
    }

    const sessionAcct: CurrentGoogleAccount = {
      email: normalizedEmail,
      name: res.user?.name || resolvedName,
      googleId: googleId || `google-${Date.now()}`,
    };
    setCurrentGoogleAccount(sessionAcct);
    setGoogleAccounts((prev) => mergeGoogleAccounts([...prev, sessionAcct]));
    try {
      localStorage.setItem(
        GOOGLE_CURRENT_ACCOUNT_KEY,
        JSON.stringify(sessionAcct)
      );
    } catch {
      // Ignore storage errors
    }

    setGoogleModalOpen(false);
    setShowSwitchGoogleForm(false);
    if (
      (res.user?.role === 'ADMIN' || res.user?.role === 'EDITOR') &&
      !searchParams.get('redirect')
    ) {
      router.push('/admin');
      return;
    }
    router.push(redirectTarget);
  };

  /**
   * Launches Google OAuth:
   * 1. If a Google Cloud OAuth Web Client ID is configured, invokes native Google Identity OAuth (`select_account`).
   * 2. Otherwise opens the dark Google v3 "Choose an account" chooser dialog matching accounts.google.com/v3.
   */
  const handleContinueWithGoogle = async () => {
    setError('');
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
      contactSettings.googleClientId?.trim() ||
      DEFAULT_GOOGLE_CLIENT_ID;

    const invokeGoogleOAuth = () => {
      const oauth2 = window.google?.accounts?.oauth2;
      if (!oauth2) return false;
      const client = oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        prompt: 'select_account',
        callback: async (tokenResp) => {
          if (!tokenResp.access_token) {
            setGoogleBusy(false);
            setShowSwitchGoogleForm(false);
            setGoogleModalOpen(true);
            return;
          }
          try {
            const infoRes = await fetch(
              'https://www.googleapis.com/oauth2/v3/userinfo',
              {
                headers: {
                  Authorization: `Bearer ${tokenResp.access_token}`,
                },
              }
            );
            const info = (await infoRes.json()) as {
              email?: string;
              name?: string;
              sub?: string;
            };
            if (info.email) {
              await handleGoogleAuth(info.email, info.name || '', info.sub);
              return;
            }
          } catch {
            // Fallback below
          }
          setGoogleBusy(false);
          setShowSwitchGoogleForm(false);
          setGoogleModalOpen(true);
        },
        error_callback: () => {
          setGoogleBusy(false);
          setShowSwitchGoogleForm(false);
          setGoogleModalOpen(true);
        },
      });
      client.requestAccessToken();
      return true;
    };

    if (clientId) {
      setGoogleBusy(true);
      // Trigger synchronously when GSI is already loaded so Chrome allows the popup
      if (window.google?.accounts?.oauth2 && invokeGoogleOAuth()) {
        return;
      }

      try {
        if (!window.google?.accounts?.oauth2) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>(
              'script[src="https://accounts.google.com/gsi/client"]'
            );
            const script = existing || document.createElement('script');
            const onLoad = () => resolve();
            const onError = () => reject(new Error('Google script failed'));
            script.addEventListener('load', onLoad, { once: true });
            script.addEventListener('error', onError, { once: true });
            if (!existing) {
              script.src = 'https://accounts.google.com/gsi/client';
              script.async = true;
              document.head.appendChild(script);
            }
          });
        }

        if (invokeGoogleOAuth()) {
          return;
        }
      } catch {
        // Fallback if GSI is blocked offline
      }
      setGoogleBusy(false);
    }

    setShowSwitchGoogleForm(googleAccounts.length === 0);
    setGoogleModalOpen(true);
  };

  if (authUser) {
    return (
      <div className="atelier-card mx-auto mt-6 max-w-md rounded-3xl p-8">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8C4A27]/12 text-[#8C4A27]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="font-serif text-sm italic text-[#8C4A27]">
              Atelier Vance Member
            </p>
            <h1 className="font-condensed text-3xl uppercase tracking-tight text-stone-900">
              Welcome, {authUser.name}
            </h1>
          </div>
        </div>

        <div className="mt-6 space-y-2 rounded-2xl border border-stone-900/10 bg-[#F6F3EC] p-4 text-xs text-stone-700">
          <p>
            <span className="text-stone-500">Email:</span>{' '}
            <span className="font-medium text-stone-900">{authUser.email}</span>
          </p>
          {authUser.city && (
            <p>
              <span className="text-stone-500">Location:</span>{' '}
              <span className="font-medium text-stone-900">
                {[authUser.address, authUser.city, authUser.zipCode]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </p>
          )}
          <p>
            <span className="text-stone-500">Role:</span>{' '}
            <span className="font-medium text-stone-900">{authUser.role}</span>
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/shop"
            className="btn-atelier inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-xs font-semibold"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <Link
            href="/checkout"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-900/15 bg-[#EFECE4] px-5 text-xs font-semibold text-stone-900 transition hover:border-[#8C4A27]/45"
          >
            <span>Go to Checkout</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#8C4A27]" />
          </Link>

          {(authUser.role === 'ADMIN' || authUser.role === 'EDITOR') && (
            <Link
              href="/admin"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#8C4A27]/30 bg-[#8C4A27]/8 px-5 text-xs font-semibold text-[#8C4A27] transition hover:bg-[#8C4A27] hover:text-white"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Open Admin Studio</span>
            </Link>
          )}

          <button
            type="button"
            onClick={logout}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-stone-900/10 text-xs font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  const isCarpetUnrolling =
    carpetStage === 'unrolling' || carpetStage === 'open';
  const isOpen = carpetStage === 'open';

  // Boy position transitions smoothly across stage:
  // Sign In: Left edge ('side') -> Center ('walking'/'unrolling') -> Standing LEFT of form ('open')
  // Sign Up: Right edge ('side') -> Center ('walking'/'unrolling') -> Standing RIGHT of form ('open')
  let boyDesktopPosition = '';
  if (mode === 'login') {
    if (carpetStage === 'side') {
      boyDesktopPosition = 'md:left-0 md:-translate-x-24 md:opacity-0';
    } else if (carpetStage === 'walking' || carpetStage === 'unrolling') {
      boyDesktopPosition =
        'md:left-1/2 md:-translate-x-1/2 md:z-30 md:opacity-100';
    } else {
      boyDesktopPosition =
        'md:left-2 lg:left-6 md:translate-x-0 md:z-20 md:opacity-100';
    }
  } else {
    if (carpetStage === 'side') {
      boyDesktopPosition = 'md:left-full md:translate-x-6 md:opacity-0';
    } else if (carpetStage === 'walking' || carpetStage === 'unrolling') {
      boyDesktopPosition =
        'md:left-1/2 md:-translate-x-1/2 md:z-30 md:opacity-100';
    } else {
      boyDesktopPosition =
        'md:left-[calc(100%-13.5rem)] lg:left-[calc(100%-14rem)] md:translate-x-0 md:z-20 md:opacity-100';
    }
  }

  return (
    <>
      {/* Main Interactive Theater Stage (Cleanly sits right below the header) */}
      <div className="relative mx-auto flex min-h-[590px] flex-col items-center justify-center overflow-hidden rounded-[34px] border border-sky-200/70 bg-white/85 px-4 py-7 shadow-[0_24px_70px_rgba(30,41,59,0.08)] sm:px-8 md:block md:py-10">
        {/* Soft Sky-Blue Organic Backdrop Blob & Minimal Clouds (inspired by Screenshot 2) */}
        <svg
          viewBox="0 0 1100 620"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <path
            d="M270 110 Q420 20 620 48 Q840 78 860 250 Q885 450 720 555 Q490 605 290 520 Q140 450 185 260 Q205 170 270 110 Z"
            fill="#C7E3FE"
            opacity="0.72"
          />
          <path
            d="M240 240 Q320 210 380 280 Q440 350 280 410"
            fill="none"
            stroke="#93C5FD"
            strokeWidth="2"
            opacity="0.45"
          />
          <path
            d="M780 180 Q850 250 760 340 Q700 400 790 480"
            fill="none"
            stroke="#93C5FD"
            strokeWidth="2"
            opacity="0.45"
          />
          {/* Minimal Cloud Accents */}
          <path
            d="M110 155 Q125 135 150 140 Q168 122 192 138 Q210 140 212 155 Z"
            fill="#F6ECE4"
          />
          <path
            d="M860 110 Q875 94 896 98 Q912 82 934 96 Q950 100 950 110 Z"
            fill="#F6ECE4"
          />
          <path
            d="M915 245 Q930 232 948 236 Q962 224 980 235 Q992 238 992 245 Z"
            fill="#F6ECE4"
          />
          {/* Coral Leaf Botanical Sprig Bottom-Right */}
          <g transform="translate(755, 455)" fill="#FDA4AF" opacity="0.85">
            <path d="M22 105 Q40 50 75 8" fill="none" stroke="#FB7185" strokeWidth="2.5" />
            <ellipse cx="45" cy="70" rx="14" ry="5" transform="rotate(-35 45 70)" />
            <ellipse cx="62" cy="52" rx="13" ry="5" transform="rotate(-38 62 52)" />
            <ellipse cx="75" cy="34" rx="11" ry="4.5" transform="rotate(-40 75 34)" />
            <ellipse cx="32" cy="60" rx="12" ry="4.5" transform="rotate(28 32 60)" />
            <ellipse cx="48" cy="42" rx="11" ry="4.5" transform="rotate(25 48 42)" />
          </g>
        </svg>

        {/* Animated Boy in White Shirt & Jeans */}
        <div
          className={`relative z-20 mb-4 transition-all duration-[440ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:absolute md:bottom-8 md:mb-0 ${boyDesktopPosition}`}
        >
          <CasualBoyCharacter mode={mode} stage={carpetStage} />
        </div>

        {/* Center Unrolling Carpet Runner & Crisp Browser-Window Card */}
        <div className="relative z-10 mx-auto w-full max-w-[500px]">
          <div className="relative">
            {/* Unrolling Woven Carpet Wrapper (`clipPath` smoothly expands down over 480ms!) */}
            <div
              className="relative overflow-hidden rounded-[24px] p-2 shadow-[0_24px_60px_rgba(37,99,235,0.18)] transition-[clip-path,opacity] duration-[470ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-2.5"
              style={{
                clipPath: isCarpetUnrolling
                  ? 'inset(0% 0% 0% 0% round 24px)'
                  : carpetStage === 'walking'
                  ? 'inset(0% 0% 93% 0% round 24px)'
                  : 'inset(0% 0% 100% 0% round 24px)',
                opacity: carpetStage === 'side' ? 0 : 1,
                background:
                  'linear-gradient(135deg, #F43F5E 0%, #E11D48 48%, #9F1239 100%)',
              }}
            >
              {/* Crisp White Browser-Style Form Card Emerging From the Unrolled Carpet */}
              <div
                className={`overflow-hidden rounded-[18px] bg-white shadow-xl transition-all duration-400 ease-out ${
                  isOpen
                    ? 'translate-y-0 scale-100 opacity-100'
                    : 'translate-y-4 scale-95 opacity-95'
                }`}
              >
                {/* Modern Coral Top Window Chrome Bar (Screenshot 2 Motif) */}
                <div className="flex items-center justify-between bg-[#FB4B68] px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/75" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/60" />
                  </div>
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-white/90">
                    {mode === 'login' ? 'Member Sign In' : 'Registration'}
                  </span>
                </div>

                {/* Inner Form Surface */}
                <div className="px-5 py-5 sm:px-7 sm:py-6">
                  {/* Minimal Avatar Crest & Heading */}
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FEF3C7] text-[#F59E0B] shadow-inner">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <h1 className="mt-2 font-sans text-xl font-bold tracking-tight text-slate-900">
                      {mode === 'login' ? 'Sign In' : 'Registration'}
                    </h1>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {mode === 'login'
                        ? 'Access your bag, saved addresses & fast checkout.'
                        : 'Create your Atelier Vance account with delivery details.'}
                    </p>
                  </div>

                  {/* Clean Mode Switch Tabs (Switches Boy From Left <-> Right!) */}
                  <div className="mt-4 grid grid-cols-2 rounded-full bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('login')}
                      className={`rounded-full py-1.5 text-xs font-semibold transition ${
                        mode === 'login'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('register')}
                      className={`rounded-full py-1.5 text-xs font-semibold transition ${
                        mode === 'register'
                          ? 'bg-[#3B82F6] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    disabled={googleBusy}
                    onClick={handleContinueWithGoogle}
                    className="mt-3.5 flex h-9 w-full items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <GoogleGIcon className="h-4 w-4 shrink-0" />
                    <span>
                      {googleBusy ? 'Connecting Google...' : 'Continue with Google'}
                    </span>
                  </button>

                  <form onSubmit={handleSubmit} className="mt-3.5 space-y-2.5">
                    {mode === 'register' && (
                      <>
                        {/* First & Last Name */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label
                              htmlFor="auth-first-name"
                              className="mb-1 block text-[11px] font-medium text-slate-600"
                            >
                              First Name
                            </label>
                            <input
                              id="auth-first-name"
                              type="text"
                              required
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="Hannah"
                              className="h-9 w-full rounded-xl border border-sky-100 bg-[#EFF6FF] px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#3B82F6] focus:bg-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="auth-last-name"
                              className="mb-1 block text-[11px] font-medium text-slate-600"
                            >
                              Last Name
                            </label>
                            <input
                              id="auth-last-name"
                              type="text"
                              required
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Lindstrom"
                              className="h-9 w-full rounded-xl border border-sky-100 bg-[#EFF6FF] px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#3B82F6] focus:bg-white focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Phone & Street Address */}
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="auth-phone"
                              className="mb-1 block text-[11px] font-medium text-slate-600"
                            >
                              Phone Number
                            </label>
                            <div className="relative">
                              <Phone className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                              <input
                                id="auth-phone"
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 (555) 234-5678"
                                className="h-9 w-full rounded-xl border border-sky-100 bg-[#EFF6FF] pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#3B82F6] focus:bg-white focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor="auth-address"
                              className="mb-1 block text-[11px] font-medium text-slate-600"
                            >
                              Street Address
                            </label>
                            <div className="relative">
                              <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                              <input
                                id="auth-address"
                                type="text"
                                required
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="240 Mercer St, Apt 4B"
                                className="h-9 w-full rounded-xl border border-sky-100 bg-[#EFF6FF] pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#3B82F6] focus:bg-white focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* City, State & Zip Code */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label
                              htmlFor="auth-city"
                              className="mb-1 block text-[11px] font-medium text-slate-600"
                            >
                              City
                            </label>
                            <input
                              id="auth-city"
                              type="text"
                              required
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="New York"
                              className="h-9 w-full rounded-xl border border-sky-100 bg-[#EFF6FF] px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#3B82F6] focus:bg-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="auth-state"
                              className="mb-1 block text-[11px] font-medium text-slate-600"
                            >
                              State
                            </label>
                            <input
                              id="auth-state"
                              type="text"
                              required
                              value={stateProvince}
                              onChange={(e) => setStateProvince(e.target.value)}
                              placeholder="NY"
                              className="h-9 w-full rounded-xl border border-sky-100 bg-[#EFF6FF] px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#3B82F6] focus:bg-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="auth-zip"
                              className="mb-1 block text-[11px] font-medium text-slate-600"
                            >
                              Zip Code
                            </label>
                            <input
                              id="auth-zip"
                              type="text"
                              required
                              value={zipCode}
                              onChange={(e) => setZipCode(e.target.value)}
                              placeholder="10012"
                              className="h-9 w-full rounded-xl border border-sky-100 bg-[#EFF6FF] px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#3B82F6] focus:bg-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Email Field */}
                    <div>
                      <label
                        htmlFor="auth-email"
                        className="mb-1 block text-[11px] font-medium text-slate-600"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          id="auth-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="h-9 w-full rounded-xl border border-sky-100 bg-[#EFF6FF] pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#3B82F6] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label
                        htmlFor="auth-password"
                        className="mb-1 block text-[11px] font-medium text-slate-600"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          id="auth-password"
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-9 w-full rounded-xl border border-sky-100 bg-[#EFF6FF] pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#3B82F6] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] px-6 text-xs font-bold text-slate-950 shadow-md transition hover:brightness-105 active:scale-[0.985] disabled:opacity-50"
                    >
                      <span>
                        {submitting
                          ? 'Please wait...'
                          : mode === 'login'
                          ? 'Sign In'
                          : 'Create Account'}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Physical Rolling Carpet Cylinder Bar Tracking the Unroll Edge */}
            <div
              className={`pointer-events-none mx-auto h-4 w-[96%] rounded-full border border-amber-400/70 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-lg transition-all duration-[470ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isOpen
                  ? 'translate-y-1 scale-x-95 scale-y-75 opacity-80'
                  : isCarpetUnrolling
                  ? 'translate-y-0 scale-100 opacity-100'
                  : '-translate-y-12 scale-75 opacity-0'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Google v3 Dark Account Chooser Dialog (accounts.google.com/v3 aesthetic) */}
      {googleModalOpen && (
        <div
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#0E0E0E]/95 p-4 text-[#E3E3E3]"
          role="dialog"
          aria-modal="true"
          aria-label="Sign in with Google"
        >
          <div className="w-full max-w-[820px] overflow-hidden rounded-[28px] bg-[#1E1F20] shadow-[0_24px_64px_rgba(0,0,0,0.65)] ring-1 ring-white/10">
            {/* Top Google Chrome Header */}
            <div className="flex items-center justify-between border-b border-[#3C4043] px-7 py-3.5">
              <div className="flex items-center gap-3">
                <GoogleGIcon className="h-[18px] w-[18px]" />
                <span className="text-sm font-normal text-[#E3E3E3]">
                  Sign in with Google
                </span>
              </div>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(false)}
                className="rounded-full p-1.5 text-[#C4C7C5] transition hover:bg-white/10 hover:text-white"
                aria-label="Close Google sign-in"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Two-Column Google v3 Account Chooser Body */}
            <div className="grid grid-cols-1 gap-8 px-7 py-8 sm:px-10 sm:py-10 md:grid-cols-12">
              {/* Left Brand & Title Column */}
              <div className="flex flex-col justify-start md:col-span-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#131314] ring-1 ring-white/10">
                  <svg
                    className="h-6 w-6 text-[#10B981]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3v9m0 0-4-4m4 4 4-4" />
                    <path d="M4 17l8-4 8 4-8 4-8-4Z" />
                  </svg>
                </div>
                <h2 className="mt-6 font-sans text-3xl font-normal tracking-tight text-[#E3E3E3] sm:text-[36px]">
                  {showSwitchGoogleForm ? 'Sign in' : 'Choose an account'}
                </h2>
                <p className="mt-2.5 text-base text-[#E3E3E3]">
                  to continue to{' '}
                  <span className="font-medium text-[#8AB4F8]">
                    Atelier Vance
                  </span>
                </p>
              </div>

              {/* Right Account List / Sign-In Form Column */}
              <div className="flex flex-col justify-center md:col-span-6">
                {error && (
                  <div className="mb-4 rounded-xl border border-red-400/30 bg-red-950/50 px-3.5 py-2.5 text-xs text-red-200">
                    {error}
                  </div>
                )}

                {googleAccounts.length > 0 && !showSwitchGoogleForm ? (
                  <div>
                    <div className="divide-y divide-[#3C4043] border-b border-[#3C4043]">
                      {googleAccounts.map((acc, idx) => (
                        <button
                          key={acc.email}
                          type="button"
                          disabled={googleBusy}
                          onClick={() =>
                            handleGoogleAuth(acc.email, acc.name, acc.googleId)
                          }
                          className="flex w-full items-center gap-3.5 px-3 py-3.5 text-left transition hover:bg-[#2A2B2E] disabled:opacity-50"
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                              idx % 2 === 0 ? 'bg-[#00897B]' : 'bg-[#1A73E8]'
                            }`}
                          >
                            {acc.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[#E3E3E3]">
                              {acc.name}
                            </p>
                            <p className="truncate text-xs text-[#C4C7C5]">
                              {acc.email}
                            </p>
                          </div>
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setShowSwitchGoogleForm(true);
                        }}
                        className="flex w-full items-center gap-3.5 px-3 py-3.5 text-left text-sm font-medium text-[#E3E3E3] transition hover:bg-[#2A2B2E]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C4C7C5]/40 text-[#C4C7C5]">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <span>Use another account</span>
                      </button>
                    </div>

                    <p className="mt-6 text-xs leading-relaxed text-[#C4C7C5]">
                      Before using this app, you can review Atelier Vance&apos;s{' '}
                      <Link
                        href="/about"
                        onClick={() => setGoogleModalOpen(false)}
                        className="font-medium text-[#8AB4F8] hover:underline"
                      >
                        Privacy Policy
                      </Link>{' '}
                      and{' '}
                      <Link
                        href="/faq"
                        onClick={() => setGoogleModalOpen(false)}
                        className="font-medium text-[#8AB4F8] hover:underline"
                      >
                        Terms of Service
                      </Link>
                      .
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleGoogleAuth(googleEmail, googleName);
                    }}
                    className="space-y-4"
                  >
                    <p className="text-xs leading-relaxed text-[#C4C7C5]">
                      Enter your Google email to continue to Atelier Vance.
                    </p>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#C4C7C5]">
                        Email or phone
                      </label>
                      <input
                        type="email"
                        required
                        value={googleEmail}
                        onChange={(e) => setGoogleEmail(e.target.value)}
                        placeholder="you@gmail.com"
                        className="w-full rounded-lg border border-[#8E918F] bg-transparent px-3.5 py-3 text-sm text-[#E3E3E3] placeholder:text-[#8E918F] focus:border-[#8AB4F8] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#C4C7C5]">
                        Display Name (optional)
                      </label>
                      <input
                        type="text"
                        value={googleName}
                        onChange={(e) => setGoogleName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full rounded-lg border border-[#8E918F] bg-transparent px-3.5 py-3 text-sm text-[#E3E3E3] placeholder:text-[#8E918F] focus:border-[#8AB4F8] focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      {googleAccounts.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setError('');
                            setShowSwitchGoogleForm(false);
                          }}
                          className="text-xs font-medium text-[#8AB4F8] hover:underline"
                        >
                          Back to accounts
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="submit"
                        disabled={googleBusy}
                        className="rounded-full bg-[#8AB4F8] px-6 py-2 text-xs font-semibold text-[#062E6F] transition hover:bg-[#A8C7FA] disabled:opacity-50"
                      >
                        {googleBusy ? 'Signing in...' : 'Next'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Outer Google v3 Footer Links */}
          <div className="mt-4 flex w-full max-w-[820px] items-center justify-between px-2 text-xs text-[#C4C7C5]">
            <span>English (United Kingdom)</span>
            <div className="flex items-center gap-6">
              <Link
                href="/faq"
                onClick={() => setGoogleModalOpen(false)}
                className="hover:text-white"
              >
                Help
              </Link>
              <Link
                href="/about"
                onClick={() => setGoogleModalOpen(false)}
                className="hover:text-white"
              >
                Privacy
              </Link>
              <Link
                href="/faq"
                onClick={() => setGoogleModalOpen(false)}
                className="hover:text-white"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
