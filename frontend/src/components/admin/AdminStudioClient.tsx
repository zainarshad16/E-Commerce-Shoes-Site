'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Copy,
  Eye,
  EyeOff,
  FileCode2,
  Globe,
  HelpCircle,
  KeyRound,
  Layers,
  Lock,
  Mail,
  MessageCircle,
  Monitor,
  MoveDown,
  MoveUp,
  Package,
  PanelRight,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShoppingBag,
  Sliders,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  Users,
  ShieldCheck,
  Cpu,
  Zap,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { API_BASE_URL } from '@/lib/config';
import { buildFaqSchema } from '@/lib/seo';
import {
  AdminTabKey,
  BlogPost,
  ColorwayVariant,
  FaqItem,
  ManagedUser,
  Order,
  OrderStatus,
  PageSection,
  PageSectionType,
  Product,
  RolePermissionsConfig,
  ScrollHotspot,
  Vector3Coords,
} from '@/types/cms';
import { NewsletterForm } from '@/components/storefront/NewsletterForm';
import { SneakerStudioThumb } from '@/components/storefront/SneakerStudioThumb';

const ShoeStage = dynamic(() => import('@/components/three/ShoeStage'), {
  ssr: false,
});

type MainAdminTab = AdminTabKey;

const DEFAULT_EDITOR_TABS: MainAdminTab[] = [
  'products',
  'blogs',
  'section-hero',
  'section-statement',
  'section-faq',
  'section-newsletter',
  'global-seo',
];

const ASSIGNABLE_ROLE_TABS: {
  id: MainAdminTab;
  label: string;
  description: string;
  category: 'Editing' | 'Operations';
}[] = [
  {
    id: 'products',
    label: 'Products & 3D Studio',
    description: 'Edit catalog products, 3D GLB models, hotspots & variants',
    category: 'Editing',
  },
  {
    id: 'blogs',
    label: 'Blog & Journal',
    description: 'Create and edit journal stories & markdown articles',
    category: 'Editing',
  },
  {
    id: 'section-hero',
    label: 'Hero Section',
    description: 'Edit hero headline, subtitle, 3D sneaker & CTA',
    category: 'Editing',
  },
  {
    id: 'section-statement',
    label: 'Statement Band',
    description: 'Edit mid-page editorial statement & marquee',
    category: 'Editing',
  },
  {
    id: 'section-faq',
    label: 'FAQ Accordion',
    description: 'Edit customer FAQ questions & JSON-LD schema',
    category: 'Editing',
  },
  {
    id: 'section-newsletter',
    label: 'Newsletter Band',
    description: 'Edit footer newsletter signup copy & callout',
    category: 'Editing',
  },
  {
    id: 'global-seo',
    label: 'Global SEO & Nav',
    description: 'Edit site title, meta tags & navigation links',
    category: 'Editing',
  },
  {
    id: 'orders',
    label: 'Orders',
    description: 'View & update customer order fulfillment status',
    category: 'Operations',
  },
  {
    id: 'contact-chat',
    label: 'Contact & AI Chatbot',
    description: 'Manage WhatsApp, phone, email & AI chatbot prompt',
    category: 'Operations',
  },
];

type ProductSubTab =
  | 'general'
  | 'variants'
  | 'inventory'
  | 'specs'
  | 'hotspots'
  | 'seo';

type PreviewLayoutMode = 'split' | 'editor' | 'preview';
type PreviewScope =
  | 'contextual'
  | 'full-home'
  | 'hero'
  | 'product-detail'
  | 'product-card'
  | 'blog-post';

const US_SIZE_PRESETS = ['US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12', 'US 13'];

function createDefaultSizes(prefix: string) {
  return US_SIZE_PRESETS.map((sizeLabel, idx) => ({
    id: `${prefix.toLowerCase()}-sz-${Date.now()}-${idx}`,
    sizeLabel,
    sku: `${prefix}-${sizeLabel.replace(/\s+/g, '')}`,
    stockCount: 8,
  }));
}

function createBlankProduct(orderIndex: number): Product {
  const stamp = Date.now().toString().slice(-4);
  const slug = `aether-proto-${stamp}`;
  const skuPrefix = `AP${stamp}`;
  const poster = '/images/shoes/espresso-hightop.png';

  return {
    id: `new-prod-${Date.now()}`,
    slug,
    name: `AETHER PROTO ${stamp}`,
    tagline: 'Carbon-Reinforced Technical Streetwear Silhouette',
    description:
      'Engineered with dual-density nitrogen foam cushioning, split aerospace carbon propulsion plate, and breathable ballistic mesh upper.',
    richStoryHtml:
      '<p>Developed inside the AETHER biomechanics lab for responsive energy return and nocturnal architectural styling.</p>',
    basePrice: 360,
    category: 'Performance Runner',
    collectionSlug: 'cyber-runner',
    isFeaturedHero: true,
    displayOrder: orderIndex,
    published: true,
    metaTitle: `AETHER PROTO ${stamp} Sneaker | AETHER LABS`,
    metaDescription:
      'Shop AETHER PROTO luxury carbon streetwear sneaker with real-time 3D inspection and global express delivery.',
    ogImageUrl: poster,
    keywords: ['luxury sneaker', 'carbon runner', 'aether labs'],
    specsJson: {
      Weight: '255g (US 9)',
      Midsole: 'Nitrogen-Infused PEBAX',
      Propulsion: '2.4mm Split Carbon Plate',
      Upper: 'Ballistic Ripstop Mesh',
    },
    ratingValue: 4.9,
    reviewCount: 12,
    updatedAt: new Date().toISOString(),
    variants: [
      {
        id: `new-var-${Date.now()}`,
        colorName: 'Acid Volt / Noir',
        skuPrefix,
        primaryGlowHex: '#CCFF00',
        secondaryAccentHex: '#10B981',
        glbModelUrl: poster,
        posterImageUrl: poster,
        galleryImages: [poster],
        altText: `AETHER PROTO ${stamp} sneaker in Acid Volt and Noir`,
        sizes: createDefaultSizes(skuPrefix),
      },
    ],
    hotspots: [
      {
        id: `new-hs-${Date.now()}`,
        scrollPercentage: 25,
        title: 'AEROSPACE CARBON SPINE',
        subtitle: '2.4mm split propulsion plate delivers rapid heel-to-toe energy snap.',
        cameraPosition: { x: 2.6, y: 1.1, z: 2.9 },
        cameraTarget: { x: 0, y: 0.1, z: 0 },
      },
    ],
  };
}

function getSilhouetteVariant(slug: string): 'runner' | 'high' | 'sculpt' | 'zero' {
  const s = slug.toLowerCase();
  if (s.includes('heritage') || s.includes('mocha') || s.includes('highland') || s.includes('vortex')) {
    return 'high';
  }
  if (s.includes('camden') || s.includes('mercer') || s.includes('kinetix') || s.includes('sculpt')) {
    return 'sculpt';
  }
  if (s.includes('crosby') || s.includes('suede') || s.includes('nebula') || s.includes('zero')) {
    return 'zero';
  }
  return 'runner';
}

function createBlankBlog(relatedProductSlug: string): BlogPost {
  const stamp = Date.now().toString().slice(-4);
  return {
    id: `blog-draft-${Date.now()}`,
    slug: `workshop-story-${stamp}`,
    title: `Workshop Notes: New Edition ${stamp}`,
    subtitle: 'Hand-selected leathers, small-batch patterns, and lasting daily comfort.',
    excerpt:
      'A closer look inside the Atelier Vance workshop as we examine materials, lasting geometry, and everyday wear tests.',
    category: 'Craft & Materials',
    author: 'Claire Vance',
    authorRole: 'Co-Founder & Lastmaker',
    publishedAt: new Date().toISOString().slice(0, 10),
    readTime: '4 min read',
    coverImage: '/images/shoes/espresso-hightop.png',
    relatedProductSlug,
    tags: ['Craft', 'Footwear Care'],
    sections: [
      {
        heading: 'Designing for Real Days',
        body: 'Write the main narrative section here — describe how the leather breaks in, how the outsole performs in daily walking, and why the silhouette belongs in a timeless rotation.',
      },
    ],
    published: true,
    featured: false,
  };
}

