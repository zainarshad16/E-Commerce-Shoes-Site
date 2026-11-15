export type SupportedCurrency = 'USD' | 'PKR';

export interface AnatomyPartConfig {
  meshName: 'upper' | 'midsole' | 'outsole' | 'laces' | 'tongue' | 'logo';
  title: string;
  material: string;
  benefit: string;
  explodeOffset: [number, number, number];
  explodeRotation: [number, number, number];
  uvRegion: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  cardPosition: {
    side: 'left' | 'right';
    topPct: number;
  };
  /** Natural anchor on the whole shoe cutout (percentage inside center stage) */
  anchorPct: {
    x: number;
    y: number;
  };
}

export interface ShowcaseCalloutConfig {
  id: string;
  badge: string;
  title: string;
  description: string;
  angleDeg: number;
  rangeDeg: [number, number];
  position: 'left' | 'right';
}

export const BRAND_CONFIG = {
  name: 'ATELIER VANCE',
  shortName: 'VANCE',
  tagline: 'Handcrafted & Everyday Footwear · Est. 2019',
  hero: {
    eyebrow: 'AUTUMN / WINTER COLLECTION · 7 SIGNATURE STYLES',
    headlineLines: ['CRAFTED', 'FOR DAILY', 'COMFORT'],
    fullHeadline: 'CRAFTED FOR DAILY COMFORT',
    subhead:
      'Honest leather, brushed suede, and lightweight knit runners built for long walks, busy workdays, and weekends out.',
    scrollCueLabel: 'Explore the Collection',
  },
  palette: {
    mode: 'LIGHT' as const,
    bg: '#F6F3EC',
    surface: '#EFECE4',
    accent: '#8C4A27',
    secondaryAccent: '#1E1E1C',
    text: '#18181B',
    muted: '#69645C',
  },
  currencies: {
    USD: {
      code: 'USD' as const,
      symbol: '$',
      rate: 1,
      locale: 'en-US',
    },
    PKR: {
      code: 'PKR' as const,
      symbol: 'PKR',
      rate: 278.5,
      locale: 'en-PK',
    },
  },
  defaultCurrency: 'USD' as SupportedCurrency,
  defaultHeroImage: '/images/shoes/espresso-hightop.png',
  navLinks: [
    { label: 'Shop Collection', href: '/shop', route: '/shop' },
    { label: 'Styles', href: '#colorways', route: '/collections/cyber-runner' },
    { label: 'Journal', href: '/blog', route: '/blog' },
    { label: 'Craft & Materials', href: '#anatomy', route: '/about' },
    { label: 'Fit & Care', href: '#final-cta', route: '/faq' },
  ],
  sectionMeta: [
    { id: 'hero', label: 'Start' },
    { id: 'showcase-360', label: 'In Hand' },
    { id: 'anatomy', label: 'Materials' },
    { id: 'colorways', label: 'Styles' },
    { id: 'lineup', label: 'Collection' },
    { id: 'buy-panel', label: 'Select Size' },
    { id: 'social-proof', label: 'Reviews' },
    { id: 'final-cta', label: 'Newsletter' },
  ],
  showcaseCallouts: [
    {
      id: 'supple-uppers',
      badge: '01 · Upper Selection',
      title: 'Supple Leathers & Knits',
      description:
        'Full-grain hides, brushed indigo suede, and breathable cotton canvas chosen to soften nicely with every wear.',
      angleDeg: 55,
      rangeDeg: [15, 120],
      position: 'left',
    },
    {
      id: 'cushioned-footbed',
      badge: '02 · Footbed Support',
      title: 'All-Day Cushioning',
      description:
        'Contoured cork-and-foam insoles support your arch from morning coffee runs through late evening dinners.',
      angleDeg: 175,
      rangeDeg: [125, 240],
      position: 'right',
    },
    {
      id: 'durable-soles',
      badge: '03 · Outsole Craft',
      title: 'Stitched & Grippy Soles',
      description:
        'Vulcanized natural rubber cupsoles and welted dress treads built to handle wet sidewalks without wearing thin.',
      angleDeg: 295,
      rangeDeg: [245, 355],
      position: 'left',
    },
  ] as ShowcaseCalloutConfig[],
  anatomyParts: [
    {
      meshName: 'tongue',
      title: 'Padded Collar & Tongue',
      material: 'Soft-Lined Cuff',
      benefit: 'Cradles the ankle bone and prevents rubbing on first wear.',
      explodeOffset: [0, 0, 0],
      explodeRotation: [0, 0, 0],
      uvRegion: { xMin: 0.28, xMax: 0.56, yMin: 0.62, yMax: 0.96 },
      cardPosition: { side: 'left', topPct: 22 },
      anchorPct: { x: 46, y: 37 },
    },
    {
      meshName: 'laces',
      title: 'Waxed Cotton Laces',
      material: 'Reinforced Eyelets',
      benefit: 'Stays tied cleanly throughout the day without cutting across the instep.',
      explodeOffset: [0, 0, 0],
      explodeRotation: [0, 0, 0],
      uvRegion: { xMin: 0.36, xMax: 0.74, yMin: 0.45, yMax: 0.78 },
      cardPosition: { side: 'right', topPct: 24 },
      anchorPct: { x: 54, y: 43 },
    },
    {
      meshName: 'upper',
      title: 'Hand-Selected Upper',
      material: 'Leather, Suede & Heavy Canvas',
      benefit: 'Cut in clean panels that hold their shape while flexing naturally as you walk.',
      explodeOffset: [0, 0, 0],
      explodeRotation: [0, 0, 0],
      uvRegion: { xMin: 0.06, xMax: 0.94, yMin: 0.26, yMax: 0.88 },
      cardPosition: { side: 'left', topPct: 50 },
      anchorPct: { x: 52, y: 52 },
    },
    {
      meshName: 'logo',
      title: 'Structured Heel Counter',
      material: 'Reinforced Backstay',
      benefit: 'Keeps your heel planted firmly in place without pinching your Achilles.',
      explodeOffset: [0, 0, 0],
      explodeRotation: [0, 0, 0],
      uvRegion: { xMin: 0.06, xMax: 0.42, yMin: 0.3, yMax: 0.72 },
      cardPosition: { side: 'right', topPct: 51 },
      anchorPct: { x: 41, y: 50 },
    },
    {
      meshName: 'midsole',
      title: 'Cushioned Comfort Footbed',
      material: 'Dual-Density Eva & Cork',
      benefit: 'Absorbs pavement shock and molds gently to your footprint over time.',
      explodeOffset: [0, 0, 0],
      explodeRotation: [0, 0, 0],
      uvRegion: { xMin: 0.06, xMax: 0.94, yMin: 0.14, yMax: 0.34 },
      cardPosition: { side: 'left', topPct: 76 },
      anchorPct: { x: 48, y: 60 },
    },
    {
      meshName: 'outsole',
      title: 'Natural Rubber Outsole',
      material: 'High-Traction Compound',
      benefit: 'Reliable grip on rainy city pavement, hardwood floors, and gravel paths.',
      explodeOffset: [0, 0, 0],
      explodeRotation: [0, 0, 0],
      uvRegion: { xMin: 0.06, xMax: 0.94, yMin: 0.02, yMax: 0.18 },
      cardPosition: { side: 'right', topPct: 78 },
      anchorPct: { x: 56, y: 66 },
    },
  ] as AnatomyPartConfig[],
  socialProof: {
    stats: [
      { id: 'reviews', label: 'Verified Customer Reviews', target: 4280, suffix: '+' },
      { id: 'countries', label: 'Cities Shipped To', target: 38, suffix: '' },
      { id: 'sold', label: 'Pairs Crafted & Worn', target: 29400, suffix: '+' },
    ],
    quotes: [
      {
        quote:
          'Wore the Highland Chestnut Walker straight out of the box for a four-day trip in Edinburgh — zero blisters and the leather looks better every week.',
        author: 'Hannah Lindstrom',
        meta: 'Chicago, IL · Verified Buyer · Highland Walker',
      },
      {
        quote:
          'Finally a dress oxford that feels like a broken-in sneaker underneath. The Camden Cap-Toe got me through three wedding weekends back to back.',
        author: 'Tariq Mahmood',
        meta: 'Lahore · Verified Buyer · Camden Cap-Toe Oxford',
      },
      {
        quote:
          'I alternate between the Velocity Knit Runner for morning walks and the Crosby Navy Suede at the studio. Super honest quality for the price.',
        author: 'Daniel Okafor',
        meta: 'Toronto · Verified Buyer · Crosby Suede Mid',
      },
    ],
  },
  trustBadges: [
    {
      title: 'Free Express Shipping',
      detail: 'Complimentary on orders over $150',
    },
    {
      title: '30-Day Easy Returns',
      detail: 'Free size exchanges & hassle-free returns',
    },
    {
      title: 'Small-Batch Workshop',
      detail: 'Individually inspected before boxing',
    },
  ],
  deliveryLine: 'Free shipping over $150 · 30-day wear trial & easy size exchanges',
  finalCta: {
    headline: 'FIND YOUR EVERYDAY PAIR',
    subhead:
      'Small batches restocked monthly so we never overproduce. Sign up for restock notes and seasonal leather releases.',
    ctaLabel: 'Choose Your Size',
  },
} as const;

export function formatBrandPrice(
  priceUsd: number,
  currency: SupportedCurrency
): string {
  const cfg = BRAND_CONFIG.currencies[currency];
  const converted = Math.round(priceUsd * cfg.rate);
  if (currency === 'PKR') {
    return `Rs. ${converted.toLocaleString('en-PK')}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(converted);
}
