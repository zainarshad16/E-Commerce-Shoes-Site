export interface Vector3Coords {
  x: number;
  y: number;
  z: number;
}

export interface SizeInventory {
  id: string;
  sizeLabel: string;
  sku: string;
  stockCount: number;
}

export interface ColorwayVariant {
  id: string;
  colorName: string;
  skuPrefix: string;
  primaryGlowHex: string;
  secondaryAccentHex: string;
  glbModelUrl: string;
  posterImageUrl: string;
  galleryImages: string[];
  altText: string;
  sizes: SizeInventory[];
}

export interface ScrollHotspot {
  id: string;
  scrollPercentage: number;
  title: string;
  subtitle: string;
  cameraPosition: Vector3Coords;
  cameraTarget: Vector3Coords;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  richStoryHtml: string;
  basePrice: number;
  category: string;
  collectionSlug: string;
  isFeaturedHero: boolean;
  displayOrder: number;
  published: boolean;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  keywords: string[];
  specsJson?: Record<string, string>;
  ratingValue: number;
  reviewCount: number;
  updatedAt: string;
  variants: ColorwayVariant[];
  hotspots: ScrollHotspot[];
}

export interface CollectionMeta {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  heroImage: string;
}

export type PageSectionType =
  | 'HERO_CONFIG'
  | 'STATEMENT_BANNER'
  | 'FAQ_LIST'
  | 'NEWSLETTER';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface PageSection {
  id: string;
  pageSlug: string;
  sectionType: PageSectionType;
  contentJson: Record<string, unknown>;
  orderIndex: number;
  isVisible: boolean;
  updatedAt: string;
}

export interface SiteSeoConfig {
  id: string;
  siteName: string;
  siteUrl: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  defaultOgImage: string;
  organizationSchemaJson: {
    name: string;
    url: string;
    logo: string;
    sameAs: string[];
    contactEmail: string;
  };
  updatedAt: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED';

export interface OrderItem {
  id: string;
  variantId: string;
  productName?: string;
  colorName?: string;
  sizeSku: string;
  sizeLabel: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerEmail: string;
  customerName: string;
  shippingAddressJson: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  subtotal: number;
  totalAmount: number;
  stripePaymentIntentId?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface BlogSection {
  heading: string;
  body: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  readTime: string;
  coverImage: string;
  relatedProductSlug: string;
  tags: string[];
  sections: BlogSection[];
  published: boolean;
  featured: boolean;
}

export interface CartItem {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  colorName: string;
  primaryGlowHex: string;
  posterImageUrl: string;
  sizeSku: string;
  sizeLabel: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'CUSTOMER';
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  authProvider: 'email' | 'google';
  createdAt: string;
  lastLoginAt: string;
  orderCount: number;
  totalSpent: number;
  orders: Order[];
}

export interface SiteContactSettings {
  whatsappNumber: string;
  supportPhone: string;
  adminEmail: string;
  storeAddress: string;
  whatsappGreeting: string;
  chatbotName: string;
  chatbotEnabled: boolean;
  cookieBannerEnabled?: boolean;
  cookieBannerTitle?: string;
  cookieBannerDescription?: string;
  cloudflareAnalyticsToken?: string;
  cloudflareZoneDomain?: string;
  googleClientId?: string;
  updatedAt?: string;
}

