import type { Metadata } from 'next';
import {
  Anton,
  Cormorant_Garamond,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
  Syne,
} from 'next/font/google';
import './globals.css';
import {
  getBlogs,
  getPageSections,
  getProducts,
  getSiteSeoConfig,
} from '@/lib/api';
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
} from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { StoreProvider } from '@/context/StoreContext';
import { Navbar } from '@/components/storefront/Navbar';
import { ConditionalFooter } from '@/components/storefront/ConditionalFooter';
import { CartDrawer } from '@/components/storefront/CartDrawer';
import { ComparisonModal } from '@/components/storefront/ComparisonModal';
import { AtelierDoorTransition } from '@/components/storefront/AtelierDoorTransition';
import { AtelierChatbotAndWhatsApp } from '@/components/storefront/AtelierChatbotAndWhatsApp';
import { AtelierCookieConsent } from '@/components/storefront/AtelierCookieConsent';

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-condensed',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const seoConfig = await getSiteSeoConfig();
  return {
    metadataBase: new URL(seoConfig.siteUrl || 'https://ateliervance.com'),
    title: {
      default: seoConfig.defaultMetaTitle,
      template: `%s`,
    },
    description: seoConfig.defaultMetaDescription,
    openGraph: {
      title: seoConfig.defaultMetaTitle,
      description: seoConfig.defaultMetaDescription,
      url: seoConfig.siteUrl,
      siteName: seoConfig.siteName,
      images: [{ url: seoConfig.defaultOgImage }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoConfig.defaultMetaTitle,
      description: seoConfig.defaultMetaDescription,
      images: [seoConfig.defaultOgImage],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [products, sections, seoConfig, blogs] = await Promise.all([
    getProducts(false),
    getPageSections('home'),
    getSiteSeoConfig(),
    getBlogs(false),
  ]);

  const orgSchema = buildOrganizationSchema(seoConfig);
  const webSiteSchema = buildWebSiteSchema(seoConfig);

  return (
    <html
      lang="en"
      className={`${anton.variable} ${cormorant.variable} ${syne.variable} ${jakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#F6F3EC] font-sans text-[#18181B] antialiased">
        <JsonLd data={[orgSchema, webSiteSchema]} />
        <StoreProvider
          initialProducts={products}
          initialSections={sections}
          initialSeoConfig={seoConfig}
          initialBlogs={blogs}
        >
          <AtelierDoorTransition />
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <ConditionalFooter />
          </div>
          <CartDrawer />
          <ComparisonModal />
          <AtelierCookieConsent />
          <AtelierChatbotAndWhatsApp />
        </StoreProvider>
      </body>
    </html>
  );
}
