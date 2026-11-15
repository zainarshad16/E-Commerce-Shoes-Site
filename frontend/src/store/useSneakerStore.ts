import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BRAND_CONFIG, SupportedCurrency } from '@/config/brand.config';
import {
  SHOWCASE_PRODUCTS,
  ShowcaseProduct,
  SneakerColorway,
  getColorwayForProduct,
  getShowcaseProductById,
} from '@/data/products';

export type SizeSystem = 'US' | 'EU' | 'UK';
export type CursorMode = 'default' | 'pointer' | 'drag';

export interface ShowcaseCartItem {
  key: string;
  productId: string;
  productSlug: string;
  productName: string;
  colorwayId: string;
  colorwayName: string;
  accentHex: string;
  imageUrl: string;
  sizeUs: number;
  sizeEu: string;
  sizeUk: string;
  unitPriceUsd: number;
  quantity: number;
  maxStock: number;
}

interface SneakerStoreState {
  selectedProductId: string;
  hoveredProductId: string | null;
  selectedColorwayId: string;
  sizeSystem: SizeSystem;
  selectedSizeUs: number;
  quantity: number;
  currency: SupportedCurrency;
  activeSection: number;
  loadProgress: number;
  isLoaded: boolean;
  cursorMode: CursorMode;
  isSizeGuideOpen: boolean;
  cart: ShowcaseCartItem[];
  isCartOpen: boolean;

  selectProduct: (productId: string) => void;
  setHoveredProduct: (productId: string | null) => void;
  selectColorway: (colorwayId: string) => void;
  setSizeSystem: (system: SizeSystem) => void;
  setSelectedSizeUs: (sizeUs: number) => void;
  setQuantity: (qty: number) => void;
  setCurrency: (currency: SupportedCurrency) => void;
  setActiveSection: (sectionIndex: number) => void;
  setLoadProgress: (progress: number) => void;
  setIsLoaded: (loaded: boolean) => void;
  setCursorMode: (mode: CursorMode) => void;
  setSizeGuideOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<ShowcaseCartItem, 'key'>) => void;
  updateCartQty: (key: string, delta: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
}

const defaultProduct = SHOWCASE_PRODUCTS[0];
const defaultColorway = defaultProduct.colorways[0];

export const useSneakerStore = create<SneakerStoreState>()(
  persist(
    (set) => ({
      selectedProductId: defaultProduct.id,
      hoveredProductId: null,
      selectedColorwayId: defaultColorway.id,
      sizeSystem: 'US',
      selectedSizeUs: 9,
      quantity: 1,
      currency: BRAND_CONFIG.defaultCurrency,
      activeSection: 0,
      loadProgress: 0,
      isLoaded: false,
      cursorMode: 'default',
      isSizeGuideOpen: false,
      cart: [],
      isCartOpen: false,

      selectProduct: (productId) =>
        set((state) => {
          const prod = getShowcaseProductById(productId);
          const firstInStock =
            prod.sizes.find((s) => s.stock > 0)?.us ?? prod.sizes[0]?.us ?? 9;
          const keepCurrentSize = prod.sizes.some(
            (s) => s.us === state.selectedSizeUs && s.stock > 0
          );
          return {
            selectedProductId: prod.id,
            selectedColorwayId: prod.colorways[0].id,
            selectedSizeUs: keepCurrentSize ? state.selectedSizeUs : firstInStock,
            quantity: 1,
          };
        }),

      setHoveredProduct: (productId) => set({ hoveredProductId: productId }),

      selectColorway: (colorwayId) => set({ selectedColorwayId: colorwayId }),

      setSizeSystem: (sizeSystem) => set({ sizeSystem }),

      setSelectedSizeUs: (selectedSizeUs) =>
        set({ selectedSizeUs, quantity: 1 }),

      setQuantity: (qty) =>
        set({ quantity: Math.max(1, Math.min(10, qty)) }),

      setCurrency: (currency) => set({ currency }),

      setActiveSection: (activeSection) => set({ activeSection }),

      setLoadProgress: (loadProgress) =>
        set({ loadProgress: Math.min(100, Math.max(0, Math.round(loadProgress))) }),

      setIsLoaded: (isLoaded) => set({ isLoaded, loadProgress: isLoaded ? 100 : 0 }),

      setCursorMode: (cursorMode) => set({ cursorMode }),

      setSizeGuideOpen: (isSizeGuideOpen) => set({ isSizeGuideOpen }),

      setCartOpen: (isCartOpen) => set({ isCartOpen }),

      addToCart: (item) =>
        set((state) => {
          const key = `${item.productId}::${item.colorwayId}::${item.sizeUs}`;
          const existing = state.cart.find((c) => c.key === key);
          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c.key === key
                  ? {
                      ...c,
                      quantity: Math.min(c.maxStock, c.quantity + item.quantity),
                    }
                  : c
              ),
              isCartOpen: true,
            };
          }
          return {
            cart: [...state.cart, { ...item, key }],
            isCartOpen: true,
          };
        }),

      updateCartQty: (key, delta) =>
        set((state) => ({
          cart: state.cart
            .map((c) =>
              c.key === key
                ? {
                    ...c,
                    quantity: Math.min(c.maxStock, Math.max(0, c.quantity + delta)),
                  }
                : c
            )
            .filter((c) => c.quantity > 0),
        })),

      removeFromCart: (key) =>
        set((state) => ({
          cart: state.cart.filter((c) => c.key !== key),
        })),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'atelier-vance-store-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedProductId: state.selectedProductId,
        selectedColorwayId: state.selectedColorwayId,
        sizeSystem: state.sizeSystem,
        selectedSizeUs: state.selectedSizeUs,
        currency: state.currency,
        cart: state.cart,
      }),
    }
  )
);

export function getActiveVisualState(state: SneakerStoreState): {
  product: ShowcaseProduct;
  colorway: SneakerColorway;
} {
  if (state.hoveredProductId) {
    const hovered = getShowcaseProductById(state.hoveredProductId);
    return { product: hovered, colorway: hovered.colorways[0] };
  }
  const product = getShowcaseProductById(state.selectedProductId);
  const colorway = getColorwayForProduct(product, state.selectedColorwayId);
  return { product, colorway };
}
