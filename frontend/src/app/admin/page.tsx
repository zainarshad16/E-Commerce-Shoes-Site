import type { Metadata } from 'next';
import { AdminStudioClient } from '@/components/admin/AdminStudioClient';

export const metadata: Metadata = {
  title: 'Atelier Vance | Store Admin & Editorial CMS',
  description:
    'Protected Atelier Vance footwear storefront control panel, journal CMS, order fulfillment desk, and live site preview.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminStudioClient />;
}

