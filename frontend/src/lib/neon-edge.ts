import { neon } from '@neondatabase/serverless';
import { PageSection, Product, SiteSeoConfig } from '@/types/cms';

function getEdgeSql() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    '';

  if (
    !url.startsWith('postgres') ||
    url.includes('user:pass@ep-cool-darkness')
  ) {
    return null;
  }

  return neon(url);
}

export async function queryNeonProductsEdge(
  includeUnpublished = false
): Promise<Product[] | null> {
  const sql = getEdgeSql();
  if (!sql) return null;

  try {
    const productRows = includeUnpublished
      ? await sql`SELECT * FROM "Product" ORDER BY "displayOrder" ASC, "createdAt" DESC`
      : await sql`SELECT * FROM "Product" WHERE "published" = true ORDER BY "displayOrder" ASC, "createdAt" DESC`;

    if (!Array.isArray(productRows) || productRows.length === 0) {
      return [];
    }

    const [variantRows, sizeRows, hotspotRows] = await Promise.all([
      sql`SELECT * FROM "ColorwayVariant"`,
      sql`SELECT * FROM "SizeInventory"`,
      sql`SELECT * FROM "ScrollHotspot" ORDER BY "scrollPercentage" ASC`,
    ]);

    const sizesByVariant = new Map<string, Product['variants'][number]['sizes']>();
    for (const s of sizeRows as Record<string, unknown>[]) {
      const vId = String(s.variantId);
      const list = sizesByVariant.get(vId) || [];
      list.push({
        id: String(s.id),
        sizeLabel: String(s.sizeLabel),
        sku: String(s.sku),
        stockCount: Number(s.stockCount ?? 0),
      });
      sizesByVariant.set(vId, list);
    }

    const variantsByProduct = new Map<string, Product['variants']>();
    for (const v of variantRows as Record<string, unknown>[]) {
      const pId = String(v.productId);
      const vId = String(v.id);
      const list = variantsByProduct.get(pId) || [];
      list.push({
        id: vId,
        colorName: String(v.colorName),
        skuPrefix: String(v.skuPrefix),
        primaryGlowHex: String(v.primaryGlowHex),
        secondaryAccentHex: String(v.secondaryAccentHex),
        glbModelUrl: String(v.glbModelUrl),
        posterImageUrl: String(v.posterImageUrl),
        galleryImages: Array.isArray(v.galleryImages)
          ? (v.galleryImages as string[])
          : [],
        altText: String(v.altText),
        sizes: sizesByVariant.get(vId) || [],
      });
      variantsByProduct.set(pId, list);
    }

    const hotspotsByProduct = new Map<string, Product['hotspots']>();
    for (const h of hotspotRows as Record<string, unknown>[]) {
      const pId = String(h.productId);
      const list = hotspotsByProduct.get(pId) || [];
      list.push({
        id: String(h.id),
        scrollPercentage: Number(h.scrollPercentage),
        title: String(h.title),
        subtitle: String(h.subtitle),
        cameraPosition: h.cameraPosition as Product['hotspots'][number]['cameraPosition'],
        cameraTarget: h.cameraTarget as Product['hotspots'][number]['cameraTarget'],
      });
      hotspotsByProduct.set(pId, list);
    }

    return (productRows as Record<string, unknown>[]).map((p) => {
      const id = String(p.id);
      return {
        id,
        slug: String(p.slug),
        name: String(p.name),
        tagline: String(p.tagline),
        description: String(p.description),
        richStoryHtml: String(p.richStoryHtml),
        basePrice: Number(p.basePrice),
        category: String(p.category),
        collectionSlug: String(p.collectionSlug || 'cyber-runner'),
        isFeaturedHero: Boolean(p.isFeaturedHero),
        displayOrder: Number(p.displayOrder ?? 0),
        published: Boolean(p.published),
        metaTitle: String(p.metaTitle),
        metaDescription: String(p.metaDescription),
        ogImageUrl: String(p.ogImageUrl),
        keywords: Array.isArray(p.keywords) ? (p.keywords as string[]) : [],
        specsJson: (p.specsJson as Record<string, string>) || {},
        ratingValue: Number(p.ratingValue ?? 4.9),
        reviewCount: Number(p.reviewCount ?? 42),
        updatedAt:
          p.updatedAt instanceof Date
            ? p.updatedAt.toISOString()
            : String(p.updatedAt || new Date().toISOString()),
        variants: variantsByProduct.get(id) || [],
        hotspots: hotspotsByProduct.get(id) || [],
      };
    });
  } catch (err) {
    console.error('[neon-edge] Failed to query products over HTTP:', err);
    return null;
  }
}

export async function queryNeonPageSectionsEdge(
  pageSlug = 'home'
): Promise<PageSection[] | null> {
  const sql = getEdgeSql();
  if (!sql) return null;

  try {
    const rows =
      await sql`SELECT * FROM "PageSection" WHERE "pageSlug" = ${pageSlug} ORDER BY "orderIndex" ASC`;
    return (rows as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      pageSlug: String(r.pageSlug),
      sectionType: r.sectionType as PageSection['sectionType'],
      contentJson: (r.contentJson as Record<string, unknown>) || {},
      orderIndex: Number(r.orderIndex ?? 0),
      isVisible: Boolean(r.isVisible),
      updatedAt:
        r.updatedAt instanceof Date
          ? r.updatedAt.toISOString()
          : String(r.updatedAt || new Date().toISOString()),
    }));
  } catch (err) {
    console.error('[neon-edge] Failed to query PageSection over HTTP:', err);
    return null;
  }
}

export async function queryNeonSeoConfigEdge(): Promise<SiteSeoConfig | null> {
  const sql = getEdgeSql();
  if (!sql) return null;

  try {
    const rows = await sql`SELECT * FROM "SiteSeoConfig" LIMIT 1`;
    const row = (rows as Record<string, unknown>[])[0];
    if (!row) return null;

    return {
      id: String(row.id),
      siteName: String(row.siteName),
      siteUrl: String(row.siteUrl),
      defaultMetaTitle: String(row.defaultMetaTitle),
      defaultMetaDescription: String(row.defaultMetaDescription),
      defaultOgImage: String(row.defaultOgImage),
      organizationSchemaJson:
        row.organizationSchemaJson as SiteSeoConfig['organizationSchemaJson'],
      updatedAt:
        row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : String(row.updatedAt || new Date().toISOString()),
    };
  } catch (err) {
    console.error('[neon-edge] Failed to query SiteSeoConfig over HTTP:', err);
    return null;
  }
}

