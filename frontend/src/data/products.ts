import rawProducts from './products.json';

export type LineupCategory =
  | 'Runner'
  | 'Court'
  | 'Trail'
  | 'Lifestyle'
  | 'Formal'
  | 'Heritage';

export interface SneakerColorway {
  id: string;
  name: string;
  isLimited: boolean;
  accentHex: string;
  secondaryHex: string;
  bgGradient: string;
  imageUrl: string;
  upper: string;
  midsole: string;
  outsole: string;
  laces: string;
  tongue: string;
  logo: string;
}

export interface SneakerSizeEntry {
  us: number;
  eu: string;
  uk: string;
  stock: number;
}

export interface ShowcaseProduct {
  id: string;
  slug: string;
  category: LineupCategory;
  name: string;
  tagline: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  weight: string;
  specs: Record<string, string>;
  images: string[];
  colorways: SneakerColorway[];
  sizes: SneakerSizeEntry[];
}

export const SHOWCASE_PRODUCTS: ShowcaseProduct[] =
  rawProducts as unknown as ShowcaseProduct[];

export function getShowcaseProductById(id: string): ShowcaseProduct {
  return SHOWCASE_PRODUCTS.find((p) => p.id === id) || SHOWCASE_PRODUCTS[0];
}

export function getColorwayForProduct(
  product: ShowcaseProduct,
  colorwayId: string
): SneakerColorway {
  return (
    product.colorways.find((c) => c.id === colorwayId) || product.colorways[0]
  );
}
