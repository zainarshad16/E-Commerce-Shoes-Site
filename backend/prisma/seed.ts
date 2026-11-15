import '../src/config/env';
import bcrypt from 'bcryptjs';
import { prisma, isDbConnected } from '../src/config/db';
import {
  INITIAL_ORDERS,
  INITIAL_PAGE_SECTIONS,
  INITIAL_PRODUCTS,
  INITIAL_SEO_CONFIG,
} from '../src/data/seedData';

async function main() {
  const connected = await isDbConnected();
  if (!connected || !prisma) {
    console.log(
      '[seed] Neon DATABASE_URL not configured or unreachable. Skipping remote seed — backend will serve embedded seedData cleanly in local mode.'
    );
    return;
  }

  console.log('[seed] Seeding Neon PostgreSQL database...');

  const adminPasswordHash = await bcrypt.hash('AetherAdmin2026!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@aetherfootwear.com' },
    update: {},
    create: {
      email: 'admin@aetherfootwear.com',
      name: 'Chief Creative Technologist',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  await prisma.siteSeoConfig.upsert({
    where: { id: INITIAL_SEO_CONFIG.id },
    update: {
      siteName: INITIAL_SEO_CONFIG.siteName,
      siteUrl: INITIAL_SEO_CONFIG.siteUrl,
      defaultMetaTitle: INITIAL_SEO_CONFIG.defaultMetaTitle,
      defaultMetaDescription: INITIAL_SEO_CONFIG.defaultMetaDescription,
      defaultOgImage: INITIAL_SEO_CONFIG.defaultOgImage,
      organizationSchemaJson: INITIAL_SEO_CONFIG.organizationSchemaJson,
    },
    create: {
      id: INITIAL_SEO_CONFIG.id,
      siteName: INITIAL_SEO_CONFIG.siteName,
      siteUrl: INITIAL_SEO_CONFIG.siteUrl,
      defaultMetaTitle: INITIAL_SEO_CONFIG.defaultMetaTitle,
      defaultMetaDescription: INITIAL_SEO_CONFIG.defaultMetaDescription,
      defaultOgImage: INITIAL_SEO_CONFIG.defaultOgImage,
      organizationSchemaJson: INITIAL_SEO_CONFIG.organizationSchemaJson,
    },
  });

  for (const prod of INITIAL_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: {
        slug: prod.slug,
        name: prod.name,
        tagline: prod.tagline,
        description: prod.description,
        richStoryHtml: prod.richStoryHtml,
        basePrice: prod.basePrice,
        category: prod.category,
        collectionSlug: prod.collectionSlug,
        isFeaturedHero: prod.isFeaturedHero,
        displayOrder: prod.displayOrder,
        published: prod.published,
        metaTitle: prod.metaTitle,
        metaDescription: prod.metaDescription,
        ogImageUrl: prod.ogImageUrl,
        keywords: prod.keywords,
        specsJson: prod.specsJson,
        ratingValue: prod.ratingValue,
        reviewCount: prod.reviewCount,
      },
      create: {
        id: prod.id,
        slug: prod.slug,
        name: prod.name,
        tagline: prod.tagline,
        description: prod.description,
        richStoryHtml: prod.richStoryHtml,
        basePrice: prod.basePrice,
        category: prod.category,
        collectionSlug: prod.collectionSlug,
        isFeaturedHero: prod.isFeaturedHero,
        displayOrder: prod.displayOrder,
        published: prod.published,
        metaTitle: prod.metaTitle,
        metaDescription: prod.metaDescription,
        ogImageUrl: prod.ogImageUrl,
        keywords: prod.keywords,
        specsJson: prod.specsJson,
        ratingValue: prod.ratingValue,
        reviewCount: prod.reviewCount,
        variants: {
          create: prod.variants.map((variant) => ({
            id: variant.id,
            colorName: variant.colorName,
            skuPrefix: variant.skuPrefix,
            primaryGlowHex: variant.primaryGlowHex,
            secondaryAccentHex: variant.secondaryAccentHex,
            glbModelUrl: variant.glbModelUrl,
            posterImageUrl: variant.posterImageUrl,
            galleryImages: variant.galleryImages,
            altText: variant.altText,
            sizes: {
              create: variant.sizes.map((s) => ({
                id: s.id,
                sizeLabel: s.sizeLabel,
                sku: s.sku,
                stockCount: s.stockCount,
              })),
            },
          })),
        },
        hotspots: {
          create: prod.hotspots.map((hs) => ({
            id: hs.id,
            scrollPercentage: hs.scrollPercentage,
            title: hs.title,
            subtitle: hs.subtitle,
            cameraPosition: hs.cameraPosition,
            cameraTarget: hs.cameraTarget,
          })),
        },
      },
    });

    for (const variant of prod.variants) {
      await prisma.colorwayVariant.updateMany({
        where: { id: variant.id },
        data: {
          colorName: variant.colorName,
          skuPrefix: variant.skuPrefix,
          primaryGlowHex: variant.primaryGlowHex,
          secondaryAccentHex: variant.secondaryAccentHex,
          glbModelUrl: variant.glbModelUrl,
          posterImageUrl: variant.posterImageUrl,
          galleryImages: variant.galleryImages,
          altText: variant.altText,
        },
      });
    }

    for (const hs of prod.hotspots) {
      await prisma.scrollHotspot.updateMany({
        where: { id: hs.id },
        data: {
          scrollPercentage: hs.scrollPercentage,
          title: hs.title,
          subtitle: hs.subtitle,
          cameraPosition: hs.cameraPosition,
          cameraTarget: hs.cameraTarget,
        },
      });
    }
  }

  for (const section of INITIAL_PAGE_SECTIONS) {
    await prisma.pageSection.upsert({
      where: { id: section.id },
      update: {
        contentJson: section.contentJson as object,
        orderIndex: section.orderIndex,
        isVisible: section.isVisible,
      },
      create: {
        id: section.id,
        pageSlug: section.pageSlug,
        sectionType: section.sectionType,
        contentJson: section.contentJson as object,
        orderIndex: section.orderIndex,
        isVisible: section.isVisible,
      },
    });
  }

  for (const order of INITIAL_ORDERS) {
    await prisma.order.upsert({
      where: { id: order.id },
      update: {
        orderNumber: order.orderNumber,
        status: order.status,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        shippingAddressJson: order.shippingAddressJson,
        subtotal: order.subtotal,
        totalAmount: order.totalAmount,
      },
      create: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        shippingAddressJson: order.shippingAddressJson,
        subtotal: order.subtotal,
        totalAmount: order.totalAmount,
        stripePaymentIntentId: order.stripePaymentIntentId,
        items: {
          create: order.items.map((item) => ({
            id: item.id,
            variantId: item.variantId,
            sizeSku: item.sizeSku,
            sizeLabel: item.sizeLabel,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
    });
  }

  console.log('[seed] Neon PostgreSQL seeding complete.');
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

