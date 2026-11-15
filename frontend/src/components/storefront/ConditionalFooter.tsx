'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

/**
 * Renders the multi-column site Footer on inner catalog/CMS routes,
 * while letting Section 8 (`FinalCtaSection`) serve as the minimal footer on `/`.
 */
export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return <Footer />;
}