/* -------------------------------------------------------------------------- */
/* Real-Time Storefront Preview Component                                     */
/* -------------------------------------------------------------------------- */
function AdminLiveSitePreview({
  activeTab,
  previewScope,
  setPreviewScope,
  previewViewport,
  setPreviewViewport,
  products,
  selectedProduct,
  selectedVariant,
  selectedBlog,
  sortedSections,
  seoConfig,
}: {
  activeTab: MainAdminTab;
  previewScope: PreviewScope;
  setPreviewScope: (s: PreviewScope) => void;
  previewViewport: 'desktop' | 'mobile';
  setPreviewViewport: (v: 'desktop' | 'mobile') => void;
  products: Product[];
  selectedProduct?: Product;
  selectedVariant?: ColorwayVariant;
  selectedBlog?: BlogPost;
  sortedSections: PageSection[];
  seoConfig: ReturnType<typeof useStore>['seoConfig'];
}) {
  const heroSection = sortedSections.find((s) => s.sectionType === 'HERO_CONFIG');
  const statementSection = sortedSections.find(
    (s) => s.sectionType === 'STATEMENT_BANNER'
  );
  const faqSection = sortedSections.find((s) => s.sectionType === 'FAQ_LIST');
  const newsletterSection = sortedSections.find(
    (s) => s.sectionType === 'NEWSLETTER'
  );

  const heroContent = (heroSection?.contentJson || {}) as {
    eyebrow?: string;
    headline?: string;
    subheadline?: string;
    primaryCtaText?: string;
    primaryCtaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
  };
  const statementContent = (statementSection?.contentJson || {}) as {
    kicker?: string;
    headline?: string;
    body?: string;
    metrics?: { label: string; value: string }[];
  };
  const faqContent = (faqSection?.contentJson || {}) as {
    heading?: string;
    subheading?: string;
    items?: FaqItem[];
  };
  const newsletterContent = (newsletterSection?.contentJson || {}) as {
    heading?: string;
    subheading?: string;
    placeholder?: string;
    ctaText?: string;
  };

  const resolvedView: Exclude<PreviewScope, 'contextual'> = useMemo(() => {
    if (previewScope !== 'contextual') return previewScope;
    if (activeTab === 'products') return 'product-detail';
    if (activeTab === 'blogs') return 'blog-post';
    if (activeTab === 'section-hero') return 'hero';
    return 'full-home';
  }, [previewScope, activeTab]);

  const simulatedPath =
    resolvedView === 'product-detail' || resolvedView === 'product-card'
      ? `/product/${selectedProduct?.slug || 'heritage-mocha-hightop'}`
      : resolvedView === 'blog-post'
      ? `/blog/${selectedBlog?.slug || 'journal'}`
      : '/';

  const renderHeroBlock = () => {
    const heroProd =
      (activeTab === 'products' ? selectedProduct : undefined) ||
      products.find((p) => p.isFeaturedHero) ||
      selectedProduct ||
      products[0];
    const heroVar =
      (activeTab === 'products' && selectedVariant) || heroProd?.variants?.[0];
    const heroTitle =
      heroContent.headline?.trim() || 'CRAFTED FOR DAILY COMFORT';
    const heroEyebrow =
      heroContent.eyebrow?.trim() ||
      'AUTUMN / WINTER COLLECTION · 7 SIGNATURE STYLES';
    const heroSub =
      heroContent.subheadline?.trim() ||
      'Honest full-grain leather, brushed indigo suede, and breathable everyday runners made in small batches for lasting wear.';
    const heroCta1 = heroContent.primaryCtaText?.trim() || 'Shop Collection';
    const heroCta2 =
      heroContent.secondaryCtaText?.trim() &&
      heroContent.secondaryCtaHref !== '/admin'
        ? heroContent.secondaryCtaText
        : 'Read Journal';

    return (
      <section className="relative overflow-hidden border-b border-stone-900/10 bg-[#F6F3EC] px-6 py-10 text-stone-900">
        {heroSection?.isVisible === false && (
          <div className="mb-4 rounded-xl border border-amber-600/30 bg-amber-100 px-3 py-1.5 font-mono text-[10px] font-semibold text-amber-900">
            HERO SECTION CURRENTLY HIDDEN ON LIVE STOREFRONT
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-600">
            {heroEyebrow}
          </p>
          {heroProd && heroVar && (
            <span className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white px-3.5 py-1 text-xs font-medium text-stone-800 shadow-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: heroVar.primaryGlowHex }}
              />
              <span>
                {heroProd.name} · {heroVar.colorName}
              </span>
            </span>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-6">
            <h1 className="mt-4 max-w-3xl font-condensed text-5xl uppercase leading-[0.88] tracking-tight text-stone-900 sm:text-7xl">
              {heroTitle}
            </h1>
            <p className="max-w-lg rounded-2xl border border-stone-900/10 bg-white/80 p-3.5 text-xs leading-relaxed text-stone-700 shadow-sm sm:text-sm">
              {heroSub}
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className="rounded-full bg-[#18181B] px-5 py-2 text-xs font-semibold text-[#FAF8F4]">
                {heroCta1}
              </span>
              <span className="rounded-full border border-stone-900/15 bg-white px-4 py-2 text-xs font-semibold text-stone-800">
                {heroCta2}
              </span>
            </div>
          </div>

          <div className="lg:col-span-6">
            {heroProd && heroVar && (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-stone-900/10 bg-[#EFECE4]">
                <ShoeStage
                  key={`hero-${heroProd.id}-${heroVar.id}-${heroVar.glbModelUrl || ''}-${heroVar.posterImageUrl || ''}`}
                  mode="product-viewer"
                  primaryGlowHex={heroVar.primaryGlowHex}
                  secondaryAccentHex={heroVar.secondaryAccentHex}
                  glbModelUrl={heroVar.glbModelUrl || heroVar.posterImageUrl}
                  silhouetteVariant={getSilhouetteVariant(heroProd.slug)}
                />
                <span className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-stone-900/10 bg-white/90 px-3 py-1 font-mono text-[10px] font-semibold text-stone-700">
                  {heroVar.glbModelUrl?.toLowerCase().includes('.glb')
                    ? '3D .GLB ACTIVE'
                    : 'STUDIO SHOWCASE'}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderStatementBlock = () => (
    <section className="border-b border-white/10 bg-[#0D0D12] px-6 py-12">
      {statementSection?.isVisible === false && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-mono text-[10px] text-amber-300">
          SECTION CURRENTLY HIDDEN ON LIVE STOREFRONT
        </div>
      )}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <p
            className="font-mono text-[11px] tracking-widest"
            style={{ color: selectedVariant?.primaryGlowHex || '#CCFF00' }}
          >
            {statementContent.kicker || 'BIOMECHANICAL TELEMETRY'}
          </p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
            {statementContent.headline ||
              '84.6% MEASURED ENERGY RETURN. ZERO COMPROMISE.'}
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            {statementContent.body}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 font-mono text-[11px] text-zinc-300">
            <span className="inline-flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-glow-primary" /> FEA Carbon Spine
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-glow-primary" /> Nitro-PEBAX Core
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-glow-primary" /> NFC Verified
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:col-span-6">
          {(statementContent.metrics || []).map((metric, mIdx) => (
            <div
              key={`${metric.label}-${mIdx}`}
              className="rounded-2xl border border-white/10 bg-black/50 p-4"
            >
              <p className="font-mono text-[10px] tracking-widest text-zinc-400">
                {metric.label}
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold text-white">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderFaqBlock = () => (
    <section className="border-b border-white/10 bg-[#0D0D12] px-6 py-12">
      {faqSection?.isVisible === false && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-mono text-[10px] text-amber-300">
          FAQ SECTION CURRENTLY HIDDEN ON LIVE STOREFRONT
        </div>
      )}
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-[10px] tracking-widest text-zinc-400">
          CMS FAQ & SCHEMA ENGINE
        </p>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-white">
          {faqContent.heading || 'TECHNICAL SPECIFICATIONS & DROP FAQ'}
        </h2>
        <p className="mt-1.5 text-xs text-zinc-400">{faqContent.subheading}</p>
      </div>
      <dl className="mx-auto mt-6 max-w-3xl space-y-3">
        {(faqContent.items || []).map((item, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-white/10 bg-[#121216] p-4"
          >
            <dt className="font-display text-sm font-bold text-white">
              {item.question}
            </dt>
            <dd className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              {item.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );

  const renderNewsletterBlock = () => (
    <section className="bg-[#09090B] px-6 py-12 text-center">
      {newsletterSection?.isVisible === false && (
        <div className="mx-auto mb-4 max-w-md rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-mono text-[10px] text-amber-300">
          NEWSLETTER CURRENTLY HIDDEN ON LIVE STOREFRONT
        </div>
      )}
      <h2 className="font-display text-2xl font-extrabold text-white">
        {newsletterContent.heading || 'PRIORITY ACCESS TO NUMBERED STUDIO DROPS'}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-xs text-zinc-400">
        {newsletterContent.subheading ||
          'Receive private encrypted release links 24 hours before public allocation.'}
      </p>
      <NewsletterForm
        placeholder={
          newsletterContent.placeholder || 'ENTER EMAIL FOR PRIVATE ACCESS'
        }
        ctaText={newsletterContent.ctaText || 'JOIN ARCHIVE'}
      />
    </section>
  );

  const renderProductDetailPreview = () => {
    if (!selectedProduct || !selectedVariant) return null;
    const totalStock = selectedVariant.sizes.reduce((s, sz) => s + sz.stockCount, 0);
    return (
      <div className="bg-[#09090B] p-6">
        {!selectedProduct.published && (
          <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-mono text-[10px] text-amber-300">
            DRAFT MODE — NOT YET VISIBLE TO PUBLIC SHOPPERS
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D12]">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${selectedVariant.primaryGlowHex}22, transparent 70%)`,
                }}
              />
              <ShoeStage
                key={`detail-${selectedProduct.id}-${selectedVariant.id}-${selectedVariant.glbModelUrl || ''}`}
                mode="product-viewer"
                primaryGlowHex={selectedVariant.primaryGlowHex}
                secondaryAccentHex={selectedVariant.secondaryAccentHex}
                glbModelUrl={selectedVariant.glbModelUrl}
                silhouetteVariant={getSilhouetteVariant(selectedProduct.slug)}
              />
              <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/75 px-3 py-1 font-mono text-[10px] text-white backdrop-blur-md">
                {selectedVariant.colorName}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between space-y-4 xl:col-span-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] tracking-widest text-zinc-400">
                  {selectedProduct.category.toUpperCase()}
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] text-emerald-300">
                  {totalStock} PAIRS AVAILABLE
                </span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-white">
                {selectedProduct.name}
              </h2>
              <p className="mt-1 font-mono text-xl font-bold text-white">
                ${selectedProduct.basePrice}
              </p>
              <p className="mt-2 text-xs text-zinc-300">{selectedProduct.tagline}</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                {selectedProduct.description}
              </p>

              {/* Colorway Dots */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {selectedProduct.variants.map((v) => (
                  <span
                    key={v.id}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] ${
                      v.id === selectedVariant.id
                        ? 'border-white bg-white/10 text-white'
                        : 'border-white/10 text-zinc-400'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: v.primaryGlowHex }}
                    />
                    {v.colorName}
                  </span>
                ))}
              </div>

              {/* Sizes */}
              <div className="mt-4 grid grid-cols-4 gap-1.5">
                {selectedVariant.sizes.map((sz) => (
                  <div
                    key={sz.sku}
                    className={`rounded-lg border px-2 py-1.5 text-center font-mono text-[10px] ${
                      sz.stockCount > 0
                        ? 'border-white/15 bg-white/5 text-white'
                        : 'border-white/5 text-zinc-600 line-through'
                    }`}
                  >
                    {sz.sizeLabel}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="w-full rounded-full py-2.5 font-mono text-xs font-bold text-black"
              style={{
                backgroundColor: selectedVariant.primaryGlowHex,
                boxShadow: `0 0 24px -4px ${selectedVariant.primaryGlowHex}`,
              }}
            >
              ADD TO BAG — ${selectedProduct.basePrice}
            </button>
          </div>
        </div>

        {/* Specs Grid */}
        <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
          {Object.entries(selectedProduct.specsJson || {}).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/10 bg-[#121216] p-3">
              <dt className="font-mono text-[10px] text-zinc-500">{k.toUpperCase()}</dt>
              <dd className="mt-0.5 text-xs font-medium text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  };

  const renderProductCardPreview = () => {
    if (!selectedProduct || !selectedVariant) return null;
    const totalStock = selectedProduct.variants.reduce(
      (acc, v) => acc + v.sizes.reduce((s, sz) => s + sz.stockCount, 0),
      0
    );
    return (
      <div className="flex justify-center bg-[#09090B] p-8">
        <article className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#121216]">
          <div className="relative aspect-[16/10] bg-black">
            <SneakerStudioThumb
              name={selectedProduct.name}
              category={selectedProduct.category}
              sku={selectedVariant.skuPrefix}
              primaryGlowHex={selectedVariant.primaryGlowHex}
              secondaryAccentHex={selectedVariant.secondaryAccentHex}
            />
            <span className="absolute left-3 top-3 z-20 rounded-full bg-black/80 px-3 py-1 font-mono text-[10px] text-zinc-200">
              {selectedProduct.category.toUpperCase()}
            </span>
            <span className="absolute right-3 top-3 rounded-full bg-black/80 px-3 py-1 font-mono text-[10px] text-emerald-400">
              {totalStock > 0 ? `${totalStock} IN STOCK` : 'SOLD OUT'}
            </span>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-white">
                {selectedProduct.name}
              </h3>
              <span className="font-mono text-base font-bold text-white">
                ${selectedProduct.basePrice}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">{selectedProduct.description}</p>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <div className="flex items-center gap-1.5">
                {selectedProduct.variants.map((v) => (
                  <span
                    key={v.id}
                    className="h-3 w-3 rounded-full border border-white/30"
                    style={{ backgroundColor: v.primaryGlowHex }}
                  />
                ))}
              </div>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-white">
                SHOWROOM VIEW <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </article>
      </div>
    );
  };

  const renderBlogPreview = () => {
    if (!selectedBlog) return null;
    return (
      <div className="bg-[#F6F3EC] p-6 text-stone-900">
        <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-stone-900/10 bg-white shadow-lg">
          <div className="relative flex h-44 items-center justify-center bg-[#EFECE4] p-4">
            <img
              src={selectedBlog.coverImage}
              alt={selectedBlog.title}
              className="max-h-36 w-auto object-contain drop-shadow-md"
            />
            <span className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#8C4A27]">
              {selectedBlog.category}
            </span>
          </div>
          <div className="p-5">
            <p className="font-mono text-[10px] text-stone-500">
              {selectedBlog.publishedAt} · {selectedBlog.readTime}
            </p>
            <h3 className="mt-2 font-condensed text-2xl uppercase leading-tight text-stone-900">
              {selectedBlog.title}
            </h3>
            <p className="mt-1.5 font-serif text-sm italic text-stone-600">
              {selectedBlog.subtitle}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-stone-600">
              {selectedBlog.excerpt}
            </p>
            <div className="mt-4 space-y-2 border-t border-stone-900/10 pt-3">
              {selectedBlog.sections.slice(0, 2).map((sec, idx) => (
                <div key={idx} className="rounded-xl bg-[#FAF8F4] p-3">
                  <p className="font-mono text-[10px] font-bold uppercase text-[#8C4A27]">
                    {sec.heading}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-stone-600">
                    {sec.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0B0B0F] shadow-2xl">
      {/* Live Preview Browser Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#121218] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="font-mono text-[11px] font-bold tracking-wider text-white">
            LIVE STOREFRONT PREVIEW
          </span>
          <span className="hidden rounded-full border border-white/10 bg-black/50 px-2.5 py-0.5 font-mono text-[10px] text-zinc-400 sm:inline">
            {seoConfig.siteUrl}
            {simulatedPath}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-white/10 bg-black/40 p-0.5 font-mono text-[10px]">
            {(
              [
                { id: 'contextual', label: 'AUTO' },
                { id: 'hero', label: 'HERO 3D' },
                { id: 'product-detail', label: 'PRODUCT' },
                { id: 'product-card', label: 'CARD' },
                { id: 'blog-post', label: 'BLOG' },
                { id: 'full-home', label: 'FULL PAGE' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreviewScope(opt.id)}
                className={`rounded-full px-2.5 py-1 transition ${
                  previewScope === opt.id
                    ? 'bg-white font-bold text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex rounded-full border border-white/10 bg-black/40 p-0.5">
            <button
              type="button"
              onClick={() => setPreviewViewport('desktop')}
              title="Desktop Viewport"
              className={`rounded-full p-1.5 ${
                previewViewport === 'desktop'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewViewport('mobile')}
              title="Mobile Viewport"
              className={`rounded-full p-1.5 ${
                previewViewport === 'mobile'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Body */}
      <div className="max-h-[82vh] overflow-y-auto bg-[#060608] p-2 sm:p-4">
        <div
          className={`mx-auto overflow-hidden rounded-2xl border border-white/10 bg-[#09090B] transition-all duration-300 ${
            previewViewport === 'mobile' ? 'max-w-[390px]' : 'w-full'
          }`}
        >
          {resolvedView === 'hero' && renderHeroBlock()}
          {resolvedView === 'product-detail' && renderProductDetailPreview()}
          {resolvedView === 'product-card' && renderProductCardPreview()}
          {resolvedView === 'blog-post' && renderBlogPreview()}

          {resolvedView === 'full-home' && (
            <div>
              {activeTab === 'section-statement' && renderStatementBlock()}
              {activeTab === 'section-faq' && renderFaqBlock()}
              {activeTab === 'section-newsletter' && renderNewsletterBlock()}

              {/* Full Stacked Sections in Live Order */}
              {activeTab !== 'section-statement' &&
                activeTab !== 'section-faq' &&
                activeTab !== 'section-newsletter' && (
                  <>
                    {sortedSections.map((sec) => {
                      if (sec.sectionType === 'HERO_CONFIG') {
                        return <div key={sec.id}>{renderHeroBlock()}</div>;
                      }
                      if (sec.sectionType === 'STATEMENT_BANNER') {
                        return <div key={sec.id}>{renderStatementBlock()}</div>;
                      }
                      if (sec.sectionType === 'FAQ_LIST') {
                        return <div key={sec.id}>{renderFaqBlock()}</div>;
                      }
                      if (sec.sectionType === 'NEWSLETTER') {
                        return <div key={sec.id}>{renderNewsletterBlock()}</div>;
                      }
                      return null;
                    })}
                  </>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Admin Studio Dashboard                                                */
/* -------------------------------------------------------------------------- */
export function AdminStudioClient() {
  const {
    products,
    setProducts,
    blogs,
    setBlogs,
    pageSections,
    setPageSections,
    seoConfig,
    setSeoConfig,
    orders,
    setOrders,
    setActiveGlowColors,
    authToken: storeAuthToken,
    authUser: storeAuthUser,
    login: storeLogin,
    loginWithGoogle: storeLoginWithGoogle,
    updateAuthSession,
    logout: storeLogout,
    contactSettings,
    setContactSettings,
  } = useStore();

  // Auth State (Credential-only Admin/Editor access — never prefilled)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<{
    email: string;
    name: string;
    role: 'ADMIN' | 'EDITOR';
  } | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Sync verified Admin/Editor session from StoreContext when already signed in
  useEffect(() => {
    if (
      storeAuthToken &&
      storeAuthUser &&
      (storeAuthUser.role === 'ADMIN' || storeAuthUser.role === 'EDITOR')
    ) {
      setAuthToken(storeAuthToken);
      setAuthUser({
        email: storeAuthUser.email,
        name: storeAuthUser.name,
        role: storeAuthUser.role,
      });
    } else if (!storeAuthToken || !storeAuthUser) {
      setAuthToken(null);
      setAuthUser(null);
    }
  }, [storeAuthToken, storeAuthUser]);

  // Navigation & Preview State
  const [activeTab, setActiveTab] = useState<MainAdminTab>('products');
  const [productSubTab, setProductSubTab] = useState<ProductSubTab>('general');
  const [previewLayout, setPreviewLayout] = useState<PreviewLayoutMode>('split');
  const [previewScope, setPreviewScope] = useState<PreviewScope>('contextual');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>(
    'desktop'
  );
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [savingBusy, setSavingBusy] = useState(false);

  // Product Selection & Filters
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Blog / Journal Selection & Filters
  const [blogSearch, setBlogSearch] = useState('');
  const [selectedBlogId, setSelectedBlogId] = useState<string>(
    blogs[0]?.id || ''
  );
  const [confirmDeleteBlogId, setConfirmDeleteBlogId] = useState<string | null>(
    null
  );

  // 3D Studio Hotspot Telemetry
  const [liveCameraPos, setLiveCameraPos] = useState<Vector3Coords>({
    x: 2.8,
    y: 1.15,
    z: 3.25,
  });
  const [liveCameraTarget, setLiveCameraTarget] = useState<Vector3Coords>({
    x: 0,
    y: 0,
    z: 0,
  });
  const [previewCamera, setPreviewCamera] = useState<{
    position: Vector3Coords;
    target: Vector3Coords;
  } | null>(null);
  const [hotspotPct, setHotspotPct] = useState<number>(20);
  const [hotspotTitle, setHotspotTitle] = useState('CARBON PROPULSION WING');
  const [hotspotSubtitle, setHotspotSubtitle] = useState(
    '2.4mm aerospace pre-preg carbon spine tuned for explosive toe-off.'
  );
  const [studioExplode, setStudioExplode] = useState(0);

  // R2 Presigned Upload State
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [uploadReport, setUploadReport] = useState<string | null>(null);

  // Orders Filter & Expanded Row State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | OrderStatus>(
    'ALL'
  );
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // User Tracking, Profile Management & Admin Credentials State
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userNewPassword, setUserNewPassword] = useState('');
  const [showUserCurrentPassword, setShowUserCurrentPassword] = useState(true);
  const [showUserNewPassword, setShowUserNewPassword] = useState(true);
  const [copiedPasswordId, setCopiedPasswordId] = useState<string | null>(null);
  const [adminCredName, setAdminCredName] = useState('');
  const [adminCredEmail, setAdminCredEmail] = useState('');
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');

  // Role & Tab Permissions State (Admin-managed)
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsConfig>({
    editorTabs: DEFAULT_EDITOR_TABS,
    userTabOverrides: {},
  });
  const [roleTargetKey, setRoleTargetKey] = useState<string>('__DEFAULT_EDITOR__');

  useEffect(() => {
    if (authUser) {
      setAdminCredName(authUser.name);
      setAdminCredEmail(authUser.email);
    }
  }, [authUser]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || products[0],
    [products, selectedProductId]
  );

  const selectedVariant =
    selectedProduct?.variants[selectedVariantIdx] ||
    selectedProduct?.variants[0];

  const selectedBlog = useMemo(
    () => blogs.find((b) => b.id === selectedBlogId) || blogs[0],
    [blogs, selectedBlogId]
  );

  const filteredBlogs = useMemo(() => {
    const q = blogSearch.trim().toLowerCase();
    if (!q) return blogs;
    return blogs.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.relatedProductSlug.toLowerCase().includes(q)
    );
  }, [blogs, blogSearch]);

  useEffect(() => {
    if (!selectedBlogId && blogs.length > 0) {
      setSelectedBlogId(blogs[0].id);
    }
  }, [blogs, selectedBlogId]);

  const notify = useCallback((msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  // Hydrate admin with unpublished drafts, live blogs & database orders when online
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;

    async function loadAdminData() {
      try {
        const isAdminRole = authUser?.role === 'ADMIN';
        const [prodRes, ordRes, blogRes, usersRes, contactRes, cmsRes, rolesRes] =
          await Promise.all([
            fetch(`${API_BASE_URL}/products?includeUnpublished=true`),
            fetch(`${API_BASE_URL}/orders`, {
              headers: { Authorization: `Bearer ${authToken}` },
            }),
            fetch(`${API_BASE_URL}/blogs?includeUnpublished=true`),
            isAdminRole
              ? fetch(`${API_BASE_URL}/users`, {
                  headers: { Authorization: `Bearer ${authToken}` },
                })
              : Promise.resolve(null),
            fetch(`${API_BASE_URL}/settings/contact`),
            fetch(`${API_BASE_URL}/cms/home`),
            fetch(`${API_BASE_URL}/settings/roles`, {
              headers: { Authorization: `Bearer ${authToken}` },
            }),
          ]);
        if (!cancelled && prodRes.ok) {
          const data = (await prodRes.json()) as { products?: Product[] };
          if (data.products && data.products.length > 0) {
            setProducts(data.products);
          }
        }
        if (!cancelled && ordRes.ok) {
          const data = (await ordRes.json()) as { orders?: Order[] };
          if (data.orders && data.orders.length > 0) {
            setOrders(data.orders);
          }
        }
        if (!cancelled && blogRes.ok) {
          const data = (await blogRes.json()) as { blogs?: BlogPost[] };
          if (data.blogs && data.blogs.length > 0) {
            setBlogs(data.blogs);
          }
        }
        if (!cancelled && usersRes && usersRes.ok) {
          const data = (await usersRes.json()) as { users?: ManagedUser[] };
          if (data.users) {
            setManagedUsers(data.users);
            setSelectedUserId((prev) => prev || data.users?.[0]?.id || '');
          }
        }
        if (!cancelled && contactRes.ok) {
          const data = (await contactRes.json()) as {
            settings?: typeof contactSettings;
          };
          if (data.settings) {
            setContactSettings(data.settings);
          }
        }
        if (!cancelled && cmsRes.ok) {
          const data = (await cmsRes.json()) as { sections?: PageSection[] };
          if (data.sections && data.sections.length > 0) {
            setPageSections(data.sections);
          }
        }
        if (!cancelled && rolesRes.ok) {
          const data = (await rolesRes.json()) as {
            permissions?: RolePermissionsConfig;
          };
          if (data.permissions) {
            setRolePermissions({
              editorTabs:
                Array.isArray(data.permissions.editorTabs) &&
                data.permissions.editorTabs.length > 0
                  ? data.permissions.editorTabs
                  : DEFAULT_EDITOR_TABS,
              userTabOverrides: data.permissions.userTabOverrides ?? {},
            });
          }
        }
      } catch {
        // Offline / seed mode already loaded in StoreContext
      }
    }

    loadAdminData();
    return () => {
      cancelled = true;
    };
  }, [authToken, authUser?.role, setBlogs, setContactSettings, setOrders, setPageSections, setProducts]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return managedUsers;
    return managedUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.city || '').toLowerCase().includes(q)
    );
  }, [managedUsers, userSearch]);

  const selectedManagedUser = useMemo(
    () =>
      managedUsers.find((u) => u.id === selectedUserId) ||
      filteredUsers[0] ||
      null,
    [filteredUsers, managedUsers, selectedUserId]
  );

  function updateManagedUserLocal(
    userId: string,
    updater: (u: ManagedUser) => ManagedUser
  ) {
    setManagedUsers((prev) => prev.map((u) => (u.id === userId ? updater(u) : u)));
  }

  async function handleSaveUserAccount() {
    if (!selectedManagedUser) return;
    setSavingBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${selectedManagedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: selectedManagedUser.name,
          email: selectedManagedUser.email,
          role: selectedManagedUser.role,
          phone: selectedManagedUser.phone,
          address: selectedManagedUser.address,
          city: selectedManagedUser.city,
          state: selectedManagedUser.state,
          zipCode: selectedManagedUser.zipCode,
          ...(userNewPassword.trim()
            ? { newPassword: userNewPassword.trim() }
            : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        user?: ManagedUser;
        error?: string;
      };
      if (!res.ok || !data.user) {
        notify(`User update error: ${data.error || res.statusText}`);
        return;
      }
      updateManagedUserLocal(selectedManagedUser.id, () => data.user!);
      setUserNewPassword('');
      notify(
        `Updated account & details for ${data.user.name}${
          userNewPassword.trim() ? ' (new password applied)' : ''
        }.`
      );
    } catch {
      notify('Unable to reach backend to save user account.');
    } finally {
      setSavingBusy(false);
    }
  }

  const editorUsers = useMemo(
    () => managedUsers.filter((u) => u.role === 'EDITOR'),
    [managedUsers]
  );

  const activeRoleTabList: MainAdminTab[] = useMemo(() => {
    if (roleTargetKey === '__DEFAULT_EDITOR__') {
      return rolePermissions.editorTabs;
    }
    const override = rolePermissions.userTabOverrides[roleTargetKey];
    return Array.isArray(override) ? override : rolePermissions.editorTabs;
  }, [rolePermissions, roleTargetKey]);

  function toggleRoleTab(tabId: MainAdminTab) {
    setRolePermissions((prev) => {
      const current =
        roleTargetKey === '__DEFAULT_EDITOR__'
          ? prev.editorTabs
          : prev.userTabOverrides[roleTargetKey] ?? prev.editorTabs;
      const exists = current.includes(tabId);
      const next = exists
        ? current.filter((t) => t !== tabId)
        : [...current, tabId];
      if (roleTargetKey === '__DEFAULT_EDITOR__') {
        return { ...prev, editorTabs: next };
      }
      return {
        ...prev,
        userTabOverrides: {
          ...prev.userTabOverrides,
          [roleTargetKey]: next,
        },
      };
    });
  }

  function applyRolePreset(preset: MainAdminTab[]) {
    setRolePermissions((prev) => {
      if (roleTargetKey === '__DEFAULT_EDITOR__') {
        return { ...prev, editorTabs: [...preset] };
      }
      return {
        ...prev,
        userTabOverrides: {
          ...prev.userTabOverrides,
          [roleTargetKey]: [...preset],
        },
      };
    });
  }

  function resetEditorOverride(emailKey: string) {
    setRolePermissions((prev) => {
      const nextOverrides = { ...prev.userTabOverrides };
      delete nextOverrides[emailKey];
      return { ...prev, userTabOverrides: nextOverrides };
    });
  }

  async function handleSaveRolePermissions() {
    setSavingBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/settings/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(rolePermissions),
      });
      const data = (await res.json().catch(() => ({}))) as {
        permissions?: RolePermissionsConfig;
        error?: string;
      };
      if (!res.ok || !data.permissions) {
        notify(`Role permissions error: ${data.error || res.statusText}`);
        return;
      }
      setRolePermissions({
        editorTabs: data.permissions.editorTabs,
        userTabOverrides: data.permissions.userTabOverrides ?? {},
      });
      notify('Role & Editor tab permissions saved.');
    } catch {
      notify('Unable to reach backend to save role permissions.');
    } finally {
      setSavingBusy(false);
    }
  }

  async function handleSaveAdminCredentials(e: React.FormEvent) {
    e.preventDefault();
    setSavingBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: adminCredName,
          email: adminCredEmail,
          currentPassword: adminCurrentPassword || undefined,
          newPassword: adminNewPassword || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        token?: string;
        user?: {
          id: string;
          email: string;
          name: string;
          role: 'ADMIN' | 'EDITOR' | 'CUSTOMER';
        };
        error?: string;
      };
      if (!res.ok || !data.token || !data.user) {
        notify(`Credential error: ${data.error || res.statusText}`);
        return;
      }
      updateAuthSession(data.token, data.user);
      setAuthToken(data.token);
      if (data.user.role === 'ADMIN' || data.user.role === 'EDITOR') {
        setAuthUser({
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
        });
      }
      setAdminCurrentPassword('');
      setAdminNewPassword('');
      notify(`Admin credentials updated & active session refreshed (${data.user.email}).`);
    } catch {
      notify('Unable to reach backend to update admin credentials.');
    } finally {
      setSavingBusy(false);
    }
  }

  async function handleSaveContactSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSavingBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/settings/contact`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(contactSettings),
      });
      const data = (await res.json().catch(() => ({}))) as {
        settings?: typeof contactSettings;
        error?: string;
      };
      if (res.ok && data.settings) {
        setContactSettings(data.settings);
        await triggerNextRevalidate(['settings'], ['/', '/shop', '/faq', '/contact']);
        notify('Saved WhatsApp, Phone & Admin Contact details across storefront & chatbot.');
      } else {
        notify(`Contact save warning: ${data.error || res.statusText}`);
      }
    } catch {
      notify('Updated Contact & WhatsApp settings locally in StoreContext.');
    } finally {
      setSavingBusy(false);
    }
  }

  async function triggerNextRevalidate(tags: string[], paths: string[]) {
    try {
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': 'isr-revalidate-webhook-secret-token',
        },
        body: JSON.stringify({ tags, paths }),
      });
    } catch {
      // Non-blocking in client dev preview
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    if (!loginEmail.trim() || !loginPassword) {
      setAuthError('Please enter your administrator email and password.');
      return;
    }
    setAuthSubmitting(true);
    try {
      const result = await storeLogin(loginEmail.trim(), loginPassword);
      if (!result.ok || !result.user) {
        setAuthError(result.error || 'Authentication failed.');
        return;
      }
      if (result.user.role !== 'ADMIN' && result.user.role !== 'EDITOR') {
        storeLogout();
        setAuthError(
          'Access denied: administrator or editor credentials are required for this workspace.'
        );
        return;
      }
      setLoginPassword('');
      notify(`Signed in as ${result.user.name} (${result.user.role})`);
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleGoogleAdminLogin() {
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      let profile: { email: string; name: string; googleId?: string } | null =
        null;

      const clientId =
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
        contactSettings.googleClientId?.trim() ||
        '410827708760-5dd9s2sekl7vfro9gik90qf22irfetn5.apps.googleusercontent.com';

      if (clientId && typeof window !== 'undefined') {
        try {
          const getGsi = () =>
            (
              window as Window & {
                google?: {
                  accounts?: {
                    oauth2?: {
                      initTokenClient: (cfg: {
                        client_id: string;
                        scope: string;
                        prompt?: string;
                        callback: (resp: { access_token?: string }) => void;
                        error_callback?: (err: { type?: string }) => void;
                      }) => { requestAccessToken: () => void };
                    };
                  };
                };
              }
            ).google?.accounts?.oauth2;

          if (!getGsi()) {
            await new Promise<void>((resolve, reject) => {
              const existing = document.querySelector<HTMLScriptElement>(
                'script[src="https://accounts.google.com/gsi/client"]'
              );
              const script = existing || document.createElement('script');
              script.addEventListener('load', () => resolve(), { once: true });
              script.addEventListener(
                'error',
                () => reject(new Error('GSI failed')),
                { once: true }
              );
              if (!existing) {
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                document.head.appendChild(script);
              }
            });
          }

          const gsi = getGsi();
          if (gsi) {
            profile = await new Promise((resolve) => {
              const client = gsi.initTokenClient({
                client_id: clientId,
                scope: 'openid email profile',
                prompt: 'select_account',
                error_callback: () => resolve(null),
                callback: async (tokenResp) => {
                  if (!tokenResp.access_token) {
                    resolve(null);
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
                      resolve({
                        email: info.email,
                        name: info.name || info.email.split('@')[0],
                        googleId: info.sub,
                      });
                      return;
                    }
                  } catch {
                    // Fallback below
                  }
                  resolve(null);
                },
              });
              client.requestAccessToken();
            });
          }
        } catch {
          // Fallback to backend active Google account detection
        }
      }

      if (!profile && typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('atelier_google_current_account_v1');
          if (saved) {
            const parsed = JSON.parse(saved) as {
              email?: string;
              name?: string;
              googleId?: string;
            };
            if (parsed.email && parsed.email.includes('@')) {
              profile = {
                email: parsed.email,
                name: parsed.name || parsed.email.split('@')[0],
                googleId: parsed.googleId,
              };
            }
          }
        } catch {
          // Ignore storage error
        }
      }

      if (!profile) {
        const res = await fetch(`${API_BASE_URL}/auth/google/current`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = (await res.json()) as {
            account?: { email: string; name: string } | null;
          };
          if (data.account?.email) {
            profile = data.account;
          }
        }
      }

      if (!profile) {
        setAuthError(
          'No active Google account session detected. Please sign in with your staff email or connect your Google account on /login.'
        );
        return;
      }

      const result = await storeLoginWithGoogle(profile);
      if (!result.ok || !result.user) {
        setAuthError(result.error || 'Google authentication failed.');
        return;
      }
      if (result.user.role !== 'ADMIN' && result.user.role !== 'EDITOR') {
        storeLogout();
        setAuthError(
          `Access denied for ${result.user.email}: administrator or editor role is required.`
        );
        return;
      }

      notify(`Signed in via Google as ${result.user.name} (${result.user.role})`);
    } finally {
      setAuthSubmitting(false);
    }
  }

  const updateBlogLocal = useCallback(
    (updater: (blog: BlogPost) => BlogPost) => {
      if (!selectedBlog) return;
      setBlogs((prev) =>
        prev.map((b) => (b.id === selectedBlog.id ? updater(b) : b))
      );
    },
    [selectedBlog, setBlogs]
  );

  async function handleCreateBlog() {
    const defaultRelSlug = products[0]?.slug || 'heritage-mocha-hightop';
    const draft = createBlankBlog(defaultRelSlug);
    setSavingBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        const data = (await res.json()) as { blog?: BlogPost };
        const created = data.blog || draft;
        setBlogs((prev) => [created, ...prev]);
        setSelectedBlogId(created.id);
        setActiveTab('blogs');
        await triggerNextRevalidate(
          ['blogs'],
          ['/blog', `/blog/${created.slug}`]
        );
        notify(`Created journal article "${created.title}".`);
        return;
      }
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      notify(`Could not create article: ${err.error || 'server error'}`);
    } catch {
      setBlogs((prev) => [draft, ...prev]);
      setSelectedBlogId(draft.id);
      setActiveTab('blogs');
      notify(`Created article "${draft.title}" in local draft state.`);
    } finally {
      setSavingBusy(false);
    }
  }

  async function handleDuplicateBlog() {
    if (!selectedBlog) return;
    const stamp = Date.now().toString().slice(-4);
    const cloned: BlogPost = {
      ...selectedBlog,
      id: `blog-copy-${Date.now()}`,
      slug: `${selectedBlog.slug}-copy-${stamp}`,
      title: `${selectedBlog.title} (Copy)`,
      published: false,
      featured: false,
    };
    setSavingBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(cloned),
      });
      if (res.ok) {
        const data = (await res.json()) as { blog?: BlogPost };
        const created = data.blog || cloned;
        setBlogs((prev) => [created, ...prev]);
        setSelectedBlogId(created.id);
        notify(`Duplicated "${created.title}" as unpublished draft.`);
        return;
      }
    } catch {
      // Fallback local duplicate
    } finally {
      setSavingBusy(false);
    }
    setBlogs((prev) => [cloned, ...prev]);
    setSelectedBlogId(cloned.id);
    notify(`Duplicated "${cloned.title}" locally.`);
  }

  async function handleSaveBlog() {
    if (!selectedBlog) return;
    setSavingBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/blogs/${selectedBlog.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(selectedBlog),
      });
      if (res.ok) {
        const data = (await res.json()) as { blog?: BlogPost };
        if (data.blog) {
          setBlogs((prev) =>
            prev.map((b) => (b.id === selectedBlog.id ? data.blog! : b))
          );
        }
        await triggerNextRevalidate(
          ['blogs'],
          ['/blog', `/blog/${selectedBlog.slug}`]
        );
        notify(`Saved & published "${selectedBlog.title}".`);
        return;
      }
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      notify(`Blog save error: ${err.error || res.statusText}`);
    } catch {
      notify(`Updated "${selectedBlog.title}" locally (backend unreachable).`);
    } finally {
      setSavingBusy(false);
    }
  }

  async function handleDeleteBlog(blogId: string) {
    const target = blogs.find((b) => b.id === blogId);
    setSavingBusy(true);
    try {
      await fetch(`${API_BASE_URL}/blogs/${blogId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch {
      // Proceed with local removal
    } finally {
      setSavingBusy(false);
    }
    const remaining = blogs.filter((b) => b.id !== blogId);
    setBlogs(remaining);
    setSelectedBlogId(remaining[0]?.id || '');
    setConfirmDeleteBlogId(null);
    await triggerNextRevalidate(['blogs'], ['/blog']);
    notify(`Deleted article "${target?.title || blogId}".`);
  }

  function updateProductLocal(
    productId: string,
    updater: (prod: Product) => Product
  ) {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? updater(p) : p))
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Full Product CRUD Actions (Create, Update, Duplicate, Delete)            */
  /* ------------------------------------------------------------------------ */
  function handleCreateProduct() {
    const newProd = createBlankProduct(products.length + 1);
    setProducts((prev) => [...prev, newProd]);
    setSelectedProductId(newProd.id);
    setSelectedVariantIdx(0);
    setProductSubTab('general');
    notify(`Created draft "${newProd.name}". Edit fields & click Save Product.`);
  }

  function handleDuplicateProduct() {
    if (!selectedProduct) return;
    const stamp = Date.now().toString().slice(-4);
    const cloned: Product = {
      ...structuredClone(selectedProduct),
      id: `new-prod-${Date.now()}`,
      slug: `${selectedProduct.slug}-${stamp}`,
      name: `${selectedProduct.name} (${stamp})`,
      displayOrder: products.length + 1,
      updatedAt: new Date().toISOString(),
      variants: selectedProduct.variants.map((v, vIdx) => {
        const nextPrefix = `${v.skuPrefix}-${stamp}`;
        return {
          ...v,
          id: `new-var-${Date.now()}-${vIdx}`,
          skuPrefix: nextPrefix,
          sizes: v.sizes.map((s, sIdx) => ({
            ...s,
            id: `new-sz-${Date.now()}-${vIdx}-${sIdx}`,
            sku: `${nextPrefix}-${s.sizeLabel.replace(/\s+/g, '')}`,
          })),
        };
      }),
    };
    setProducts((prev) => [...prev, cloned]);
    setSelectedProductId(cloned.id);
    setSelectedVariantIdx(0);
    notify(`Duplicated "${selectedProduct.name}". Click Save Product to persist.`);
  }

  async function handleSaveProduct() {
    if (!selectedProduct) return;
    setSavingBusy(true);
    let savedProduct: Product = selectedProduct;

    try {
      const isNewDraft = selectedProduct.id.startsWith('new-');
      let res = await fetch(
        isNewDraft
          ? `${API_BASE_URL}/products`
          : `${API_BASE_URL}/products/${selectedProduct.id}`,
        {
          method: isNewDraft ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(selectedProduct),
        }
      );

      // Fallback to POST if record was not yet created on backend
      if (!isNewDraft && res.status === 404) {
        res = await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(selectedProduct),
        });
      }

      if (res.ok) {
        const body = (await res.json()) as { product?: Product };
        if (body.product) {
          savedProduct = body.product;
          setProducts((prev) =>
            prev.map((p) => (p.id === selectedProduct.id ? savedProduct : p))
          );
          setSelectedProductId(savedProduct.id);
        }
        await triggerNextRevalidate(
          ['products', 'sitemap', `product-${savedProduct.slug}`],
          ['/', '/shop', `/product/${savedProduct.slug}`]
        );
        notify(`Saved "${savedProduct.name}" to Neon DB & purged ISR cache.`);
      } else {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        notify(`Save warning: ${errBody.error || res.statusText}`);
      }
    } catch {
      await triggerNextRevalidate(
        ['products', 'sitemap', `product-${selectedProduct.slug}`],
        ['/', '/shop', `/product/${selectedProduct.slug}`]
      );
      notify(`Saved "${selectedProduct.name}" locally (backend offline).`);
    } finally {
      setSavingBusy(false);
    }
  }

  async function handleDeleteProduct(productToDelete: Product) {
    if (products.length <= 1) {
      notify('Cannot delete the last remaining product in the catalog.');
      setConfirmDeleteId(null);
      return;
    }

    const remaining = products.filter((p) => p.id !== productToDelete.id);
    setProducts(remaining);
    if (selectedProductId === productToDelete.id && remaining[0]) {
      setSelectedProductId(remaining[0].id);
      setSelectedVariantIdx(0);
    }
    setConfirmDeleteId(null);

    if (!productToDelete.id.startsWith('new-')) {
      try {
        await fetch(`${API_BASE_URL}/products/${productToDelete.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch {
        // Local delete active
      }
    }
    await triggerNextRevalidate(['products', 'sitemap'], ['/', '/shop']);
    notify(`Deleted product "${productToDelete.name}".`);
  }

  /* ------------------------------------------------------------------------ */
  /* Cloudflare R2 Presigned Upload Handler                                   */
  /* ------------------------------------------------------------------------ */
  async function handleR2FileUpload(file: File, assetKind: 'glb' | 'poster') {
    if (!selectedProduct || !selectedVariant) return;

    const isGlb = assetKind === 'glb';
    const maxBytes = isGlb ? 30 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadReport(
        `Rejected: File exceeds ${(maxBytes / (1024 * 1024)).toFixed(0)} MB limit.`
      );
      return;
    }

    const contentType = isGlb
      ? 'model/gltf-binary'
      : file.type === 'image/png'
      ? 'image/png'
      : file.type === 'image/jpeg'
      ? 'image/jpeg'
      : 'image/webp';

    if (isGlb && !file.name.toLowerCase().endsWith('.glb')) {
      setUploadReport('Rejected: 3D assets must be .glb files.');
      return;
    }

    setUploadingAsset(true);
    setUploadReport(`Uploading ${file.name} to storage...`);

    let finalCdnUrl = `https://cdn.aetherfootwear.com/${
      isGlb ? 'models' : 'images'
    }/${selectedProduct.slug}/${Date.now()}-${file.name}`;

    try {
      const res = await fetch(`${API_BASE_URL}/upload/presigned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          filename: file.name,
          contentType,
          fileSizeBytes: file.size,
          productSlug: selectedProduct.slug,
        }),
      });

      let uploadedViaR2 = false;
      if (res.ok) {
        const data = (await res.json()) as {
          uploadUrl: string;
          publicCdnUrl: string;
          mode: string;
        };
        if (data.mode === 'cloudflare-r2') {
          const putR2 = await fetch(data.uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
            body: file,
          });
          if (putR2.ok) {
            finalCdnUrl = data.publicCdnUrl;
            uploadedViaR2 = true;
            setUploadReport(`Uploaded to Cloudflare R2 CDN: ${finalCdnUrl}`);
          }
        }
      }

      if (!uploadedViaR2) {
        const directRes = await fetch(
          `${API_BASE_URL}/upload/direct?filename=${encodeURIComponent(
            file.name
          )}&productSlug=${encodeURIComponent(selectedProduct.slug)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': contentType,
              Authorization: `Bearer ${authToken}`,
            },
            body: file,
          }
        );
        if (directRes.ok) {
          const directData = (await directRes.json()) as {
            publicCdnUrl?: string;
          };
          if (directData.publicCdnUrl) {
            finalCdnUrl = directData.publicCdnUrl;
            setUploadReport(
              `Uploaded ${file.name} persistently & active in 3D preview: ${finalCdnUrl}`
            );
          }
        } else {
          finalCdnUrl = URL.createObjectURL(file);
          setUploadReport(`Loaded local preview (${file.name})`);
        }
      }
    } catch {
      finalCdnUrl = URL.createObjectURL(file);
      setUploadReport(`Loaded local preview (${file.name})`);
    }

    const updatedProd: Product = {
      ...selectedProduct,
      variants: selectedProduct.variants.map((v, idx) =>
        idx !== selectedVariantIdx
          ? v
          : isGlb
          ? { ...v, glbModelUrl: finalCdnUrl }
          : { ...v, posterImageUrl: finalCdnUrl }
      ),
    };

    updateProductLocal(selectedProduct.id, () => updatedProd);

    if (!selectedProduct.id.startsWith('new-') && !finalCdnUrl.startsWith('blob:')) {
      try {
        const saveRes = await fetch(
          `${API_BASE_URL}/products/${selectedProduct.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(updatedProd),
          }
        );
        if (saveRes.ok) {
          const body = (await saveRes.json()) as { product?: Product };
          if (body.product) {
            updateProductLocal(selectedProduct.id, () => body.product!);
          }
          await triggerNextRevalidate(
            ['products', 'sitemap', `product-${selectedProduct.slug}`],
            ['/', '/shop', `/product/${selectedProduct.slug}`]
          );
          notify(`Uploaded ${file.name} and saved to ${selectedProduct.name}.`);
        }
      } catch {
        // Already updated locally
      }
    }

    setUploadingAsset(false);
  }

  /* ------------------------------------------------------------------------ */
  /* Hotspots & Inventory Helpers                                             */
  /* ------------------------------------------------------------------------ */
  function handleCaptureHotspot() {
    if (!selectedProduct) return;
    const newHotspot: ScrollHotspot = {
      id: `hs-${Date.now()}`,
      scrollPercentage: hotspotPct,
      title: hotspotTitle.trim() || 'CUSTOM 3D HOTSPOT',
      subtitle:
        hotspotSubtitle.trim() ||
        'Captured directly from WebGL 3D studio telemetry.',
      cameraPosition: { ...liveCameraPos },
      cameraTarget: { ...liveCameraTarget },
    };

    updateProductLocal(selectedProduct.id, (prod) => ({
      ...prod,
      hotspots: [...prod.hotspots, newHotspot].sort(
        (a, b) => a.scrollPercentage - b.scrollPercentage
      ),
    }));

    notify(
      `Captured hotspot at ${hotspotPct}% scroll — Pos (${liveCameraPos.x}, ${liveCameraPos.y}, ${liveCameraPos.z})`
    );
  }

  async function handleSaveHotspotsToBackend() {
    if (!selectedProduct) return;
    if (selectedProduct.id.startsWith('new-')) {
      await handleSaveProduct();
      return;
    }
    try {
      await fetch(`${API_BASE_URL}/products/${selectedProduct.id}/hotspots`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ hotspots: selectedProduct.hotspots }),
      });
    } catch {
      // Local sync
    }
    await triggerNextRevalidate(
      ['products', `product-${selectedProduct.slug}`],
      ['/', `/product/${selectedProduct.slug}`]
    );
    notify(`Saved ${selectedProduct.hotspots.length} hotspots & purged ISR cache.`);
  }

  async function handleUpdateStock(sku: string, nextStock: number, prodId?: string) {
    const safeStock = Math.max(0, nextStock);
    setProducts((prev) =>
      prev.map((prod) =>
        prodId && prod.id !== prodId
          ? prod
          : {
              ...prod,
              variants: prod.variants.map((v) => ({
                ...v,
                sizes: v.sizes.map((s) =>
                  s.sku === sku ? { ...s, stockCount: safeStock } : s
                ),
              })),
            }
      )
    );

    try {
      await fetch(`${API_BASE_URL}/inventory/${encodeURIComponent(sku)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ stockCount: safeStock }),
      });
    } catch {
      // Local sync
    }
  }

  /* ------------------------------------------------------------------------ */
  /* CMS Section Helpers                                                      */
  /* ------------------------------------------------------------------------ */
  const sortedSections = useMemo(
    () => [...pageSections].sort((a, b) => a.orderIndex - b.orderIndex),
    [pageSections]
  );

  function getOrBuildSection(sectionType: PageSectionType): PageSection {
    const existing = pageSections.find((s) => s.sectionType === sectionType);
    if (existing) return existing;
    return {
      id: `sec-${sectionType.toLowerCase()}`,
      pageSlug: 'home',
      sectionType,
      orderIndex: pageSections.length + 1,
      isVisible: true,
      updatedAt: new Date().toISOString(),
      contentJson: {},
    };
  }

  function updateSectionByType(
    sectionType: PageSectionType,
    updater: (sec: PageSection) => PageSection
  ) {
    setPageSections((prev) => {
      const exists = prev.some((s) => s.sectionType === sectionType);
      if (exists) {
        return prev.map((s) => (s.sectionType === sectionType ? updater(s) : s));
      }
      const created = updater(getOrBuildSection(sectionType));
      return [...prev, created];
    });
  }

  function moveSectionByType(sectionType: PageSectionType, dir: -1 | 1) {
    const sorted = [...pageSections].sort((a, b) => a.orderIndex - b.orderIndex);
    const idx = sorted.findIndex((s) => s.sectionType === sectionType);
    const targetIdx = idx + dir;
    if (idx === -1 || targetIdx < 0 || targetIdx >= sorted.length) return;
    const copy = [...sorted];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    setPageSections(copy.map((sec, i) => ({ ...sec, orderIndex: i + 1 })));
  }

  async function handlePublishCms() {
    setSavingBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cms/home`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ sections: pageSections }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        notify(`Section sync note: ${err.error || res.statusText}`);
      }
    } catch {
      // Local sync
    }
    await triggerNextRevalidate(['cms', 'faq'], ['/', '/faq']);
    notify('Saved & published storefront sections + purged ISR cache.');
    setSavingBusy(false);
  }

  async function handleSaveGlobalSeo() {
    setSavingBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/seo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(seoConfig),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        notify(`SEO save warning: ${err.error || res.statusText}`);
        setSavingBusy(false);
        return;
      }
    } catch {
      // Local sync
    }
    await triggerNextRevalidate(['seo', 'sitemap'], ['/', '/shop', '/about', '/faq']);
    notify('Saved Global SEO & Organization JSON-LD Schema.');
    setSavingBusy(false);
  }

  /* ------------------------------------------------------------------------ */
  /* Orders & Inventory Alerts                                                */
  /* ------------------------------------------------------------------------ */
  async function handleOrderStatusChange(orderId: string, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    try {
      await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status }),
      });
    } catch {
      // Local sync
    }
    notify(`Order updated to ${status}`);
  }

  async function handleCreateDemoOrder() {
    const targetProduct = products[0];
    const targetVariant = targetProduct?.variants[0];
    const targetSize =
      targetVariant?.sizes.find((s) => s.stockCount > 0) ||
      targetVariant?.sizes[0];
    if (!targetProduct || !targetVariant || !targetSize || targetSize.stockCount < 1) {
      notify('No in-stock size available for creating a demo order.');
      return;
    }

    const customerNames = [
      { name: 'Kai Takahashi', email: 'kai@studio-tokyo.jp', city: 'Shibuya, Tokyo', country: 'Japan' },
      { name: 'Sora Lindqvist', email: 'sora@nordic-lab.se', city: 'Stockholm', country: 'Sweden' },
      { name: 'Devon Mercer', email: 'devon@atelier-nyc.us', city: 'New York', country: 'United States' },
    ];
    const pick = customerNames[orders.length % customerNames.length];
    const demoOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `AETH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'PENDING',
      customerEmail: pick.email,
      customerName: pick.name,
      shippingAddressJson: {
        line1: '108 Mercer Lab Ave',
        city: pick.city,
        state: 'NY',
        postalCode: '10012',
        country: pick.country,
      },
      subtotal: targetProduct.basePrice,
      totalAmount: targetProduct.basePrice,
      stripePaymentIntentId: `pi_demo_${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: [
        {
          id: `oi-demo-${Date.now()}`,
          variantId: targetVariant.id,
          productName: targetProduct.name,
          colorName: targetVariant.colorName,
          sizeSku: targetSize.sku,
          sizeLabel: targetSize.sizeLabel,
          quantity: 1,
          unitPrice: targetProduct.basePrice,
        },
      ],
    };

    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          customerName: demoOrder.customerName,
          customerEmail: demoOrder.customerEmail,
          shippingAddressJson: demoOrder.shippingAddressJson,
          items: [
            {
              variantId: targetVariant.id,
              sizeSku: targetSize.sku,
              quantity: 1,
            },
          ],
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as { order?: Order };
        if (body.order) {
          demoOrder.id = body.order.id;
          demoOrder.orderNumber = body.order.orderNumber;
        }
      }
    } catch {
      // Offline preview sync
    }

    setOrders((prev) => [demoOrder, ...prev]);
    updateProductLocal(targetProduct.id, (p) => ({
      ...p,
      variants: p.variants.map((v) =>
        v.id !== targetVariant.id
          ? v
          : {
              ...v,
              sizes: v.sizes.map((s) =>
                s.sku === targetSize.sku
                  ? { ...s, stockCount: Math.max(0, s.stockCount - 1) }
                  : s
              ),
            }
      ),
    }));
    notify(`Created demo order ${demoOrder.orderNumber} (${targetProduct.name} ${targetSize.sizeLabel}).`);
  }

  const lowStockAlerts = useMemo(() => {
    const alerts: {
      productId: string;
      productName: string;
      colorName: string;
      sizeLabel: string;
      sku: string;
      stockCount: number;
    }[] = [];
    for (const prod of products) {
      for (const variant of prod.variants) {
        for (const sz of variant.sizes) {
          if (sz.stockCount <= 3) {
            alerts.push({
              productId: prod.id,
              productName: prod.name,
              colorName: variant.colorName,
              sizeLabel: sz.sizeLabel,
              sku: sz.sku,
              stockCount: sz.stockCount,
            });
          }
        }
      }
    }
    return alerts;
  }, [products]);

  const allNavTabs = useMemo(
    () =>
      [
        {
          id: 'products',
          label: `Products (${products.length})`,
          sub: 'Catalog, pricing, SKUs & imagery',
          icon: Package,
        },
        {
          id: 'blogs',
          label: `Blogs & Journal (${blogs.length})`,
          sub: 'Product stories & editorial CMS',
          icon: BookOpen,
        },
        {
          id: 'orders',
          label: `Orders (${orders.length})`,
          sub: 'Fulfillment, stock & status desk',
          icon: ShoppingBag,
          badge: lowStockAlerts.length > 0 ? lowStockAlerts.length : undefined,
        },
        {
          id: 'users',
          label: `Users & Access (${managedUsers.length})`,
          sub: 'Accounts, passwords & admin keys',
          icon: Users,
        },
        {
          id: 'roles',
          label: 'Roles & Permissions',
          sub: 'Assign Editor & per-user tabs',
          icon: ShieldCheck,
        },
        {
          id: 'contact-chat',
          label: 'Contact & WhatsApp AI',
          sub: 'Phone, WhatsApp, email & bot',
          icon: MessageCircle,
        },
        {
          id: 'section-hero',
          label: 'Hero Section',
          sub: 'Landing banner copy & CTAs',
          icon: Sparkles,
        },
        {
          id: 'section-statement',
          label: 'Statement & Metrics',
          sub: 'Workshop standard & stats',
          icon: Activity,
        },
        {
          id: 'section-faq',
          label: 'FAQ Section',
          sub: 'Sizing, leather care & returns',
          icon: HelpCircle,
        },
        {
          id: 'section-newsletter',
          label: 'Newsletter Section',
          sub: 'Private release & journal opt-in',
          icon: Mail,
        },
        {
          id: 'global-seo',
          label: 'Global SEO',
          sub: 'Meta tags, SERP & OpenGraph',
          icon: Globe,
        },
      ] as {
        id: MainAdminTab;
        label: string;
        sub: string;
        icon: React.ElementType;
        badge?: number;
      }[],
    [blogs.length, lowStockAlerts.length, managedUsers.length, orders.length, products.length]
  );

  const visibleNavTabs = useMemo(() => {
    if (authUser?.role === 'ADMIN') return allNavTabs;
    const emailKey = authUser?.email?.trim().toLowerCase() || '';
    const override = emailKey
      ? rolePermissions.userTabOverrides[emailKey]
      : undefined;
    const allowedSet = new Set<MainAdminTab>(
      Array.isArray(override) ? override : rolePermissions.editorTabs
    );
    return allNavTabs.filter(
      (tab) =>
        tab.id !== 'users' && tab.id !== 'roles' && allowedSet.has(tab.id)
    );
  }, [allNavTabs, authUser?.email, authUser?.role, rolePermissions]);

  const canAccessTab = useCallback(
    (tabId: MainAdminTab) => visibleNavTabs.some((t) => t.id === tabId),
    [visibleNavTabs]
  );

  useEffect(() => {
    if (visibleNavTabs.length > 0 && !canAccessTab(activeTab)) {
      setActiveTab(visibleNavTabs[0].id);
    }
  }, [activeTab, canAccessTab, visibleNavTabs]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderStatusFilter !== 'ALL' && o.status !== orderStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      );
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const totalRevenue = useMemo(
    () => orders.reduce((acc, o) => acc + o.totalAmount, 0),
    [orders]
  );

  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'PENDING' || o.status === 'PAID').length,
    [orders]
  );

  const heroSection = getOrBuildSection('HERO_CONFIG');
  const statementSection = getOrBuildSection('STATEMENT_BANNER');
  const faqSection = getOrBuildSection('FAQ_LIST');
  const newsletterSection = getOrBuildSection('NEWSLETTER');

  const faqItems = ((faqSection.contentJson.items as FaqItem[]) || []) as FaqItem[];
  const statementMetrics = (
    (statementSection.contentJson.metrics as { label: string; value: string }[]) ||
    []
  );

  if (!authToken || !authUser) {
    return (
      <div className="mx-auto max-w-md px-4 py-28">
        <div className="rounded-3xl border border-[#2A231E] bg-[#161311] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300">
            <Lock className="h-4 w-4" />
            <span>RESTRICTED WORKSPACE</span>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-[#F7F3ED]">
            Atelier Vance Control Panel
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[#A39A90]">
            Enter your verified administrator or editor credentials to manage products,
            journal stories, storefront sections, and orders.
          </p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {authError && (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                {authError}
              </p>
            )}
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-[#A39A90]">
                Staff Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full rounded-xl border border-[#2A231E] bg-[#0F0D0C] px-4 py-2.5 text-sm text-[#F7F3ED] outline-none focus:border-amber-400/60"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-[#A39A90]">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-[#2A231E] bg-[#0F0D0C] px-4 py-2.5 text-sm text-[#F7F3ED] outline-none focus:border-amber-400/60"
              />
            </div>
            <button
              type="submit"
              disabled={authSubmitting}
              className="btn-atelier w-full rounded-full bg-[#F7F3ED] py-3 font-mono text-xs font-bold uppercase tracking-wider text-[#14110F] transition hover:bg-white disabled:opacity-60"
            >
              {authSubmitting ? 'VERIFYING CREDENTIALS...' : 'SIGN IN TO ADMIN'}
            </button>
          </form>
          <div className="mt-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-[#A39A90]">
            <span className="h-px flex-1 bg-[#2A231E]" />
            <span>or</span>
            <span className="h-px flex-1 bg-[#2A231E]" />
          </div>
          <button
            type="button"
            disabled={authSubmitting}
            onClick={handleGoogleAdminLogin}
            className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-full border border-[#2A231E] bg-[#0F0D0C] py-3 text-xs font-semibold text-[#F7F3ED] transition hover:border-amber-400/50 hover:bg-[#1E1916] disabled:opacity-60"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
            <span>Continue with Google</span>
          </button>
          <div className="mt-6 flex items-center justify-between border-t border-[#2A231E] pt-4 text-xs text-[#A39A90]">
            <span>Customer account?</span>
            <Link href="/login" className="font-mono text-[11px] uppercase tracking-wider text-amber-300 hover:underline">
              Customer Sign-In →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderSectionHeaderControls = (
    title: string,
    description: string,
    section: PageSection
  ) => (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121216] p-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/15 px-2.5 py-0.5 font-mono text-[10px] text-zinc-300">
            ORDER #{section.orderIndex}
          </span>
          <h2 className="font-display text-lg font-bold text-white">{title}</h2>
        </div>
        <p className="mt-0.5 text-xs text-zinc-400">{description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => moveSectionByType(section.sectionType, -1)}
          className="rounded-xl border border-white/10 p-2 text-zinc-300 hover:bg-white/5"
          title="Move Section Earlier"
        >
          <MoveUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => moveSectionByType(section.sectionType, 1)}
          className="rounded-xl border border-white/10 p-2 text-zinc-300 hover:bg-white/5"
          title="Move Section Later"
        >
          <MoveDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            updateSectionByType(section.sectionType, (s) => ({
              ...s,
              isVisible: !s.isVisible,
            }))
          }
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[11px] ${
            section.isVisible
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {section.isVisible ? (
            <>
              <Eye className="h-3.5 w-3.5" /> VISIBLE
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5" /> HIDDEN
            </>
          )}
        </button>
        <button
          type="button"
          disabled={savingBusy}
          onClick={handlePublishCms}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-mono text-xs font-bold text-black hover:bg-zinc-200 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{savingBusy ? 'SAVING...' : 'SAVE & PUBLISH'}</span>
        </button>
      </div>
    </div>
  );

  const showLivePreviewPane = previewLayout !== 'editor';
  const showEditorPane = previewLayout !== 'preview';

  return (
    <div className="min-h-screen bg-[#F6F3EC] px-4 pt-24 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1720px]">
        {/* Studio Top Command Bar */}
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-stone-900/15 bg-[#121216] p-5 text-white shadow-xl sm:p-6 xl:flex-row xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tracking-widest text-zinc-400">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>ATELIER VANCE · STANDARD CMS &amp; E-COMMERCE ADMIN</span>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                {authUser.role}
              </span>
            </div>
            <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-[#F7F3ED] sm:text-4xl">
              Storefront Control Panel
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Layout Mode Toggle */}
            <div className="flex items-center rounded-full border border-white/15 bg-black/50 p-1 font-mono text-[11px]">
              {(
                [
                  { id: 'split', label: 'EDITOR + PREVIEW' },
                  { id: 'editor', label: 'EDITOR ONLY' },
                  { id: 'preview', label: 'FULL PREVIEW' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPreviewLayout(m.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
                    previewLayout === m.id
                      ? 'bg-[#F7F3ED] font-bold text-[#14110F]'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  {m.id === 'split' && <PanelRight className="h-3 w-3" />}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                triggerNextRevalidate(
                  ['products', 'cms', 'seo', 'sitemap', 'faq', 'blogs'],
                  ['/', '/shop', '/faq', '/blog']
                ).then(() =>
                  notify('Edge ISR cache purged across all public routes.')
                )
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 py-2 font-mono text-xs text-white transition hover:bg-white/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>PURGE CACHE</span>
            </button>

            <button
              type="button"
              onClick={() => {
                storeLogout();
                setAuthToken(null);
                setAuthUser(null);
              }}
              className="rounded-full border border-white/20 px-4 py-2 font-mono text-xs text-zinc-200 transition hover:border-white/45 hover:bg-white/10 hover:text-white"
            >
              SIGN OUT / LOCK
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusBanner && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-[#121815] px-4 py-3 font-mono text-xs text-emerald-300 shadow-md">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{statusBanner}</span>
          </div>
        )}

        {/* Main Admin Grid: Complete Left Navigation Sidebar (3 Cols) + Stacked Workspace & Lower Preview (9 Cols) */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* COMPLETE LEFT SIDEBAR: ALL ADMIN SECTION TABS */}
          <aside
            aria-label="Admin Content Sections"
            className="space-y-5 lg:sticky lg:top-24 lg:col-span-3 lg:self-start"
          >
            <div className="rounded-3xl border border-white/10 bg-[#121216] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300">
                    NAVIGATION
                  </p>
                  <p className="mt-0.5 font-serif text-lg font-semibold text-[#F7F3ED]">
                    Studio Sections
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/50 px-2.5 py-0.5 font-mono text-[10px] text-zinc-400">
                  {visibleNavTabs.length} TABS
                </span>
              </div>

              <nav className="space-y-1.5">
                {visibleNavTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition ${
                        active
                          ? 'border-white bg-[#F7F3ED] text-[#14110F] shadow-sm'
                          : 'border-white/5 bg-black/35 text-zinc-300 hover:border-white/25 hover:bg-black/60 hover:text-white'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                            active
                              ? 'border-[#14110F]/15 bg-[#14110F] text-[#F7F3ED]'
                              : 'border-white/10 bg-[#18181D] text-amber-300'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-bold">
                            {tab.label}
                          </p>
                          <p
                            className={`truncate text-[10px] ${
                              active ? 'text-[#5C5349]' : 'text-zinc-500'
                            }`}
                          >
                            {tab.sub}
                          </p>
                        </div>
                      </div>
                      {tab.badge !== undefined && (
                        <span className="shrink-0 rounded-full bg-amber-400 px-2 py-0.5 font-mono text-[9px] font-bold text-black">
                          {tab.badge} LOW
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Storefront Snapshot Card */}
            <div className="space-y-3 rounded-3xl border border-white/10 bg-[#121216] p-4 shadow-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                ATELIER SNAPSHOT
              </p>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                  <p className="font-mono text-[10px] text-zinc-500">REVENUE</p>
                  <p className="mt-1 font-serif text-xl font-semibold tabular-nums text-white">
                    ${totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                  <p className="font-mono text-[10px] text-zinc-500">OPEN ORDERS</p>
                  <p className="mt-1 font-serif text-xl font-semibold tabular-nums text-amber-300">
                    {pendingOrdersCount}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href="/shop"
                  target="_blank"
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-2 font-mono text-[10px] text-zinc-200 hover:bg-white/10"
                >
                  <span>LIVE SHOP</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
                <Link
                  href="/blog"
                  target="_blank"
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-2 font-mono text-[10px] text-zinc-200 hover:bg-white/10"
                >
                  <span>JOURNAL</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Operator Profile */}
            <div className="flex items-center justify-between gap-2 rounded-3xl border border-white/10 bg-[#121216] p-4 shadow-md">
              <div className="min-w-0">
                <p className="truncate font-mono text-[11px] font-semibold text-white">
                  {authUser.name}
                </p>
                <p className="truncate font-mono text-[10px] text-zinc-500">
                  {authUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  storeLogout();
                  setAuthToken(null);
                  setAuthUser(null);
                }}
                className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 font-mono text-[10px] text-zinc-300 hover:border-white/35 hover:text-white"
              >
                LOCK
              </button>
            </div>
          </aside>

          {/* MAIN WORKSPACE COLUMN: ACTIVE TAB EDITOR ON TOP + LIVE STOREFRONT PREVIEW IN LOWER SECTION */}
          <div className="space-y-8 lg:col-span-9">
            {/* UPPER SECTION: FULL-WIDTH ACTIVE TAB EDITOR */}
            {showEditorPane && (
              <div className="space-y-6">
                {/* ============================================================== */}
                {/* TAB: BLOGS & JOURNAL CMS MANAGER                               */}
                {/* ============================================================== */}
                {activeTab === 'blogs' && (
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-white/10 bg-[#121216] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="relative min-w-[220px] flex-1">
                          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                          <input
                            value={blogSearch}
                            onChange={(e) => setBlogSearch(e.target.value)}
                            placeholder="Filter articles by title, category, or product slug..."
                            className="w-full rounded-full border border-white/10 bg-black/60 py-2 pl-10 pr-4 font-mono text-xs text-white outline-none focus:border-white/30"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCreateBlog}
                            disabled={savingBusy}
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 font-mono text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>NEW ARTICLE</span>
                          </button>
                          {selectedBlog && (
                            <>
                              <button
                                type="button"
                                onClick={handleDuplicateBlog}
                                disabled={savingBusy}
                                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 font-mono text-xs text-zinc-200 hover:bg-white/10"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                <span>DUPLICATE</span>
                              </button>
                              {confirmDeleteBlogId === selectedBlog.id ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBlog(selectedBlog.id)}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-2 font-mono text-xs font-bold text-white hover:bg-red-500"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>CONFIRM DELETE</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmDeleteBlogId(selectedBlog.id)
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3.5 py-2 font-mono text-xs text-red-300 hover:bg-red-500/20"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>DELETE</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleSaveBlog}
                                disabled={savingBusy}
                                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-mono text-xs font-bold text-black hover:bg-amber-200"
                              >
                                <Save className="h-3.5 w-3.5" />
                                <span>
                                  {savingBusy ? 'SAVING...' : 'SAVE & PUBLISH'}
                                </span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Article Selector Strip */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {filteredBlogs.map((blog) => {
                          const active = selectedBlog?.id === blog.id;
                          return (
                            <button
                              key={blog.id}
                              type="button"
                              onClick={() => {
                                setSelectedBlogId(blog.id);
                                setConfirmDeleteBlogId(null);
                              }}
                              className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs transition ${
                                active
                                  ? 'border-white bg-white font-semibold text-black'
                                  : 'border-white/10 bg-black/50 text-zinc-300 hover:border-white/30 hover:text-white'
                              }`}
                            >
                              <img
                                src={blog.coverImage}
                                alt=""
                                className="h-6 w-6 rounded-md object-cover bg-white/90 p-0.5"
                              />
                              <span className="max-w-[200px] truncate">
                                {blog.title}
                              </span>
                              {!blog.published && (
                                <span
                                  className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ${
                                    active
                                      ? 'bg-zinc-900 text-amber-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}
                                >
                                  DRAFT
                                </span>
                              )}
                              {blog.featured && (
                                <span
                                  className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ${
                                    active
                                      ? 'bg-amber-200 text-black'
                                      : 'bg-white/10 text-amber-300'
                                  }`}
                                >
                                  LEAD
                                </span>
                              )}
                            </button>
                          );
                        })}
                        {filteredBlogs.length === 0 && (
                          <p className="font-mono text-xs text-zinc-500">
                            No journal articles match this filter.
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedBlog && (
                      <>
                        {/* Core Metadata & Linked Pair */}
                        <div className="rounded-3xl border border-white/10 bg-[#121216] p-6 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h2 className="font-display text-lg font-bold text-white">
                                EDITORIAL ARTICLE METADATA
                              </h2>
                              <p className="text-xs text-zinc-400">
                                Every article updates /blog, /blog/{selectedBlog.slug}, and its linked product page immediately upon save.
                              </p>
                            </div>
                            <Link
                              href={`/blog/${selectedBlog.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 font-mono text-[11px] text-zinc-300 hover:border-white/30 hover:text-white"
                            >
                              <span>VIEW LIVE ARTICLE</span>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                                ARTICLE TITLE
                              </label>
                              <input
                                value={selectedBlog.title}
                                onChange={(e) =>
                                  updateBlogLocal((b) => ({
                                    ...b,
                                    title: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                                URL SLUG
                              </label>
                              <input
                                value={selectedBlog.slug}
                                onChange={(e) =>
                                  updateBlogLocal((b) => ({
                                    ...b,
                                    slug: e.target.value
                                      .toLowerCase()
                                      .replace(/[^a-z0-9-]+/g, '-')
                                      .replace(/^-|-$/g, ''),
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-xs text-white"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                                RELATED SHOE / PRODUCT
                              </label>
                              <select
                                value={selectedBlog.relatedProductSlug}
                                onChange={(e) =>
                                  updateBlogLocal((b) => ({
                                    ...b,
                                    relatedProductSlug: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                              >
                                {products.map((prod) => (
                                  <option key={prod.id} value={prod.slug}>
                                    {prod.name} ({prod.slug})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                                SUBTITLE
                              </label>
                              <input
                                value={selectedBlog.subtitle}
                                onChange={(e) =>
                                  updateBlogLocal((b) => ({
                                    ...b,
                                    subtitle: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                                CATEGORY
                              </label>
                              <input
                                value={selectedBlog.category}
                                onChange={(e) =>
                                  updateBlogLocal((b) => ({
                                    ...b,
                                    category: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                                READ TIME
                              </label>
                              <input
                                value={selectedBlog.readTime}
                                onChange={(e) =>
                                  updateBlogLocal((b) => ({
                                    ...b,
                                    readTime: e.target.value,
                                  }))
                                }
                                placeholder="5 min read"
                                className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                                AUTHOR NAME
                              </label>
                              <input
                                value={selectedBlog.author}
                                onChange={(e) =>
                                  updateBlogLocal((b) => ({
                                    ...b,
                                    author: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                                AUTHOR ROLE
                              </label>
                              <input
                                value={selectedBlog.authorRole}
                                onChange={(e) =>
                                  updateBlogLocal((b) => ({
                                    ...b,
                                    authorRole: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                                PUBLISH DATE
                              </label>
                              <input
                                type="date"
                                value={selectedBlog.publishedAt.slice(0, 10)}
                                onChange={(e) =>
                                  updateBlogLocal((b) => ({
                                    ...b,
                                    publishedAt: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-xs text-white"
                              />
                            </div>

                            <div className="flex flex-wrap items-center gap-4 pt-5">
                              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-200">
                                <input
                                  type="checkbox"
                                  checked={selectedBlog.published}
                                  onChange={(e) =>
                                    updateBlogLocal((b) => ({
                                      ...b,
                                      published: e.target.checked,
                                    }))
                                  }
                                  className="h-4 w-4 accent-emerald-400"
                                />
                                <span>Published</span>
                              </label>

                              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-200">
                                <input
                                  type="checkbox"
                                  checked={selectedBlog.featured}
                                  onChange={(e) =>
                                    updateBlogLocal((b) => ({
                                      ...b,
                                      featured: e.target.checked,
                                    }))
                                  }
                                  className="h-4 w-4 accent-amber-400"
                                />
                                <span>Lead Story</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Cover Photo, Excerpt & Tags */}
                        <div className="rounded-3xl border border-white/10 bg-[#121216] p-6 space-y-4">
                          <h2 className="font-display text-lg font-bold text-white">
                            COVER VISUAL, SUMMARY & TAGS
                          </h2>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#F7F3ED] p-3">
                              <img
                                src={selectedBlog.coverImage}
                                alt={selectedBlog.title}
                                className="max-h-24 w-auto object-contain"
                              />
                            </div>
                            <div className="sm:col-span-3 space-y-2.5">
                              <label className="block font-mono text-[10px] text-zinc-400">
                                COVER IMAGE URL
                              </label>
                              <input
                                value={selectedBlog.coverImage}
                                onChange={(e) =>
                                  updateBlogLocal((b) => ({
                                    ...b,
                                    coverImage: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-xs text-white"
                              />
                              <div className="flex flex-wrap gap-1.5">
                                {products.map((prod) => {
                                  const imgUrl =
                                    prod.variants[0]?.posterImageUrl ||
                                    prod.ogImageUrl;
                                  if (!imgUrl) return null;
                                  return (
                                    <button
                                      key={prod.id}
                                      type="button"
                                      onClick={() =>
                                        updateBlogLocal((b) => ({
                                          ...b,
                                          coverImage: imgUrl,
                                        }))
                                      }
                                      className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[10px] text-zinc-300 hover:border-white/30 hover:text-white"
                                    >
                                      {prod.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                              JOURNAL EXCERPT
                            </label>
                            <textarea
                              rows={2}
                              value={selectedBlog.excerpt}
                              onChange={(e) =>
                                updateBlogLocal((b) => ({
                                  ...b,
                                  excerpt: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs leading-relaxed text-white"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                              TAGS (COMMA SEPARATED)
                            </label>
                            <input
                              value={selectedBlog.tags.join(', ')}
                              onChange={(e) =>
                                updateBlogLocal((b) => ({
                                  ...b,
                                  tags: e.target.value
                                    .split(',')
                                    .map((t) => t.trim())
                                    .filter(Boolean),
                                }))
                              }
                              className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                            />
                          </div>
                        </div>

                        {/* Story Sections Editor */}
                        <div className="rounded-3xl border border-white/10 bg-[#121216] p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="font-display text-lg font-bold text-white">
                                ARTICLE SECTIONS ({selectedBlog.sections.length})
                              </h2>
                              <p className="text-xs text-zinc-400">
                                Structure the article with clear editorial headings and paragraphs.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                updateBlogLocal((b) => ({
                                  ...b,
                                  sections: [
                                    ...b.sections,
                                    {
                                      heading: 'New Story Section',
                                      body: 'Write section copy here...',
                                    },
                                  ],
                                }))
                              }
                              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 font-mono text-xs text-white hover:bg-white/10"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>ADD SECTION</span>
                            </button>
                          </div>

                          <div className="space-y-4">
                            {selectedBlog.sections.map((sec, idx) => (
                              <div
                                key={`${selectedBlog.id}-sec-${idx}`}
                                className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-[10px] text-amber-300">
                                    SECTION #{idx + 1}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() =>
                                        updateBlogLocal((b) => {
                                          if (idx === 0) return b;
                                          const next = [...b.sections];
                                          [next[idx - 1], next[idx]] = [
                                            next[idx],
                                            next[idx - 1],
                                          ];
                                          return { ...b, sections: next };
                                        })
                                      }
                                      className="rounded-lg border border-white/10 p-1.5 text-zinc-300 hover:bg-white/10 disabled:opacity-30"
                                      title="Move Up"
                                    >
                                      <MoveUp className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={
                                        idx === selectedBlog.sections.length - 1
                                      }
                                      onClick={() =>
                                        updateBlogLocal((b) => {
                                          if (idx >= b.sections.length - 1)
                                            return b;
                                          const next = [...b.sections];
                                          [next[idx + 1], next[idx]] = [
                                            next[idx],
                                            next[idx + 1],
                                          ];
                                          return { ...b, sections: next };
                                        })
                                      }
                                      className="rounded-lg border border-white/10 p-1.5 text-zinc-300 hover:bg-white/10 disabled:opacity-30"
                                      title="Move Down"
                                    >
                                      <MoveDown className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateBlogLocal((b) => ({
                                          ...b,
                                          sections: b.sections.filter(
                                            (_, sIdx) => sIdx !== idx
                                          ),
                                        }))
                                      }
                                      className="rounded-lg border border-red-500/30 p-1.5 text-red-300 hover:bg-red-500/20"
                                      title="Remove Section"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>

                                <input
                                  value={sec.heading}
                                  onChange={(e) =>
                                    updateBlogLocal((b) => ({
                                      ...b,
                                      sections: b.sections.map((s, sIdx) =>
                                        sIdx === idx
                                          ? { ...s, heading: e.target.value }
                                          : s
                                      ),
                                    }))
                                  }
                                  placeholder="Section heading"
                                  className="w-full rounded-xl border border-white/10 bg-[#0A0A0D] px-3.5 py-2 text-sm font-semibold text-white"
                                />

                                <textarea
                                  rows={3}
                                  value={sec.body}
                                  onChange={(e) =>
                                    updateBlogLocal((b) => ({
                                      ...b,
                                      sections: b.sections.map((s, sIdx) =>
                                        sIdx === idx
                                          ? { ...s, body: e.target.value }
                                          : s
                                      ),
                                    }))
                                  }
                                  placeholder="Section narrative body..."
                                  className="w-full rounded-xl border border-white/10 bg-[#0A0A0D] px-3.5 py-2.5 text-xs leading-relaxed text-zinc-200"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ============================================================== */}
                {/* TAB: PRODUCTS MANAGER (FULL CRUD IN EVERY ASPECT)              */}
                {/* ============================================================== */}
                {activeTab === 'products' && (
              <div className="space-y-6">
                {/* Product Catalog Bar + CRUD Actions */}
                <div className="rounded-3xl border border-white/10 bg-[#121216] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative min-w-[220px] flex-1">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Filter products by name, slug, or category..."
                        className="w-full rounded-full border border-white/10 bg-black/60 py-2 pl-10 pr-4 font-mono text-xs text-white outline-none focus:border-white/30"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCreateProduct}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 font-mono text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>ADD PRODUCT</span>
                      </button>

                      {selectedProduct && (
                        <>
                          <button
                            type="button"
                            onClick={handleDuplicateProduct}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 font-mono text-xs text-zinc-200 hover:bg-white/10"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>DUPLICATE</span>
                          </button>

                          {confirmDeleteId === selectedProduct.id ? (
                            <div className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(selectedProduct)}
                                className="font-mono text-[11px] font-bold text-red-300 hover:text-red-200"
                              >
                                CONFIRM DELETE
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="font-mono text-[11px] text-zinc-400 hover:text-white"
                              >
                                CANCEL
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(selectedProduct.id)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-3.5 py-2 font-mono text-xs text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>DELETE</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={savingBusy}
                            onClick={handleSaveProduct}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 font-mono text-xs font-bold text-black hover:bg-zinc-200 disabled:opacity-50"
                          >
                            <Save className="h-3.5 w-3.5" />
                            <span>{savingBusy ? 'SAVING...' : 'SAVE PRODUCT'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Selectable Product Directory Cards */}
                  <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((prod) => {
                      const active = prod.id === selectedProduct?.id;
                      const firstVar = prod.variants[0];
                      const stockTotal = prod.variants.reduce(
                        (a, v) => a + v.sizes.reduce((s, sz) => s + sz.stockCount, 0),
                        0
                      );
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => {
                            setSelectedProductId(prod.id);
                            setSelectedVariantIdx(0);
                            setConfirmDeleteId(null);
                          }}
                          className={`flex items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                            active
                              ? 'border-white bg-white/10'
                              : 'border-white/10 bg-black/40 hover:border-white/25'
                          }`}
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
                            <SneakerStudioThumb
                              name={prod.name}
                              category={prod.category}
                              primaryGlowHex={firstVar?.primaryGlowHex}
                              secondaryAccentHex={firstVar?.secondaryAccentHex}
                              compact
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-xs font-bold text-white">
                              {prod.name}
                            </p>
                            <p className="font-mono text-[10px] text-zinc-400">
                              ${prod.basePrice} • {stockTotal} stock
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span
                                className={`rounded px-1.5 py-0.5 font-mono text-[9px] ${
                                  prod.published
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-zinc-700 text-zinc-300'
                                }`}
                              >
                                {prod.published ? 'PUBLISHED' : 'DRAFT'}
                              </span>
                              {prod.isFeaturedHero && (
                                <span className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[9px] text-white">
                                  HERO
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Product Sub-Tabs Editor */}
                {selectedProduct && selectedVariant && (
                  <div className="rounded-3xl border border-white/10 bg-[#121216] p-6">
                    {/* Sub-Navigation Pills */}
                    <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
                      {(
                        [
                          { id: 'general', label: '1. General & Story', icon: Tag },
                          {
                            id: 'variants',
                            label: `2. Colorways & 3D (${selectedProduct.variants.length})`,
                            icon: CloudUpload,
                          },
                          { id: 'inventory', label: '3. Sizes & Stock', icon: Package },
                          { id: 'specs', label: '4. Tech Specs', icon: Sliders },
                          {
                            id: 'hotspots',
                            label: `5. 3D Hotspots (${selectedProduct.hotspots.length})`,
                            icon: Camera,
                          },
                          { id: 'seo', label: '6. Product SEO', icon: Search },
                        ] as const
                      ).map((sub) => {
                        const Icon = sub.icon;
                        const active = productSubTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setProductSubTab(sub.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[11px] transition ${
                              active
                                ? 'bg-white font-bold text-black'
                                : 'border border-white/10 bg-black/40 text-zinc-300 hover:border-white/25'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* SUB-TAB 1: GENERAL INFO, PRICING & STORY */}
                    {productSubTab === 'general' && (
                      <div className="mt-5 space-y-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <label className="block">
                            <span className="font-mono text-[10px] text-zinc-400">
                              PRODUCT NAME
                            </span>
                            <input
                              value={selectedProduct.name}
                              onChange={(e) =>
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  name: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-sm text-white"
                            />
                          </label>

                          <label className="block">
                            <span className="font-mono text-[10px] text-zinc-400">
                              URL SLUG (/product/...)
                            </span>
                            <input
                              value={selectedProduct.slug}
                              onChange={(e) =>
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  slug: e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9-]/g, '-'),
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-xs text-white"
                            />
                          </label>

                          <label className="block">
                            <span className="font-mono text-[10px] text-zinc-400">
                              BASE PRICE (USD $)
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={selectedProduct.basePrice}
                              onChange={(e) =>
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  basePrice: Number(e.target.value) || 0,
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-sm text-white"
                            />
                          </label>

                          <label className="block">
                            <span className="font-mono text-[10px] text-zinc-400">
                              CATEGORY
                            </span>
                            <input
                              value={selectedProduct.category}
                              onChange={(e) =>
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  category: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-sm text-white"
                            />
                          </label>

                          <label className="block">
                            <span className="font-mono text-[10px] text-zinc-400">
                              COLLECTION SLUG
                            </span>
                            <select
                              value={selectedProduct.collectionSlug}
                              onChange={(e) =>
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  collectionSlug: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-xs text-white"
                            >
                              <option value="cyber-runner">cyber-runner</option>
                              <option value="zero-gravity">zero-gravity</option>
                              <option value="obsidian-series">obsidian-series</option>
                            </select>
                          </label>

                          <label className="block">
                            <span className="font-mono text-[10px] text-zinc-400">
                              DISPLAY ORDER
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={selectedProduct.displayOrder}
                              onChange={(e) =>
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  displayOrder: Number(e.target.value) || 0,
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-xs text-white"
                            />
                          </label>

                          <label className="block">
                            <span className="font-mono text-[10px] text-zinc-400">
                              RATING (1.0 - 5.0)
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={5}
                              step={0.05}
                              value={selectedProduct.ratingValue}
                              onChange={(e) =>
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  ratingValue: Math.min(
                                    5,
                                    Math.max(1, Number(e.target.value) || 4.9)
                                  ),
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-xs text-white"
                            />
                          </label>

                          <label className="block">
                            <span className="font-mono text-[10px] text-zinc-400">
                              REVIEW COUNT
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={selectedProduct.reviewCount}
                              onChange={(e) =>
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  reviewCount: Math.max(0, Number(e.target.value) || 0),
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-xs text-white"
                            />
                          </label>
                        </div>

                        {/* Toggles */}
                        <div className="flex flex-wrap gap-4">
                          <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5">
                            <input
                              type="checkbox"
                              checked={selectedProduct.published}
                              onChange={(e) =>
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  published: e.target.checked,
                                }))
                              }
                              className="h-4 w-4 accent-emerald-400"
                            />
                            <span className="font-mono text-xs text-white">
                              PUBLISHED TO STOREFRONT
                            </span>
                          </label>

                          <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5">
                            <input
                              type="checkbox"
                              checked={selectedProduct.isFeaturedHero}
                              onChange={(e) =>
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  isFeaturedHero: e.target.checked,
                                }))
                              }
                              className="h-4 w-4 accent-white"
                            />
                            <span className="font-mono text-xs text-white">
                              FEATURED IN 3D HERO CAROUSEL
                            </span>
                          </label>
                        </div>

                        <label className="block">
                          <span className="font-mono text-[10px] text-zinc-400">
                            TAGLINE
                          </span>
                          <input
                            value={selectedProduct.tagline}
                            onChange={(e) =>
                              updateProductLocal(selectedProduct.id, (p) => ({
                                ...p,
                                tagline: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-sm text-white"
                          />
                        </label>

                        <label className="block">
                          <span className="font-mono text-[10px] text-zinc-400">
                            SHORT DESCRIPTION
                          </span>
                          <textarea
                            rows={3}
                            value={selectedProduct.description}
                            onChange={(e) =>
                              updateProductLocal(selectedProduct.id, (p) => ({
                                ...p,
                                description: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                          />
                        </label>

                        <label className="block">
                          <span className="font-mono text-[10px] text-zinc-400">
                            RICH STORY HTML
                          </span>
                          <textarea
                            rows={4}
                            value={selectedProduct.richStoryHtml}
                            onChange={(e) =>
                              updateProductLocal(selectedProduct.id, (p) => ({
                                ...p,
                                richStoryHtml: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-xs text-zinc-300"
                          />
                        </label>
                      </div>
                    )}

                    {/* SUB-TAB 2: COLORWAY VARIANTS, GLOW & R2 ASSETS */}
                    {productSubTab === 'variants' && (
                      <div className="mt-5 space-y-5">
                        {/* Variant Switcher & Add/Remove */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.variants.map((v, idx) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => setSelectedVariantIdx(idx)}
                                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-xs transition ${
                                  idx === selectedVariantIdx
                                    ? 'border-white bg-white/10 font-bold text-white'
                                    : 'border-white/10 text-zinc-400 hover:border-white/30'
                                }`}
                              >
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: v.primaryGlowHex }}
                                />
                                <span>{v.colorName}</span>
                              </button>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const suffix = `V${selectedProduct.variants.length + 1}`;
                                const skuPrefix = `${selectedVariant.skuPrefix}-${suffix}`;
                                const newVariant: ColorwayVariant = {
                                  id: `var-${Date.now()}`,
                                  colorName: `Custom Colorway ${selectedProduct.variants.length + 1}`,
                                  skuPrefix,
                                  primaryGlowHex: '#38BDF8',
                                  secondaryAccentHex: '#A855F7',
                                  glbModelUrl: selectedVariant.glbModelUrl,
                                  posterImageUrl: selectedVariant.posterImageUrl,
                                  galleryImages: [...selectedVariant.galleryImages],
                                  altText: `${selectedProduct.name} alternate colorway`,
                                  sizes: createDefaultSizes(skuPrefix),
                                };
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  variants: [...p.variants, newVariant],
                                }));
                                setSelectedVariantIdx(selectedProduct.variants.length);
                              }}
                              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-white"
                            >
                              <Plus className="h-3 w-3" /> ADD COLORWAY
                            </button>

                            {selectedProduct.variants.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateProductLocal(selectedProduct.id, (p) => ({
                                    ...p,
                                    variants: p.variants.filter(
                                      (_, idx) => idx !== selectedVariantIdx
                                    ),
                                  }));
                                  setSelectedVariantIdx(0);
                                }}
                                className="inline-flex items-center gap-1 rounded-full border border-red-500/30 px-3 py-1.5 font-mono text-[11px] text-red-400"
                              >
                                <Trash2 className="h-3 w-3" /> REMOVE
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Variant Fields */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <label className="block">
                            <span className="font-mono text-[10px] text-zinc-400">
                              COLORWAY NAME
                            </span>
                            <input
                              value={selectedVariant.colorName}
                              onChange={(e) =>
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  variants: p.variants.map((v, idx) =>
                                    idx === selectedVariantIdx
                                      ? { ...v, colorName: e.target.value }
                                      : v
                                  ),
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-sm text-white"
                            />
                          </label>

                          <label className="block">
                            <span className="font-mono text-[10px] text-zinc-400">
                              SKU PREFIX
                            </span>
                            <input
                              value={selectedVariant.skuPrefix}
                              onChange={(e) =>
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  variants: p.variants.map((v, idx) =>
                                    idx === selectedVariantIdx
                                      ? { ...v, skuPrefix: e.target.value.toUpperCase() }
                                      : v
                                  ),
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-xs text-white"
                            />
                          </label>

                          <label className="block">
                            <span className="font-mono text-[10px] text-zinc-400">
                              PRIMARY 3D GLOW HEX
                            </span>
                            <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 p-1.5">
                              <input
                                type="color"
                                value={selectedVariant.primaryGlowHex}
                                onChange={(e) => {
                                  const hex = e.target.value;
                                  updateProductLocal(selectedProduct.id, (p) => ({
                                    ...p,
                                    variants: p.variants.map((v, idx) =>
                                      idx === selectedVariantIdx
                                        ? { ...v, primaryGlowHex: hex }
                                        : v
                                    ),
                                  }));
                                  setActiveGlowColors(
                                    hex,
                                    selectedVariant.secondaryAccentHex
                                  );
                                }}
                                className="h-7 w-7 cursor-pointer rounded bg-transparent"
                              />
                              <input
                                value={selectedVariant.primaryGlowHex}
                                onChange={(e) =>
                                  updateProductLocal(selectedProduct.id, (p) => ({
                                    ...p,
                                    variants: p.variants.map((v, idx) =>
                                      idx === selectedVariantIdx
                                        ? { ...v, primaryGlowHex: e.target.value }
                                        : v
                                    ),
                                  }))
                                }
                                className="flex-1 bg-transparent font-mono text-xs text-white outline-none"
                              />
                            </div>
                          </label>

                          <label className="block">
                            <span className="font-mono text-[10px] text-zinc-400">
                              SECONDARY ACCENT HEX
                            </span>
                            <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 p-1.5">
                              <input
                                type="color"
                                value={selectedVariant.secondaryAccentHex}
                                onChange={(e) => {
                                  const hex = e.target.value;
                                  updateProductLocal(selectedProduct.id, (p) => ({
                                    ...p,
                                    variants: p.variants.map((v, idx) =>
                                      idx === selectedVariantIdx
                                        ? { ...v, secondaryAccentHex: hex }
                                        : v
                                    ),
                                  }));
                                  setActiveGlowColors(
                                    selectedVariant.primaryGlowHex,
                                    hex
                                  );
                                }}
                                className="h-7 w-7 cursor-pointer rounded bg-transparent"
                              />
                              <input
                                value={selectedVariant.secondaryAccentHex}
                                onChange={(e) =>
                                  updateProductLocal(selectedProduct.id, (p) => ({
                                    ...p,
                                    variants: p.variants.map((v, idx) =>
                                      idx === selectedVariantIdx
                                        ? { ...v, secondaryAccentHex: e.target.value }
                                        : v
                                    ),
                                  }))
                                }
                                className="flex-1 bg-transparent font-mono text-xs text-white outline-none"
                              />
                            </div>
                          </label>
                        </div>

                        {/* 3D Draco .GLB Asset & Mesh Preset Selector */}
                        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-mono text-[10px] text-zinc-400">
                                3D DRACO .GLB MODEL URL
                              </span>
                              <label className="cursor-pointer rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] text-white hover:bg-white/10">
                                <input
                                  type="file"
                                  accept=".glb,model/gltf-binary"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleR2FileUpload(file, 'glb');
                                  }}
                                />
                                {uploadingAsset ? 'UPLOADING...' : 'UPLOAD .GLB TO R2'}
                              </label>
                            </div>
                            <input
                              value={selectedVariant.glbModelUrl}
                              onChange={(e) =>
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  variants: p.variants.map((v, idx) =>
                                    idx === selectedVariantIdx
                                      ? { ...v, glbModelUrl: e.target.value }
                                      : v
                                  ),
                                }))
                              }
                              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black px-3.5 py-2 font-mono text-xs text-white"
                            />
                          </div>

                          <div>
                            <span className="font-mono text-[10px] text-zinc-400">
                              ORIGINAL STUDIO SHOE CUTOUT PRESET
                            </span>
                            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {[
                                {
                                  label: 'ESPRESSO HIGH',
                                  url: '/images/shoes/espresso-hightop.png',
                                },
                                {
                                  label: 'CRIMSON RUN',
                                  url: '/images/shoes/crimson-runner.png',
                                },
                                {
                                  label: 'NAVY SUEDE',
                                  url: '/images/shoes/navy-suede.png',
                                },
                                {
                                  label: 'BLACK OXFORD',
                                  url: '/images/shoes/black-oxford.png',
                                },
                                {
                                  label: 'CHESTNUT WALK',
                                  url: '/images/shoes/chestnut-walker.png',
                                },
                                {
                                  label: 'IVORY CANVAS',
                                  url: '/images/shoes/ivory-canvas.png',
                                },
                                {
                                  label: 'COBALT TRAIN',
                                  url: '/images/shoes/cobalt-trainer.png',
                                },
                              ].map((preset) => {
                                const isActivePreset =
                                  selectedVariant.glbModelUrl === preset.url;
                                return (
                                  <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() =>
                                      updateProductLocal(selectedProduct.id, (p) => ({
                                        ...p,
                                        variants: p.variants.map((v, idx) =>
                                          idx === selectedVariantIdx
                                            ? {
                                                ...v,
                                                glbModelUrl: preset.url,
                                                posterImageUrl: preset.url,
                                              }
                                            : v
                                        ),
                                      }))
                                    }
                                    className={`rounded-xl border px-2.5 py-2 font-mono text-[9px] font-bold transition ${
                                      isActivePreset
                                        ? 'border-white bg-white text-black'
                                        : 'border-white/15 bg-black/60 text-zinc-300 hover:border-white/40'
                                    }`}
                                  >
                                    {preset.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <label className="block">
                            <span className="font-mono text-[10px] text-zinc-400">
                              3D ACCESSIBILITY &amp; SEO DESCRIPTION
                            </span>
                            <input
                              value={selectedVariant.altText}
                              onChange={(e) =>
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  variants: p.variants.map((v, idx) =>
                                    idx === selectedVariantIdx
                                      ? { ...v, altText: e.target.value }
                                      : v
                                  ),
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black px-3.5 py-2 text-xs text-white"
                            />
                          </label>

                          {uploadReport && (
                            <p className="font-mono text-[10px] text-emerald-400">
                              {uploadReport}
                            </p>
                          )}
                        </div>

                        {/* Gallery Images List */}
                        <div className="space-y-2.5 rounded-2xl border border-white/10 bg-black/40 p-4">
                          <span className="font-mono text-[10px] text-zinc-400">
                            STUDIO GALLERY IMAGES ({selectedVariant.galleryImages.length})
                          </span>
                          {selectedVariant.galleryImages.map((imgUrl, gIdx) => (
                            <div key={gIdx} className="flex items-center gap-2">
                              <img
                                src={imgUrl}
                                alt={`Gallery ${gIdx + 1}`}
                                className="h-9 w-9 shrink-0 rounded-lg bg-black object-cover"
                              />
                              <input
                                value={imgUrl}
                                onChange={(e) =>
                                  updateProductLocal(selectedProduct.id, (p) => ({
                                    ...p,
                                    variants: p.variants.map((v, idx) =>
                                      idx === selectedVariantIdx
                                        ? {
                                            ...v,
                                            galleryImages: v.galleryImages.map(
                                              (url, i) =>
                                                i === gIdx ? e.target.value : url
                                            ),
                                          }
                                        : v
                                    ),
                                  }))
                                }
                                className="flex-1 rounded-xl border border-white/10 bg-black px-3 py-1.5 font-mono text-xs text-white"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateProductLocal(selectedProduct.id, (p) => ({
                                    ...p,
                                    variants: p.variants.map((v, idx) =>
                                      idx === selectedVariantIdx
                                        ? {
                                            ...v,
                                            galleryImages: v.galleryImages.filter(
                                              (_, i) => i !== gIdx
                                            ),
                                          }
                                        : v
                                    ),
                                  }))
                                }
                                className="p-1.5 text-zinc-500 hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <input
                              value={newGalleryUrl}
                              onChange={(e) => setNewGalleryUrl(e.target.value)}
                              placeholder="https://... gallery image URL"
                              className="flex-1 rounded-xl border border-white/10 bg-black px-3 py-1.5 font-mono text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newGalleryUrl.trim()) return;
                                updateProductLocal(selectedProduct.id, (p) => ({
                                  ...p,
                                  variants: p.variants.map((v, idx) =>
                                    idx === selectedVariantIdx
                                      ? {
                                          ...v,
                                          galleryImages: [
                                            ...v.galleryImages,
                                            newGalleryUrl.trim(),
                                          ],
                                        }
                                      : v
                                  ),
                                }));
                                setNewGalleryUrl('');
                              }}
                              className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-[11px] text-white"
                            >
                              + ADD IMAGE
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 3: SIZE & STOCK MATRIX */}
                    {productSubTab === 'inventory' && (
                      <div className="mt-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-zinc-400">
                            Editing inventory for{' '}
                            <strong className="text-white">
                              {selectedVariant.colorName}
                            </strong>
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              updateProductLocal(selectedProduct.id, (p) => ({
                                ...p,
                                variants: p.variants.map((v, idx) =>
                                  idx === selectedVariantIdx
                                    ? {
                                        ...v,
                                        sizes: [
                                          ...v.sizes,
                                          {
                                            id: `sz-${Date.now()}`,
                                            sizeLabel: 'US 14',
                                            sku: `${v.skuPrefix}-US14-${v.sizes.length}`,
                                            stockCount: 5,
                                          },
                                        ],
                                      }
                                    : v
                                ),
                              }))
                            }
                            className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 font-mono text-[11px] text-white"
                          >
                            <Plus className="h-3 w-3" /> ADD SIZE
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {selectedVariant.sizes.map((sz, sIdx) => (
                            <div
                              key={sz.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/40 p-3"
                            >
                              <div className="flex flex-1 flex-wrap items-center gap-2">
                                <input
                                  value={sz.sizeLabel}
                                  onChange={(e) =>
                                    updateProductLocal(selectedProduct.id, (p) => ({
                                      ...p,
                                      variants: p.variants.map((v, idx) =>
                                        idx === selectedVariantIdx
                                          ? {
                                              ...v,
                                              sizes: v.sizes.map((row, i) =>
                                                i === sIdx
                                                  ? { ...row, sizeLabel: e.target.value }
                                                  : row
                                              ),
                                            }
                                          : v
                                      ),
                                    }))
                                  }
                                  className="w-24 rounded-lg border border-white/10 bg-black px-2.5 py-1.5 font-mono text-xs font-bold text-white"
                                />
                                <input
                                  value={sz.sku}
                                  onChange={(e) =>
                                    updateProductLocal(selectedProduct.id, (p) => ({
                                      ...p,
                                      variants: p.variants.map((v, idx) =>
                                        idx === selectedVariantIdx
                                          ? {
                                              ...v,
                                              sizes: v.sizes.map((row, i) =>
                                                i === sIdx
                                                  ? { ...row, sku: e.target.value }
                                                  : row
                                              ),
                                            }
                                          : v
                                      ),
                                    }))
                                  }
                                  className="min-w-[140px] flex-1 rounded-lg border border-white/10 bg-black px-2.5 py-1.5 font-mono text-xs text-zinc-300"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateStock(
                                      sz.sku,
                                      sz.stockCount - 1,
                                      selectedProduct.id
                                    )
                                  }
                                  className="rounded-lg border border-white/10 px-2.5 py-1 font-mono text-xs text-zinc-300 hover:bg-white/10"
                                >
                                  -1
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  value={sz.stockCount}
                                  onChange={(e) =>
                                    handleUpdateStock(
                                      sz.sku,
                                      Number(e.target.value),
                                      selectedProduct.id
                                    )
                                  }
                                  className="w-16 rounded-lg border border-white/15 bg-black py-1 text-center font-mono text-xs text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateStock(
                                      sz.sku,
                                      sz.stockCount + 5,
                                      selectedProduct.id
                                    )
                                  }
                                  className="rounded-lg border border-white/10 px-2.5 py-1 font-mono text-xs text-emerald-300 hover:bg-white/10"
                                >
                                  +5
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateProductLocal(selectedProduct.id, (p) => ({
                                      ...p,
                                      variants: p.variants.map((v, idx) =>
                                        idx === selectedVariantIdx
                                          ? {
                                              ...v,
                                              sizes: v.sizes.filter(
                                                (_, i) => i !== sIdx
                                              ),
                                            }
                                          : v
                                      ),
                                    }))
                                  }
                                  className="p-1.5 text-zinc-500 hover:text-red-400"
                                  aria-label={`Remove ${sz.sizeLabel}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 4: TECHNICAL SPECIFICATIONS */}
                    {productSubTab === 'specs' && (
                      <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-zinc-400">
                            Key-value hardware specifications rendered on the
                            product page & lineup cards.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const entries = Object.entries(
                                selectedProduct.specsJson || {}
                              );
                              const nextKey = `Spec ${entries.length + 1}`;
                              updateProductLocal(selectedProduct.id, (p) => ({
                                ...p,
                                specsJson: {
                                  ...(p.specsJson || {}),
                                  [nextKey]: 'Value',
                                },
                              }));
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 font-mono text-[11px] text-white"
                          >
                            <Plus className="h-3 w-3" /> ADD SPEC ROW
                          </button>
                        </div>

                        {Object.entries(selectedProduct.specsJson || {}).map(
                          ([specKey, specVal], idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                value={specKey}
                                onChange={(e) => {
                                  const nextKey = e.target.value;
                                  updateProductLocal(selectedProduct.id, (p) => {
                                    const entries = Object.entries(
                                      p.specsJson || {}
                                    );
                                    entries[idx] = [nextKey, specVal];
                                    return {
                                      ...p,
                                      specsJson: Object.fromEntries(entries),
                                    };
                                  });
                                }}
                                placeholder="Spec Label"
                                className="w-1/3 rounded-xl border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-zinc-300"
                              />
                              <input
                                value={specVal}
                                onChange={(e) =>
                                  updateProductLocal(selectedProduct.id, (p) => ({
                                    ...p,
                                    specsJson: {
                                      ...(p.specsJson || {}),
                                      [specKey]: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="Specification value"
                                className="flex-1 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateProductLocal(selectedProduct.id, (p) => {
                                    const entries = Object.entries(
                                      p.specsJson || {}
                                    ).filter((_, i) => i !== idx);
                                    return {
                                      ...p,
                                      specsJson: Object.fromEntries(entries),
                                    };
                                  })
                                }
                                className="p-2 text-zinc-500 hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* SUB-TAB 5: 3D CAMERA & SCROLL HOTSPOTS */}
                    {productSubTab === 'hotspots' && (
                      <div className="mt-5 space-y-5">
                        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D12]">
                          <ShoeStage
                            key={`hotspot-${selectedProduct.id}-${selectedVariant.id}-${selectedVariant.glbModelUrl || ''}`}
                            mode="admin-studio"
                            primaryGlowHex={selectedVariant.primaryGlowHex}
                            secondaryAccentHex={selectedVariant.secondaryAccentHex}
                            glbModelUrl={selectedVariant.glbModelUrl}
                            silhouetteVariant={getSilhouetteVariant(
                              selectedProduct.slug
                            )}
                            deconstructFactor={studioExplode}
                            previewCamera={previewCamera}
                            onCameraTelemetry={(pos, tgt) => {
                              setLiveCameraPos(pos);
                              setLiveCameraTarget(tgt);
                            }}
                          />
                          <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-white/15 bg-black/75 px-3 py-2 font-mono text-[10px]">
                            <p className="text-zinc-400">CAMERA TELEMETRY</p>
                            <p className="text-white">
                              POS: [{liveCameraPos.x}, {liveCameraPos.y},{' '}
                              {liveCameraPos.z}]
                            </p>
                          </div>
                          <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-xl border border-white/15 bg-black/75 px-3 py-2">
                            <span className="font-mono text-[10px] text-zinc-300">
                              EXPLODE
                            </span>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.01}
                              value={studioExplode}
                              onChange={(e) =>
                                setStudioExplode(Number(e.target.value))
                              }
                              className="flex-1 accent-white"
                            />
                            <span className="font-mono text-xs text-white">
                              {Math.round(studioExplode * 100)}%
                            </span>
                          </div>
                        </div>

                        {/* Capture New Hotspot */}
                        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-zinc-400">
                              SCROLL MILESTONE: {hotspotPct}%
                            </span>
                            <div className="flex gap-1">
                              {[15, 45, 75, 95].map((pct) => (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => setHotspotPct(pct)}
                                  className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] ${
                                    hotspotPct === pct
                                      ? 'bg-white font-bold text-black'
                                      : 'border border-white/15 text-zinc-300'
                                  }`}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={hotspotPct}
                            onChange={(e) => setHotspotPct(Number(e.target.value))}
                            className="w-full accent-white"
                          />
                          <input
                            value={hotspotTitle}
                            onChange={(e) => setHotspotTitle(e.target.value)}
                            placeholder="Hotspot Title"
                            className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white"
                          />
                          <textarea
                            rows={2}
                            value={hotspotSubtitle}
                            onChange={(e) => setHotspotSubtitle(e.target.value)}
                            placeholder="Hotspot Subtitle"
                            className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={handleCaptureHotspot}
                              className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 font-mono text-xs font-bold text-black"
                              style={{
                                backgroundColor: selectedVariant.primaryGlowHex,
                              }}
                            >
                              <Camera className="h-3.5 w-3.5" /> CAPTURE HOTSPOT (
                              {hotspotPct}%)
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveHotspotsToBackend}
                              className="rounded-full border border-white/20 bg-white/10 px-4 py-2.5 font-mono text-xs font-bold text-white"
                            >
                              SYNC HOTSPOTS
                            </button>
                          </div>
                        </div>

                        {/* Editable Hotspots List */}
                        <div className="space-y-2.5">
                          {selectedProduct.hotspots.map((hs) => (
                            <div
                              key={hs.id}
                              className="space-y-2 rounded-2xl border border-white/10 bg-black/40 p-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={hs.scrollPercentage}
                                    onChange={(e) =>
                                      updateProductLocal(selectedProduct.id, (p) => ({
                                        ...p,
                                        hotspots: p.hotspots.map((h) =>
                                          h.id === hs.id
                                            ? {
                                                ...h,
                                                scrollPercentage: Number(
                                                  e.target.value
                                                ),
                                              }
                                            : h
                                        ),
                                      }))
                                    }
                                    className="w-16 rounded-lg border border-white/15 bg-black px-2 py-1 font-mono text-xs text-white"
                                  />
                                  <span className="font-mono text-[10px] text-zinc-400">
                                    % SCROLL
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewCamera({
                                        position: hs.cameraPosition,
                                        target: hs.cameraTarget,
                                      })
                                    }
                                    className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[10px] text-zinc-200 hover:bg-white/10"
                                  >
                                    PREVIEW ANGLE
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateProductLocal(selectedProduct.id, (p) => ({
                                        ...p,
                                        hotspots: p.hotspots.filter(
                                          (h) => h.id !== hs.id
                                        ),
                                      }))
                                    }
                                    className="p-1 text-zinc-500 hover:text-red-400"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              <input
                                value={hs.title}
                                onChange={(e) =>
                                  updateProductLocal(selectedProduct.id, (p) => ({
                                    ...p,
                                    hotspots: p.hotspots.map((h) =>
                                      h.id === hs.id
                                        ? { ...h, title: e.target.value }
                                        : h
                                    ),
                                  }))
                                }
                                className="w-full rounded-lg border border-white/10 bg-black px-3 py-1.5 text-xs font-bold text-white"
                              />
                              <input
                                value={hs.subtitle}
                                onChange={(e) =>
                                  updateProductLocal(selectedProduct.id, (p) => ({
                                    ...p,
                                    hotspots: p.hotspots.map((h) =>
                                      h.id === hs.id
                                        ? { ...h, subtitle: e.target.value }
                                        : h
                                    ),
                                  }))
                                }
                                className="w-full rounded-lg border border-white/10 bg-black px-3 py-1.5 text-xs text-zinc-300"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 6: PRODUCT SEO & SERP PREVIEW */}
                    {productSubTab === 'seo' && (
                      <div className="mt-5 space-y-4">
                        <label className="block">
                          <div className="flex justify-between font-mono text-[10px]">
                            <span className="text-zinc-400">
                              META TITLE (50–60 CHARS)
                            </span>
                            <span
                              className={
                                selectedProduct.metaTitle.length >= 45 &&
                                selectedProduct.metaTitle.length <= 62
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }
                            >
                              {selectedProduct.metaTitle.length} chars
                            </span>
                          </div>
                          <input
                            value={selectedProduct.metaTitle}
                            onChange={(e) =>
                              updateProductLocal(selectedProduct.id, (p) => ({
                                ...p,
                                metaTitle: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-sm text-white"
                          />
                        </label>

                        <label className="block">
                          <div className="flex justify-between font-mono text-[10px]">
                            <span className="text-zinc-400">
                              META DESCRIPTION (140–160 CHARS)
                            </span>
                            <span
                              className={
                                selectedProduct.metaDescription.length >= 130 &&
                                selectedProduct.metaDescription.length <= 165
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }
                            >
                              {selectedProduct.metaDescription.length} chars
                            </span>
                          </div>
                          <textarea
                            rows={3}
                            value={selectedProduct.metaDescription}
                            onChange={(e) =>
                              updateProductLocal(selectedProduct.id, (p) => ({
                                ...p,
                                metaDescription: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                          />
                        </label>

                        <label className="block">
                          <span className="font-mono text-[10px] text-zinc-400">
                            OPEN GRAPH IMAGE URL
                          </span>
                          <input
                            value={selectedProduct.ogImageUrl}
                            onChange={(e) =>
                              updateProductLocal(selectedProduct.id, (p) => ({
                                ...p,
                                ogImageUrl: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-xs text-white"
                          />
                        </label>

                        <label className="block">
                          <span className="font-mono text-[10px] text-zinc-400">
                            KEYWORDS (COMMA SEPARATED)
                          </span>
                          <input
                            value={selectedProduct.keywords.join(', ')}
                            onChange={(e) =>
                              updateProductLocal(selectedProduct.id, (p) => ({
                                ...p,
                                keywords: e.target.value
                                  .split(',')
                                  .map((k) => k.trim())
                                  .filter(Boolean),
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                          />
                        </label>

                        {/* SERP Snippet Box */}
                        <div className="rounded-2xl border border-white/10 bg-[#18181D] p-5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-emerald-400">
                              GOOGLE SERP PREVIEW
                            </span>
                            <div className="flex rounded-full border border-white/10 p-0.5 font-mono text-[10px]">
                              <button
                                type="button"
                                onClick={() => setSerpDevice('desktop')}
                                className={`rounded-full px-2.5 py-0.5 ${
                                  serpDevice === 'desktop'
                                    ? 'bg-white font-bold text-black'
                                    : 'text-zinc-400'
                                }`}
                              >
                                DESKTOP
                              </button>
                              <button
                                type="button"
                                onClick={() => setSerpDevice('mobile')}
                                className={`rounded-full px-2.5 py-0.5 ${
                                  serpDevice === 'mobile'
                                    ? 'bg-white font-bold text-black'
                                    : 'text-zinc-400'
                                }`}
                              >
                                MOBILE
                              </button>
                            </div>
                          </div>
                          <div
                            className={`mt-3 ${
                              serpDevice === 'mobile' ? 'max-w-sm' : 'w-full'
                            }`}
                          >
                            <p className="text-xs text-zinc-400">
                              {seoConfig.siteUrl} › product › {selectedProduct.slug}
                            </p>
                            <h4 className="mt-1 text-base font-medium text-[#8AB4F8]">
                              {selectedProduct.metaTitle}
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                              {selectedProduct.metaDescription}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB: HERO SECTION                                              */}
            {/* ============================================================== */}
            {activeTab === 'section-hero' && (
              <div className="space-y-4">
                {renderSectionHeaderControls(
                  'HERO SECTION',
                  'Controls the main SSR H1 headline, eyebrow badge, subheadline, and CTAs above the 3D carousel.',
                  heroSection
                )}

                <div className="space-y-4 rounded-3xl border border-white/10 bg-[#121216] p-6">
                  <label className="block">
                    <span className="font-mono text-[10px] text-zinc-400">
                      EYEBROW BADGE TEXT
                    </span>
                    <input
                      value={String(heroSection.contentJson.eyebrow || '')}
                      onChange={(e) =>
                        updateSectionByType('HERO_CONFIG', (s) => ({
                          ...s,
                          contentJson: { ...s.contentJson, eyebrow: e.target.value },
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 font-mono text-xs text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="font-mono text-[10px] text-zinc-400">
                      PRIMARY H1 HEADLINE
                    </span>
                    <input
                      value={String(heroSection.contentJson.headline || '')}
                      onChange={(e) =>
                        updateSectionByType('HERO_CONFIG', (s) => ({
                          ...s,
                          contentJson: { ...s.contentJson, headline: e.target.value },
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm font-bold text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="font-mono text-[10px] text-zinc-400">
                      SUBHEADLINE COPY
                    </span>
                    <textarea
                      rows={3}
                      value={String(heroSection.contentJson.subheadline || '')}
                      onChange={(e) =>
                        updateSectionByType('HERO_CONFIG', (s) => ({
                          ...s,
                          contentJson: {
                            ...s.contentJson,
                            subheadline: e.target.value,
                          },
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-xs text-white"
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="font-mono text-[10px] text-zinc-400">
                        PRIMARY CTA LABEL
                      </span>
                      <input
                        value={String(heroSection.contentJson.primaryCtaText || '')}
                        onChange={(e) =>
                          updateSectionByType('HERO_CONFIG', (s) => ({
                            ...s,
                            contentJson: {
                              ...s.contentJson,
                              primaryCtaText: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 font-mono text-xs text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] text-zinc-400">
                        PRIMARY CTA HREF
                      </span>
                      <input
                        value={String(heroSection.contentJson.primaryCtaHref || '')}
                        onChange={(e) =>
                          updateSectionByType('HERO_CONFIG', (s) => ({
                            ...s,
                            contentJson: {
                              ...s.contentJson,
                              primaryCtaHref: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 font-mono text-xs text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] text-zinc-400">
                        SECONDARY CTA LABEL (OPTIONAL)
                      </span>
                      <input
                        value={String(heroSection.contentJson.secondaryCtaText || '')}
                        onChange={(e) =>
                          updateSectionByType('HERO_CONFIG', (s) => ({
                            ...s,
                            contentJson: {
                              ...s.contentJson,
                              secondaryCtaText: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 font-mono text-xs text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] text-zinc-400">
                        SECONDARY CTA HREF
                      </span>
                      <input
                        value={String(heroSection.contentJson.secondaryCtaHref || '')}
                        onChange={(e) =>
                          updateSectionByType('HERO_CONFIG', (s) => ({
                            ...s,
                            contentJson: {
                              ...s.contentJson,
                              secondaryCtaHref: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 font-mono text-xs text-white"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB: STATEMENT & METRICS SECTION                               */}
            {/* ============================================================== */}
            {activeTab === 'section-statement' && (
              <div className="space-y-4">
                {renderSectionHeaderControls(
                  'STATEMENT & METRICS SECTION',
                  'Controls the Biomechanical Telemetry section headline, story paragraph, and KPI tiles.',
                  statementSection
                )}

                <div className="space-y-4 rounded-3xl border border-white/10 bg-[#121216] p-6">
                  <label className="block">
                    <span className="font-mono text-[10px] text-zinc-400">
                      KICKER LABEL
                    </span>
                    <input
                      value={String(statementSection.contentJson.kicker || '')}
                      onChange={(e) =>
                        updateSectionByType('STATEMENT_BANNER', (s) => ({
                          ...s,
                          contentJson: { ...s.contentJson, kicker: e.target.value },
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 font-mono text-xs text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="font-mono text-[10px] text-zinc-400">
                      STATEMENT HEADLINE
                    </span>
                    <input
                      value={String(statementSection.contentJson.headline || '')}
                      onChange={(e) =>
                        updateSectionByType('STATEMENT_BANNER', (s) => ({
                          ...s,
                          contentJson: { ...s.contentJson, headline: e.target.value },
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm font-bold text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="font-mono text-[10px] text-zinc-400">
                      ENGINEERING NARRATIVE
                    </span>
                    <textarea
                      rows={3}
                      value={String(statementSection.contentJson.body || '')}
                      onChange={(e) =>
                        updateSectionByType('STATEMENT_BANNER', (s) => ({
                          ...s,
                          contentJson: { ...s.contentJson, body: e.target.value },
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-xs text-white"
                    />
                  </label>

                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-zinc-400">
                        TELEMETRY METRIC CARDS
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateSectionByType('STATEMENT_BANNER', (s) => ({
                            ...s,
                            contentJson: {
                              ...s.contentJson,
                              metrics: [
                                ...statementMetrics,
                                { label: 'NEW METRIC', value: '100%' },
                              ],
                            },
                          }))
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] text-white"
                      >
                        <Plus className="h-3 w-3" /> ADD METRIC
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {statementMetrics.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            value={m.label}
                            onChange={(e) => {
                              const next = [...statementMetrics];
                              next[idx] = { ...next[idx], label: e.target.value };
                              updateSectionByType('STATEMENT_BANNER', (s) => ({
                                ...s,
                                contentJson: { ...s.contentJson, metrics: next },
                              }));
                            }}
                            placeholder="LABEL"
                            className="flex-1 rounded-xl border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-zinc-300"
                          />
                          <input
                            value={m.value}
                            onChange={(e) => {
                              const next = [...statementMetrics];
                              next[idx] = { ...next[idx], value: e.target.value };
                              updateSectionByType('STATEMENT_BANNER', (s) => ({
                                ...s,
                                contentJson: { ...s.contentJson, metrics: next },
                              }));
                            }}
                            placeholder="VALUE"
                            className="w-32 rounded-xl border border-white/10 bg-black/50 px-3 py-2 font-display text-sm font-bold text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = statementMetrics.filter(
                                (_, i) => i !== idx
                              );
                              updateSectionByType('STATEMENT_BANNER', (s) => ({
                                ...s,
                                contentJson: { ...s.contentJson, metrics: next },
                              }));
                            }}
                            className="p-2 text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB: FAQ SECTION                                               */}
            {/* ============================================================== */}
            {activeTab === 'section-faq' && (
              <div className="space-y-4">
                {renderSectionHeaderControls(
                  'FAQ SECTION & JSON-LD',
                  'Edits sync directly to the homepage FAQ accordion and Google FAQPage structured schema.',
                  faqSection
                )}

                <div className="space-y-4 rounded-3xl border border-white/10 bg-[#121216] p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="font-mono text-[10px] text-zinc-400">
                        FAQ SECTION HEADING
                      </span>
                      <input
                        value={String(faqSection.contentJson.heading || '')}
                        onChange={(e) =>
                          updateSectionByType('FAQ_LIST', (s) => ({
                            ...s,
                            contentJson: { ...s.contentJson, heading: e.target.value },
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] text-zinc-400">
                        FAQ SUBHEADING
                      </span>
                      <input
                        value={String(faqSection.contentJson.subheading || '')}
                        onChange={(e) =>
                          updateSectionByType('FAQ_LIST', (s) => ({
                            ...s,
                            contentJson: {
                              ...s.contentJson,
                              subheading: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                      />
                    </label>
                  </div>

                  <div className="space-y-3 pt-2">
                    {faqItems.map((item, fIdx) => (
                      <div
                        key={fIdx}
                        className="space-y-2 rounded-2xl border border-white/10 bg-black/40 p-3.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-zinc-500">
                            Q{fIdx + 1}
                          </span>
                          <input
                            value={item.question}
                            onChange={(e) => {
                              const next = [...faqItems];
                              next[fIdx] = {
                                ...next[fIdx],
                                question: e.target.value,
                              };
                              updateSectionByType('FAQ_LIST', (s) => ({
                                ...s,
                                contentJson: { ...s.contentJson, items: next },
                              }));
                            }}
                            className="flex-1 rounded-xl border border-white/10 bg-black px-3 py-1.5 text-xs font-semibold text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = faqItems.filter((_, i) => i !== fIdx);
                              updateSectionByType('FAQ_LIST', (s) => ({
                                ...s,
                                contentJson: { ...s.contentJson, items: next },
                              }));
                            }}
                            className="p-1 text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={item.answer}
                          onChange={(e) => {
                            const next = [...faqItems];
                            next[fIdx] = { ...next[fIdx], answer: e.target.value };
                            updateSectionByType('FAQ_LIST', (s) => ({
                              ...s,
                              contentJson: { ...s.contentJson, items: next },
                            }));
                          }}
                          className="w-full rounded-xl border border-white/10 bg-black px-3 py-1.5 text-xs text-zinc-300"
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        updateSectionByType('FAQ_LIST', (s) => ({
                          ...s,
                          contentJson: {
                            ...s.contentJson,
                            items: [
                              ...faqItems,
                              {
                                question: 'New Technical Drop Question?',
                                answer:
                                  'Detailed materials or express global shipping policy answer.',
                              },
                            ],
                          },
                        }))
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 font-mono text-xs text-white hover:bg-white/5"
                    >
                      <Plus className="h-3.5 w-3.5" /> ADD FAQ ENTRY
                    </button>
                  </div>

                  {/* Generated JSON-LD Schema Inspector */}
                  <div className="pt-4">
                    <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                      <FileCode2 className="h-3.5 w-3.5 text-glow-primary" />
                      <span>GENERATED FAQPAGE JSON-LD SCHEMA</span>
                    </div>
                    <pre className="mt-2 max-h-56 overflow-auto rounded-2xl border border-white/10 bg-black p-4 font-mono text-[10px] text-emerald-300">
                      {JSON.stringify(buildFaqSchema(faqItems), null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB: NEWSLETTER SECTION                                        */}
            {/* ============================================================== */}
            {activeTab === 'section-newsletter' && (
              <div className="space-y-4">
                {renderSectionHeaderControls(
                  'NEWSLETTER SECTION',
                  'Controls the encrypted private-drop signup section at the bottom of the storefront.',
                  newsletterSection
                )}

                <div className="space-y-4 rounded-3xl border border-white/10 bg-[#121216] p-6">
                  <label className="block">
                    <span className="font-mono text-[10px] text-zinc-400">
                      SECTION HEADING
                    </span>
                    <input
                      value={String(newsletterSection.contentJson.heading || '')}
                      onChange={(e) =>
                        updateSectionByType('NEWSLETTER', (s) => ({
                          ...s,
                          contentJson: { ...s.contentJson, heading: e.target.value },
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm font-bold text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="font-mono text-[10px] text-zinc-400">
                      SUBHEADING
                    </span>
                    <textarea
                      rows={2}
                      value={String(newsletterSection.contentJson.subheading || '')}
                      onChange={(e) =>
                        updateSectionByType('NEWSLETTER', (s) => ({
                          ...s,
                          contentJson: {
                            ...s.contentJson,
                            subheading: e.target.value,
                          },
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-xs text-white"
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="font-mono text-[10px] text-zinc-400">
                        INPUT PLACEHOLDER
                      </span>
                      <input
                        value={String(newsletterSection.contentJson.placeholder || '')}
                        onChange={(e) =>
                          updateSectionByType('NEWSLETTER', (s) => ({
                            ...s,
                            contentJson: {
                              ...s.contentJson,
                              placeholder: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 font-mono text-xs text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] text-zinc-400">
                        BUTTON CTA TEXT
                      </span>
                      <input
                        value={String(newsletterSection.contentJson.ctaText || '')}
                        onChange={(e) =>
                          updateSectionByType('NEWSLETTER', (s) => ({
                            ...s,
                            contentJson: {
                              ...s.contentJson,
                              ctaText: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 font-mono text-xs text-white"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB: GLOBAL SEO CONFIG                                         */}
            {/* ============================================================== */}
            {activeTab === 'global-seo' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121216] p-4">
                  <div>
                    <h2 className="font-display text-lg font-bold text-white">
                      GLOBAL TECHNICAL SEO & ORGANIZATION SCHEMA
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Controls dynamic sitewide metadata, canonical domain, and
                      Google Organization JSON-LD.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={savingBusy}
                    onClick={handleSaveGlobalSeo}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 font-mono text-xs font-bold text-black hover:bg-zinc-200 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{savingBusy ? 'SAVING...' : 'SAVE GLOBAL SEO'}</span>
                  </button>
                </div>

                <div className="space-y-4 rounded-3xl border border-white/10 bg-[#121216] p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="font-mono text-[10px] text-zinc-400">
                        BRAND / SITE NAME
                      </span>
                      <input
                        value={seoConfig.siteName}
                        onChange={(e) =>
                          setSeoConfig((prev) => ({
                            ...prev,
                            siteName: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-sm text-white"
                      />
                    </label>

                    <label className="block">
                      <span className="font-mono text-[10px] text-zinc-400">
                        CANONICAL SITE URL
                      </span>
                      <input
                        value={seoConfig.siteUrl}
                        onChange={(e) =>
                          setSeoConfig((prev) => ({
                            ...prev,
                            siteUrl: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-xs text-white"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="font-mono text-[10px] text-zinc-400">
                      DEFAULT META TITLE ({seoConfig.defaultMetaTitle.length} chars)
                    </span>
                    <input
                      value={seoConfig.defaultMetaTitle}
                      onChange={(e) =>
                        setSeoConfig((prev) => ({
                          ...prev,
                          defaultMetaTitle: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-sm text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="font-mono text-[10px] text-zinc-400">
                      DEFAULT META DESCRIPTION (
                      {seoConfig.defaultMetaDescription.length} chars)
                    </span>
                    <textarea
                      rows={3}
                      value={seoConfig.defaultMetaDescription}
                      onChange={(e) =>
                        setSeoConfig((prev) => ({
                          ...prev,
                          defaultMetaDescription: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="font-mono text-[10px] text-zinc-400">
                        ORGANIZATION SCHEMA NAME
                      </span>
                      <input
                        value={seoConfig.organizationSchemaJson.name}
                        onChange={(e) =>
                          setSeoConfig((prev) => ({
                            ...prev,
                            organizationSchemaJson: {
                              ...prev.organizationSchemaJson,
                              name: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] text-zinc-400">
                        SUPPORT EMAIL
                      </span>
                      <input
                        value={seoConfig.organizationSchemaJson.contactEmail}
                        onChange={(e) =>
                          setSeoConfig((prev) => ({
                            ...prev,
                            organizationSchemaJson: {
                              ...prev.organizationSchemaJson,
                              contactEmail: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 font-mono text-xs text-white"
                      />
                    </label>
                  </div>

                  {/* Homepage Google SERP Card */}
                  <div className="rounded-2xl border border-white/10 bg-[#18181D] p-5">
                    <p className="font-mono text-[10px] text-emerald-400">
                      HOMEPAGE GOOGLE SERP PREVIEW
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">{seoConfig.siteUrl}/</p>
                    <h4 className="mt-1 text-base font-medium text-[#8AB4F8]">
                      {seoConfig.defaultMetaTitle}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-300">
                      {seoConfig.defaultMetaDescription}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB: STANDARD ORDERS & INVENTORY FULFILLMENT TABLE             */}
            {/* ============================================================== */}
            {activeTab === 'orders' && canAccessTab('orders') && (
              <div className="space-y-6">
                {/* KPI Summary Bar */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-[#121216] p-5">
                    <p className="font-mono text-[10px] text-zinc-400">
                      TOTAL REVENUE
                    </p>
                    <p className="mt-1 font-display text-3xl font-extrabold text-white">
                      ${totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#121216] p-5">
                    <p className="font-mono text-[10px] text-zinc-400">
                      TOTAL ORDERS
                    </p>
                    <p className="mt-1 font-display text-3xl font-extrabold text-white">
                      {orders.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#121216] p-5">
                    <p className="font-mono text-[10px] text-zinc-400">
                      PENDING FULFILLMENT
                    </p>
                    <p className="mt-1 font-display text-3xl font-extrabold text-emerald-400">
                      {pendingOrdersCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#121216] p-5">
                    <p className="font-mono text-[10px] text-zinc-400">
                      LOW-STOCK SKUS (≤ 3)
                    </p>
                    <p className="mt-1 font-display text-3xl font-extrabold text-amber-400">
                      {lowStockAlerts.length}
                    </p>
                  </div>
                </div>

                {/* Orders Table Card */}
                <div className="rounded-3xl border border-white/10 bg-[#121216] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="relative min-w-[240px] flex-1">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search by Order #, Customer Name, or Email..."
                        className="w-full rounded-full border border-white/10 bg-black/60 py-2 pl-10 pr-4 font-mono text-xs text-white outline-none focus:border-white/30"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        ['ALL', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED'] as const
                      ).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setOrderStatusFilter(st)}
                          className={`rounded-full px-3.5 py-1.5 font-mono text-[11px] transition ${
                            orderStatusFilter === st
                              ? 'bg-white font-bold text-black'
                              : 'border border-white/10 bg-black/40 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleCreateDemoOrder}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1.5 font-mono text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25"
                      >
                        <Plus className="h-3 w-3" /> CREATE DEMO ORDER
                      </button>
                    </div>
                  </div>

                  {/* Responsive Standard Orders Table */}
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-white/10 font-mono text-[10px] tracking-wider text-zinc-400">
                          <th className="py-3 pr-4">ORDER #</th>
                          <th className="py-3 pr-4">DATE</th>
                          <th className="py-3 pr-4">CUSTOMER</th>
                          <th className="py-3 pr-4">DESTINATION</th>
                          <th className="py-3 pr-4">ITEMS</th>
                          <th className="py-3 pr-4">TOTAL</th>
                          <th className="py-3 pr-4">STATUS</th>
                          <th className="py-3 text-right">DETAILS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-xs">
                        {filteredOrders.map((order) => {
                          const isExpanded = expandedOrderId === order.id;
                          return (
                            <React.Fragment key={order.id}>
                              <tr className="hover:bg-white/[0.02]">
                                <td className="py-3.5 pr-4 font-mono font-bold text-white">
                                  {order.orderNumber}
                                </td>
                                <td className="py-3.5 pr-4 font-mono text-[11px] text-zinc-400">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-3.5 pr-4">
                                  <p className="font-semibold text-white">
                                    {order.customerName}
                                  </p>
                                  <p className="font-mono text-[10px] text-zinc-400">
                                    {order.customerEmail}
                                  </p>
                                </td>
                                <td className="py-3.5 pr-4 text-zinc-300">
                                  {order.shippingAddressJson.city},{' '}
                                  {order.shippingAddressJson.country}
                                </td>
                                <td className="py-3.5 pr-4 font-mono text-[11px] text-zinc-300">
                                  {order.items.reduce((s, i) => s + i.quantity, 0)}{' '}
                                  item(s)
                                </td>
                                <td className="py-3.5 pr-4 font-mono font-bold text-white">
                                  ${order.totalAmount.toFixed(0)}
                                </td>
                                <td className="py-3.5 pr-4">
                                  <select
                                    aria-label={`Status for ${order.orderNumber}`}
                                    value={order.status}
                                    onChange={(e) =>
                                      handleOrderStatusChange(
                                        order.id,
                                        e.target.value as OrderStatus
                                      )
                                    }
                                    className="rounded-xl border border-white/15 bg-black px-2.5 py-1.5 font-mono text-[11px] text-white"
                                  >
                                    <option value="PENDING">PENDING</option>
                                    <option value="PAID">PAID</option>
                                    <option value="SHIPPED">SHIPPED</option>
                                    <option value="DELIVERED">DELIVERED</option>
                                  </select>
                                </td>
                                <td className="py-3.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedOrderId(isExpanded ? null : order.id)
                                    }
                                    className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] text-zinc-300 hover:bg-white/10"
                                  >
                                    <span>{isExpanded ? 'HIDE' : 'VIEW'}</span>
                                    {isExpanded ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                  </button>
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr className="bg-black/40">
                                  <td colSpan={8} className="p-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                      <div>
                                        <p className="font-mono text-[10px] text-zinc-400">
                                          SHIPPING ADDRESS & PAYMENT
                                        </p>
                                        <p className="mt-1 text-xs text-white">
                                          {order.shippingAddressJson.line1}
                                        </p>
                                        <p className="text-xs text-zinc-300">
                                          {order.shippingAddressJson.city},{' '}
                                          {order.shippingAddressJson.state}{' '}
                                          {order.shippingAddressJson.postalCode} —{' '}
                                          {order.shippingAddressJson.country}
                                        </p>
                                        {order.stripePaymentIntentId && (
                                          <p className="mt-1.5 font-mono text-[10px] text-zinc-500">
                                            Payment Intent:{' '}
                                            {order.stripePaymentIntentId}
                                          </p>
                                        )}
                                      </div>

                                      <div>
                                        <p className="font-mono text-[10px] text-zinc-400">
                                          ORDERED LINE ITEMS
                                        </p>
                                        <div className="mt-1.5 space-y-1.5">
                                          {order.items.map((item) => (
                                            <div
                                              key={item.id}
                                              className="flex justify-between rounded-xl border border-white/10 bg-[#121216] px-3 py-2 font-mono text-[11px]"
                                            >
                                              <span className="text-zinc-200">
                                                {item.quantity}x{' '}
                                                {item.productName || item.variantId}{' '}
                                                ({item.sizeLabel} • {item.sizeSku})
                                              </span>
                                              <span className="font-bold text-white">
                                                ${item.unitPrice * item.quantity}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}

                        {filteredOrders.length === 0 && (
                          <tr>
                            <td
                              colSpan={8}
                              className="py-10 text-center font-mono text-xs text-zinc-500"
                            >
                              NO ORDERS MATCHING CURRENT FILTER
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Low-Stock Alert Panel with Quick +10 Restock */}
                <div className="rounded-3xl border border-white/10 bg-[#121216] p-6">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <h2 className="font-display text-base font-bold text-white">
                      LOW-STOCK INVENTORY MONITOR ({lowStockAlerts.length} SKUS ≤ 3)
                    </h2>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {lowStockAlerts.map((alert) => (
                      <div
                        key={alert.sku}
                        className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {alert.productName}
                          </p>
                          <p className="font-mono text-[10px] text-zinc-300">
                            {alert.colorName} • {alert.sizeLabel} ({alert.stockCount}{' '}
                            left)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateStock(
                              alert.sku,
                              alert.stockCount + 10,
                              alert.productId
                            )
                          }
                          className="rounded-full bg-amber-400 px-3 py-1 font-mono text-[10px] font-bold text-black hover:brightness-110"
                        >
                          +10 RESTOCK
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB: USERS & ADMIN CREDENTIALS TRACKER                         */}
            {/* ============================================================== */}
            {activeTab === 'users' && authUser?.role === 'ADMIN' && (
              <div className="space-y-6">
                {/* Admin Self-Credentials Update Card */}
                <form
                  onSubmit={handleSaveAdminCredentials}
                  className="rounded-3xl border border-amber-500/30 bg-[#121216] p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300">
                        ADMINISTRATOR ACCESS CONTROL
                      </p>
                      <h2 className="mt-1 font-display text-xl font-bold text-white">
                        Manage &amp; Change Admin Credentials
                      </h2>
                    </div>
                    <button
                      type="submit"
                      disabled={savingBusy}
                      className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 font-mono text-xs font-bold text-black hover:brightness-110 disabled:opacity-50"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>UPDATE ADMIN CREDENTIALS</span>
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                        ADMIN DISPLAY NAME
                      </label>
                      <input
                        value={adminCredName}
                        onChange={(e) => setAdminCredName(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                        ADMIN LOGIN EMAIL
                      </label>
                      <input
                        type="email"
                        required
                        value={adminCredEmail}
                        onChange={(e) => setAdminCredEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                        CURRENT PASSWORD (OPTIONAL)
                      </label>
                      <input
                        type="password"
                        value={adminCurrentPassword}
                        onChange={(e) => setAdminCurrentPassword(e.target.value)}
                        placeholder="Verify current password"
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                        NEW ADMIN PASSWORD
                      </label>
                      <input
                        type="password"
                        minLength={6}
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        placeholder="Min 6 chars to change"
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </form>

                {/* Tracked User Accounts Directory & Inspector */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                  {/* Left: Searchable Users List */}
                  <div className="space-y-3 rounded-3xl border border-white/10 bg-[#121216] p-5 xl:col-span-5">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search users by name, email, city or role..."
                        className="w-full rounded-2xl border border-white/10 bg-black/50 py-2.5 pr-4 pl-10 text-xs text-white placeholder:text-zinc-500"
                      />
                    </div>

                    <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
                      {filteredUsers.map((u) => {
                        const selected = selectedManagedUser?.id === u.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUserId(u.id);
                              setUserNewPassword('');
                            }}
                            className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition ${
                              selected
                                ? 'border-white bg-white/10'
                                : 'border-white/5 bg-black/40 hover:border-white/25'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {u.name}
                              </p>
                              <p className="truncate font-mono text-[10px] text-zinc-400">
                                {u.email}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[9px]">
                                <span
                                  className={`rounded-full px-2 py-0.5 font-bold ${
                                    u.role === 'ADMIN'
                                      ? 'bg-amber-400 text-black'
                                      : u.role === 'EDITOR'
                                      ? 'bg-sky-500/20 text-sky-300'
                                      : 'bg-emerald-500/20 text-emerald-300'
                                  }`}
                                >
                                  {u.role}
                                </span>
                                <span className="rounded-full border border-white/10 px-2 py-0.5 text-zinc-300 uppercase">
                                  {u.authProvider}
                                </span>
                                <span className="text-zinc-400">
                                  {u.orderCount} orders · ${u.totalSpent}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <p className="py-8 text-center font-mono text-xs text-zinc-500">
                          NO USERS MATCH SEARCH FILTER
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Selected User Profile Details, Password Change & Orders */}
                  {selectedManagedUser && (
                    <div className="space-y-5 rounded-3xl border border-white/10 bg-[#121216] p-6 xl:col-span-7">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <div>
                          <p className="font-mono text-[10px] text-amber-300">
                            USER ID · {selectedManagedUser.id}
                          </p>
                          <h3 className="mt-0.5 font-display text-xl font-bold text-white">
                            {selectedManagedUser.name}
                          </h3>
                          <p className="font-mono text-[10px] text-zinc-400">
                            Joined {new Date(selectedManagedUser.createdAt).toLocaleDateString()} ·
                            Last Login {new Date(selectedManagedUser.lastLoginAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={savingBusy}
                          onClick={handleSaveUserAccount}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 font-mono text-xs font-bold text-black hover:bg-zinc-200 disabled:opacity-50"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>SAVE USER &amp; PASSWORD</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                            FULL NAME
                          </label>
                          <input
                            value={selectedManagedUser.name}
                            onChange={(e) =>
                              updateManagedUserLocal(selectedManagedUser.id, (u) => ({
                                ...u,
                                name: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                            EMAIL ADDRESS
                          </label>
                          <input
                            value={selectedManagedUser.email}
                            onChange={(e) =>
                              updateManagedUserLocal(selectedManagedUser.id, (u) => ({
                                ...u,
                                email: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                            ACCOUNT ROLE
                          </label>
                          <select
                            value={selectedManagedUser.role}
                            onChange={(e) =>
                              updateManagedUserLocal(selectedManagedUser.id, (u) => ({
                                ...u,
                                role: e.target.value as ManagedUser['role'],
                              }))
                            }
                            className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-white"
                          >
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="EDITOR">EDITOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                            PHONE NUMBER
                          </label>
                          <input
                            value={selectedManagedUser.phone || ''}
                            onChange={(e) =>
                              updateManagedUserLocal(selectedManagedUser.id, (u) => ({
                                ...u,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="+92 300 ..."
                            className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                            STREET ADDRESS
                          </label>
                          <input
                            value={selectedManagedUser.address || ''}
                            onChange={(e) =>
                              updateManagedUserLocal(selectedManagedUser.id, (u) => ({
                                ...u,
                                address: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                            CITY
                          </label>
                          <input
                            value={selectedManagedUser.city || ''}
                            onChange={(e) =>
                              updateManagedUserLocal(selectedManagedUser.id, (u) => ({
                                ...u,
                                city: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                            STATE
                          </label>
                          <input
                            value={selectedManagedUser.state || ''}
                            onChange={(e) =>
                              updateManagedUserLocal(selectedManagedUser.id, (u) => ({
                                ...u,
                                state: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                            ZIP CODE
                          </label>
                          <input
                            value={selectedManagedUser.zipCode || ''}
                            onChange={(e) =>
                              updateManagedUserLocal(selectedManagedUser.id, (u) => ({
                                ...u,
                                zipCode: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Current & Change Password Box for Selected User (Admin Only) */}
                      <div className="space-y-3 rounded-2xl border border-amber-500/25 bg-black/40 p-4">
                        <div>
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <label className="font-mono text-[10px] font-bold text-emerald-300">
                              CURRENT ACCOUNT PASSWORD
                            </label>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setShowUserCurrentPassword((prev) => !prev)
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#141418] px-2 py-1 font-mono text-[10px] text-zinc-300 hover:border-white/30 hover:text-white"
                              >
                                {showUserCurrentPassword ? (
                                  <>
                                    <EyeOff className="h-3 w-3" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3" />
                                    Show
                                  </>
                                )}
                              </button>
                              {selectedManagedUser.currentPassword && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      typeof navigator !== 'undefined' &&
                                      navigator.clipboard
                                    ) {
                                      navigator.clipboard.writeText(
                                        selectedManagedUser.currentPassword || ''
                                      );
                                      setCopiedPasswordId(selectedManagedUser.id);
                                      setTimeout(() => {
                                        setCopiedPasswordId((prev) =>
                                          prev === selectedManagedUser.id
                                            ? null
                                            : prev
                                        );
                                      }, 2000);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#141418] px-2 py-1 font-mono text-[10px] text-zinc-300 hover:border-white/30 hover:text-white"
                                >
                                  <Copy className="h-3 w-3" />
                                  {copiedPasswordId === selectedManagedUser.id
                                    ? 'Copied'
                                    : 'Copy'}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0A0A0D] px-3.5 py-2 font-mono text-xs text-white">
                            <span>
                              {selectedManagedUser.currentPassword
                                ? showUserCurrentPassword
                                  ? selectedManagedUser.currentPassword
                                  : '•'.repeat(
                                      Math.max(
                                        8,
                                        selectedManagedUser.currentPassword.length
                                      )
                                    )
                                : 'Not recorded yet (Google / legacy account — set a new password below)'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block font-mono text-[10px] font-bold text-amber-300">
                            SET / CHANGE ACCOUNT PASSWORD (LEAVE BLANK TO KEEP CURRENT)
                          </label>
                          <div className="relative">
                            <input
                              type={showUserNewPassword ? 'text' : 'password'}
                              value={userNewPassword}
                              onChange={(e) => setUserNewPassword(e.target.value)}
                              placeholder="Enter new password (min 6 characters)..."
                              className="w-full rounded-xl border border-white/10 bg-[#0A0A0D] px-3.5 py-2 pr-16 font-mono text-xs text-white placeholder:text-zinc-500"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowUserNewPassword((prev) => !prev)
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-[#141418] px-2 py-1 font-mono text-[10px] text-zinc-300 hover:text-white"
                            >
                              {showUserNewPassword ? 'Hide' : 'Show'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tracked Orders by This User */}
                      <div>
                        <p className="mb-2 font-mono text-[10px] text-zinc-400">
                          USER ORDER HISTORY ({selectedManagedUser.orderCount} · ${selectedManagedUser.totalSpent})
                        </p>
                        {selectedManagedUser.orders.length > 0 ? (
                          <div className="space-y-1.5">
                            {selectedManagedUser.orders.map((ord) => (
                              <div
                                key={ord.id}
                                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px]"
                              >
                                <span className="text-white">{ord.orderNumber}</span>
                                <span className="text-zinc-400">{ord.status}</span>
                                <span className="font-bold text-emerald-300">
                                  ${ord.totalAmount}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-xl border border-white/5 bg-black/30 px-3 py-2 font-mono text-[11px] text-zinc-500">
                            No orders placed yet by this user.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB: ROLES & PERMISSIONS (ADMIN ONLY)                          */}
            {/* ============================================================== */}
            {activeTab === 'roles' && authUser?.role === 'ADMIN' && (
              <div className="space-y-6 rounded-3xl border border-white/10 bg-[#121216] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300">
                      ACCESS CONTROL MATRIX
                    </p>
                    <h2 className="mt-1 font-display text-xl font-bold text-white">
                      Roles &amp; Editor Tab Permissions
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400">
                      Control which Admin Studio tabs the <strong className="text-white">EDITOR</strong> role can see and edit, or assign custom per-editor tab overrides. <strong className="text-zinc-300">Users &amp; Access</strong> and <strong className="text-zinc-300">Roles &amp; Permissions</strong> remain Admin-only.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={savingBusy}
                    onClick={handleSaveRolePermissions}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#E11D48] px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-[#BE123C] disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {savingBusy ? 'Saving...' : 'Save Role Permissions'}
                  </button>
                </div>

                {/* Target Selector: Default Editor Role or Specific Editor Account */}
                <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/35 p-4 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                      CONFIGURE PERMISSIONS FOR
                    </label>
                    <select
                      value={roleTargetKey}
                      onChange={(e) => setRoleTargetKey(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0A0A0D] px-3.5 py-2.5 font-mono text-xs text-white"
                    >
                      <option value="__DEFAULT_EDITOR__">
                        Default EDITOR Role (applies to all Editors without override)
                      </option>
                      {editorUsers.map((ed) => {
                        const emailKey = ed.email.trim().toLowerCase();
                        const hasOverride = Boolean(
                          rolePermissions.userTabOverrides[emailKey]
                        );
                        return (
                          <option key={ed.id} value={emailKey}>
                            Editor Account: {ed.name} ({ed.email})
                            {hasOverride ? ' [Custom Override]' : ' [Using Default]'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <button
                      type="button"
                      onClick={() => applyRolePreset(DEFAULT_EDITOR_TABS)}
                      className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 font-mono text-[11px] text-emerald-300 hover:bg-emerald-500/20"
                    >
                      Preset: Editing Tabs Only
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyRolePreset(ASSIGNABLE_ROLE_TABS.map((t) => t.id))
                      }
                      className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-mono text-[11px] text-zinc-200 hover:bg-white/10"
                    >
                      Enable All Non-Admin Tabs
                    </button>
                    {roleTargetKey !== '__DEFAULT_EDITOR__' &&
                      rolePermissions.userTabOverrides[roleTargetKey] && (
                        <button
                          type="button"
                          onClick={() => resetEditorOverride(roleTargetKey)}
                          className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 font-mono text-[11px] text-amber-300 hover:bg-amber-500/20"
                        >
                          Reset to Default Role
                        </button>
                      )}
                  </div>
                </div>

                {/* Tab Checkboxes Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ASSIGNABLE_ROLE_TABS.map((tab) => {
                    const checked = activeRoleTabList.includes(tab.id);
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => toggleRoleTab(tab.id)}
                        className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                          checked
                            ? 'border-emerald-500/45 bg-emerald-500/10 text-white'
                            : 'border-white/10 bg-black/35 text-zinc-400 hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                                tab.category === 'Editing'
                                  ? 'bg-sky-500/15 text-sky-300'
                                  : 'bg-amber-500/15 text-amber-300'
                              }`}
                            >
                              {tab.category}
                            </span>
                            <p className="mt-2 font-mono text-xs font-bold text-white">
                              {tab.label}
                            </p>
                          </div>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border font-mono text-[10px] ${
                              checked
                                ? 'border-emerald-400 bg-emerald-500 text-black'
                                : 'border-white/20 bg-black/60 text-transparent'
                            }`}
                          >
                            ✓
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
                          {tab.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB: CONTACT DETAILS, WHATSAPP & CHATBOT CONFIGURATION         */}
            {/* ============================================================== */}
            {activeTab === 'contact-chat' && canAccessTab('contact-chat') && (
              <form
                onSubmit={handleSaveContactSettings}
                className="space-y-6 rounded-3xl border border-white/10 bg-[#121216] p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
                      LIVE COMMUNICATION &amp; AI CONCIERGE
                    </p>
                    <h2 className="mt-1 font-display text-xl font-bold text-white">
                      Admin Phone, WhatsApp, Email &amp; Chatbot Settings
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400">
                      Changes sync live across the floating WhatsApp button, trilingual
                      chatbot (English, Roman Urdu, Urdu اردو), and site footer.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={savingBusy}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-mono text-xs font-bold text-black hover:bg-zinc-200 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{savingBusy ? 'SAVING...' : 'SAVE CONTACT & BOT'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                      WHATSAPP BUSINESS NUMBER (WITH COUNTRY CODE)
                    </label>
                    <input
                      value={contactSettings.whatsappNumber}
                      onChange={(e) =>
                        setContactSettings((prev) => ({
                          ...prev,
                          whatsappNumber: e.target.value,
                        }))
                      }
                      placeholder="+923001234567"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                      PUBLIC SUPPORT PHONE NUMBER
                    </label>
                    <input
                      value={contactSettings.supportPhone}
                      onChange={(e) =>
                        setContactSettings((prev) => ({
                          ...prev,
                          supportPhone: e.target.value,
                        }))
                      }
                      placeholder="+92 300 1234567"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                      ADMIN / SUPPORT CONTACT EMAIL
                    </label>
                    <input
                      type="email"
                      value={contactSettings.adminEmail}
                      onChange={(e) =>
                        setContactSettings((prev) => ({
                          ...prev,
                          adminEmail: e.target.value,
                        }))
                      }
                      placeholder="hello@ateliervance.com"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                      AI CHATBOT DISPLAY NAME
                    </label>
                    <input
                      value={contactSettings.chatbotName}
                      onChange={(e) =>
                        setContactSettings((prev) => ({
                          ...prev,
                          chatbotName: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                      STUDIO / STOREFRONT ADDRESS
                    </label>
                    <input
                      value={contactSettings.storeAddress}
                      onChange={(e) =>
                        setContactSettings((prev) => ({
                          ...prev,
                          storeAddress: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                      DEFAULT WHATSAPP GREETING MESSAGE
                    </label>
                    <textarea
                      rows={2}
                      value={contactSettings.whatsappGreeting}
                      onChange={(e) =>
                        setContactSettings((prev) => ({
                          ...prev,
                          whatsappGreeting: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-zinc-200">
                  <input
                    type="checkbox"
                    checked={contactSettings.chatbotEnabled}
                    onChange={(e) =>
                      setContactSettings((prev) => ({
                        ...prev,
                        chatbotEnabled: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-emerald-400"
                  />
                  <span>
                    Enable Storefront AI Chatbot (English Default, Roman Urdu &amp; Native Urdu اردو)
                  </span>
                </label>

                <div className="space-y-4 border-t border-white/10 pt-5">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300">
                      CLOUDFLARE EDGE &amp; PRIVACY COMPLIANCE
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold text-white">
                      Cloudflare Web Analytics &amp; Cookie Consent Banner
                    </h3>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-zinc-200">
                    <input
                      type="checkbox"
                      checked={contactSettings.cookieBannerEnabled !== false}
                      onChange={(e) =>
                        setContactSettings((prev) => ({
                          ...prev,
                          cookieBannerEnabled: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-emerald-400"
                    />
                    <span>
                      Enable GDPR/CCPA Cookie &amp; Consent Banner on Storefront
                    </span>
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                        COOKIE BANNER TITLE
                      </label>
                      <input
                        value={contactSettings.cookieBannerTitle ?? ''}
                        onChange={(e) =>
                          setContactSettings((prev) => ({
                            ...prev,
                            cookieBannerTitle: e.target.value,
                          }))
                        }
                        placeholder="Atelier Privacy & Cookie Consent"
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                        CLOUDFLARE ZONE DOMAIN
                      </label>
                      <input
                        value={contactSettings.cloudflareZoneDomain ?? ''}
                        onChange={(e) =>
                          setContactSettings((prev) => ({
                            ...prev,
                            cloudflareZoneDomain: e.target.value,
                          }))
                        }
                        placeholder="ateliervance.com"
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                        COOKIE BANNER DESCRIPTION
                      </label>
                      <textarea
                        rows={2}
                        value={contactSettings.cookieBannerDescription ?? ''}
                        onChange={(e) =>
                          setContactSettings((prev) => ({
                            ...prev,
                            cookieBannerDescription: e.target.value,
                          }))
                        }
                        placeholder="We use essential cookies for bag & checkout security, Cloudflare edge protection, and optional analytics..."
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block font-mono text-[10px] text-zinc-400">
                        CLOUDFLARE WEB ANALYTICS BEACON TOKEN (OPTIONAL)
                      </label>
                      <input
                        value={contactSettings.cloudflareAnalyticsToken ?? ''}
                        onChange={(e) =>
                          setContactSettings((prev) => ({
                            ...prev,
                            cloudflareAnalyticsToken: e.target.value,
                          }))
                        }
                        placeholder="Paste 32-char Cloudflare Web Analytics token (fires only when Analytics consent is accepted)"
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 font-mono text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

            {/* LOWER SECTION: FULL-WIDTH LIVE STOREFRONT PREVIEW BELOW ACTIVE TAB */}
            {showLivePreviewPane && (
              <div
                id="live-storefront-preview"
                className="w-full space-y-3 border-t border-stone-900/15 pt-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#8C4A27]">
                      Real-Time Output Below Active Tab
                    </p>
                    <p className="font-serif text-xl font-semibold text-stone-900">
                      Live Storefront Preview
                    </p>
                  </div>
                  <span className="rounded-full border border-stone-900/15 bg-white px-3 py-1 font-mono text-[10px] text-stone-600 shadow-sm">
                    Synced with {activeTab.toUpperCase()}
                  </span>
                </div>

                <AdminLiveSitePreview
                  activeTab={activeTab}
                  previewScope={previewScope}
                  setPreviewScope={setPreviewScope}
                  previewViewport={previewViewport}
                  setPreviewViewport={setPreviewViewport}
                  products={products}
                  selectedProduct={selectedProduct}
                  selectedVariant={selectedVariant}
                  selectedBlog={selectedBlog}
                  sortedSections={sortedSections}
                  seoConfig={seoConfig}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
