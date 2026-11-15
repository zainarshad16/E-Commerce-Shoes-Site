import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginFormClient } from '@/components/storefront/LoginFormClient';

export const metadata: Metadata = {
  title: 'Sign In & Account | Atelier Vance',
  description:
    'Sign in or create an Atelier Vance account to save your bag, track orders, and check out.',
};

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] overflow-x-hidden bg-gradient-to-b from-[#F6F3EC] via-[#F2EDE2] to-[#EAE2D3] px-4 pt-3 pb-10 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Suspense
          fallback={
            <div className="mx-auto max-w-md rounded-3xl border border-stone-900/10 bg-white p-8 text-center font-mono text-xs text-stone-500 shadow-sm">
              Loading account sign-in...
            </div>
          }
        >
          <LoginFormClient />
        </Suspense>
      </div>
    </main>
  );
}
