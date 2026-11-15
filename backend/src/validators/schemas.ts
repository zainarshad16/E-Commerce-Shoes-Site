import { z } from 'zod';

export const Vector3Schema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
});

export const PresignedUploadSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.enum([
    'model/gltf-binary',
    'image/webp',
    'image/png',
    'image/jpeg',
  ]),
  fileSizeBytes: z.number().int().positive(),
  productSlug: z.string().optional(),
});

export const SizeInventoryInputSchema = z.object({
  id: z.string().optional(),
  sizeLabel: z.string().min(1).max(24),
  sku: z.string().min(2).max(64),
  stockCount: z.number().int().min(0),
});

export const ColorwayVariantInputSchema = z.object({
  id: z.string().optional(),
  colorName: z.string().min(1).max(120),
  skuPrefix: z.string().min(2).max(32),
  primaryGlowHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryAccentHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  glbModelUrl: z.string().min(1),
  posterImageUrl: z.string().default('/models/shoe.glb'),
  galleryImages: z.array(z.string()).default([]),
  altText: z.string().min(1).max(300),
  sizes: z.array(SizeInventoryInputSchema).default([]),
});

export const ScrollHotspotInputSchema = z.object({
  id: z.string().optional(),
  scrollPercentage: z.number().min(0).max(100),
  title: z.string().min(1).max(120),
  subtitle: z.string().min(1).max(400),
  cameraPosition: Vector3Schema,
  cameraTarget: Vector3Schema,
});

export const ProductUpsertSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(160),
  tagline: z.string().min(1).max(300),
  description: z.string().min(1).max(4000),
  richStoryHtml: z.string().min(1),
  basePrice: z.number().positive(),
  category: z.string().min(1).max(80),
  collectionSlug: z.string().min(1).max(80).default('cyber-runner'),
  isFeaturedHero: z.boolean().default(false),
  displayOrder: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
  metaTitle: z.string().min(1).max(160),
  metaDescription: z.string().min(1).max(400),
  ogImageUrl: z.string().min(1),
  keywords: z.array(z.string()).default([]),
  specsJson: z.record(z.string()).optional(),
  ratingValue: z.number().min(1).max(5).default(4.9),
  reviewCount: z.number().int().min(0).default(1),
  variants: z.array(ColorwayVariantInputSchema).min(1),
  hotspots: z.array(ScrollHotspotInputSchema).default([]),
});

export const HotspotBatchSchema = z.object({
  hotspots: z.array(ScrollHotspotInputSchema),
});

export const InventoryUpdateSchema = z.object({
  stockCount: z.number().int().min(0),
});

export const PageSectionUpdateSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().min(1),
      pageSlug: z.string().min(1),
      sectionType: z.enum([
        'HERO_CONFIG',
        'STATEMENT_BANNER',
        'FAQ_LIST',
        'NEWSLETTER',
      ]),
      contentJson: z.record(z.unknown()),
      orderIndex: z.number().int().min(0),
      isVisible: z.boolean(),
    })
  ),
});

export const SeoConfigSchema = z.object({
  siteName: z.string().min(1).max(120),
  siteUrl: z.string().url(),
  defaultMetaTitle: z.string().min(1).max(160),
  defaultMetaDescription: z.string().min(1).max(400),
  defaultOgImage: z.string().min(1),
  organizationSchemaJson: z.object({
    name: z.string().min(1),
    url: z.string().url(),
    logo: z.string().min(1),
    sameAs: z.array(z.string()),
    contactEmail: z.string().email(),
  }),
});

export const CreateOrderSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(2).max(120),
  shippingAddressJson: z.object({
    line1: z.string().min(2),
    city: z.string().min(2),
    state: z.string().min(1),
    postalCode: z.string().min(2),
    country: z.string().min(2),
  }),
  stripePaymentIntentId: z.string().optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        sizeSku: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
      })
    )
    .min(1),
});

export const OrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED']),
});

