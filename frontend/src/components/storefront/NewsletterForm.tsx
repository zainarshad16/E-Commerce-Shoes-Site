'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export function NewsletterForm({
  placeholder,
  ctaText,
}: {
  placeholder: string;
  ctaText: string;
}) {
  const { activeGlow } = useStore();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail('');
  }

  if (submitted) {
    return (
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 font-mono text-xs text-emerald-300">
        <CheckCircle2 className="h-4 w-4" />
        <span>ENCRYPTED PRIORITY ACCESS CONFIRMED</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-6 flex max-w-lg flex-col gap-3 sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-full border border-white/15 bg-black/60 px-5 py-3.5 font-mono text-xs text-white outline-none focus:border-white/40"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-mono text-xs font-bold text-[#09090B] transition hover:brightness-110"
        style={{ backgroundColor: activeGlow.primary }}
      >
        <span>{ctaText}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

