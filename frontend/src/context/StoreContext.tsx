'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  BlogPost,
  CartItem,
  Order,
  PageSection,
  Product,
  SiteContactSettings,
  SiteSeoConfig,
} from '@/types/cms';
import {
  SEED_BLOG_POSTS,
  SEED_ORDERS,
  SEED_PAGE_SECTIONS,
  SEED_PRODUCTS,
  SEED_SEO_CONFIG,
} from '@/lib/cms-seed';
import { API_BASE_URL } from '@/lib/config';

interface StoreContextValue {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  blogs: BlogPost[];
  setBlogs: React.Dispatch<React.SetStateAction<BlogPost[]>>;
  pageSections: PageSection[];
  setPageSections: React.Dispatch<React.SetStateAction<PageSection[]>>;
  seoConfig: SiteSeoConfig;
  setSeoConfig: React.Dispatch<React.SetStateAction<SiteSeoConfig>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  activeProductId: string;
  setActiveProductId: (id: string) => void;
  activeVariantId: string;
  setActiveVariantId: (id: string) => void;
  activeGlow: { primary: string; secondary: string };
  setActiveGlowColors: (primary: string, secondary: string) => void;
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  updateCartQuantity: (sizeSku: string, delta: number) => void;
  removeFromCart: (sizeSku: string) => void;
  clearCart: () => void;
  checkoutOrder: (customer: {
    customerName: string;
    customerEmail: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    paymentMethod?: string;
    stripePaymentIntentId?: string;
    itemsOverride?: CartItem[];
  }) => Promise<{ ok: boolean; orderNumber?: string; error?: string }>;
  compareSlugs: string[];
  toggleCompareSlug: (slug: string) => void;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;
  authUser: AuthUser | null;
  authToken: string | null;
  authLoaded: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; user?: AuthUser; error?: string }>;
  loginWithGoogle: (profile: {
    email: string;
    name: string;
    googleId?: string;
  }) => Promise<{ ok: boolean; user?: AuthUser; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    extra?: {
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    }
  ) => Promise<{ ok: boolean; user?: AuthUser; error?: string }>;
  updateAuthSession: (token: string, user: AuthUser) => void;
  logout: () => void;
  contactSettings: SiteContactSettings;
  setContactSettings: React.Dispatch<React.SetStateAction<SiteContactSettings>>;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'CUSTOMER';
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

const AUTH_STORAGE_KEY = 'aether_auth_session_v1';
const CONTACT_SETTINGS_STORAGE_KEY = 'atelier_contact_settings_v1';

const DEFAULT_CONTACT_SETTINGS: SiteContactSettings = {
  whatsappNumber: '+923001234567',
  supportPhone: '+92 300 1234567',
  adminEmail: 'hello@ateliervance.com',
  storeAddress: '240 Mercer St, New York & Gulberg III, Lahore',
  whatsappGreeting:
    'Assalam-o-Alaikum! Welcome to Atelier Vance. How can we help you choose your footwear today?',
  chatbotName: 'Atelier Vance Concierge',
  chatbotEnabled: true,
  cookieBannerEnabled: true,
  cookieBannerTitle: 'Atelier Privacy & Cookie Consent',
  cookieBannerDescription:
    'We use essential cookies for bag & checkout security, Cloudflare edge protection, and optional analytics to refine your showroom experience.',
  cloudflareAnalyticsToken: '',
  cloudflareZoneDomain: 'ateliervance.com',
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  children,
  initialProducts,
  initialSections,
  initialSeoConfig,
  initialBlogs,
}: {
  children: React.ReactNode;
  initialProducts?: Product[];
  initialSections?: PageSection[];
  initialSeoConfig?: SiteSeoConfig;
  initialBlogs?: BlogPost[];
}) {
  const [products, setProducts] = useState<Product[]>(
    initialProducts && initialProducts.length > 0 ? initialProducts : SEED_PRODUCTS
  );
  const [blogs, setBlogs] = useState<BlogPost[]>(
    initialBlogs && initialBlogs.length > 0 ? initialBlogs : SEED_BLOG_POSTS
  );
  const [pageSections, setPageSections] = useState<PageSection[]>(
    initialSections && initialSections.length > 0
      ? initialSections
      : SEED_PAGE_SECTIONS
  );
  const [seoConfig, setSeoConfig] = useState<SiteSeoConfig>(
    initialSeoConfig || SEED_SEO_CONFIG
  );
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [contactSettings, setContactSettings] = useState<SiteContactSettings>(
    DEFAULT_CONTACT_SETTINGS
  );
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { token?: string; user?: AuthUser };
        if (parsed.token && parsed.user?.email) {
          setAuthToken(parsed.token);
          setAuthUser(parsed.user);
        }
      }
      const rawContact = localStorage.getItem(CONTACT_SETTINGS_STORAGE_KEY);
      if (rawContact) {
        const parsedContact = JSON.parse(rawContact) as Partial<SiteContactSettings>;
        if (parsedContact.adminEmail || parsedContact.whatsappNumber) {
          setContactSettings((prev) => ({ ...prev, ...parsedContact }));
        }
      }
    } catch {
      // Ignore storage read errors
    } finally {
      setAuthLoaded(true);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        CONTACT_SETTINGS_STORAGE_KEY,
        JSON.stringify(contactSettings)
      );
    } catch {
      // Ignore storage write errors
    }
  }, [contactSettings]);

  const persistSession = useCallback((token: string, user: AuthUser) => {
    setAuthToken(token);
    setAuthUser(user);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setAuthUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore storage remove errors
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          token?: string;
          user?: AuthUser;
          error?: string;
        };
        if (!res.ok || !data.token || !data.user) {
          return {
            ok: false,
            error: data.error || 'Invalid email or password.',
          };
        }
        persistSession(data.token, data.user);
        return { ok: true, user: data.user };
      } catch {
        return { ok: false, error: 'Unable to reach authentication server.' };
      }
    },
    [persistSession]
  );

  const loginWithGoogle = useCallback(
    async (profile: { email: string; name: string; googleId?: string }) => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: profile.email.trim().toLowerCase(),
            name: profile.name.trim(),
            googleId: profile.googleId,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          token?: string;
          user?: AuthUser;
          error?: string;
        };
        if (!res.ok || !data.token || !data.user) {
          return {
            ok: false,
            error: data.error || 'Google sign-in failed.',
          };
        }
        persistSession(data.token, data.user);
        return { ok: true, user: data.user };
      } catch {
        return { ok: false, error: 'Unable to reach authentication server.' };
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      extra?: {
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
      }
    ) => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            ...(extra || {}),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          token?: string;
          user?: AuthUser;
          error?: string;
        };
        if (!res.ok || !data.token || !data.user) {
          return {
            ok: false,
            error: data.error || 'Account registration failed.',
          };
        }
        const enrichedUser: AuthUser = {
          ...data.user,
          phone: extra?.phone?.trim() || data.user.phone,
          address: extra?.address?.trim() || data.user.address,
          city: extra?.city?.trim() || data.user.city,
          state: extra?.state?.trim() || data.user.state,
          zipCode: extra?.zipCode?.trim() || data.user.zipCode,
        };
        persistSession(data.token, enrichedUser);
        return { ok: true, user: enrichedUser };
      } catch {
        return { ok: false, error: 'Unable to reach registration server.' };
      }
    },
    [persistSession]
  );

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  // Keep client-side storefront catalog synced with live Neon/Express API
  useEffect(() => {
    let cancelled = false;
    const isAdminRoute =
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/admin');
    const queryPath = isAdminRoute
      ? '/products?includeUnpublished=true'
      : '/products';

    fetch(`${API_BASE_URL}${queryPath}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { products?: Product[] } | null) => {
        if (!cancelled && data?.products && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch(() => {
        // Keep server-rendered initialProducts if API is temporarily unreachable
      });

    const blogQueryPath = isAdminRoute
      ? '/blogs?includeUnpublished=true'
      : '/blogs';
    fetch(`${API_BASE_URL}${blogQueryPath}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { blogs?: BlogPost[] } | null) => {
        if (!cancelled && data?.blogs && data.blogs.length > 0) {
          setBlogs(data.blogs);
        }
      })
      .catch(() => {
        // Keep server-rendered initialBlogs
      });

    fetch(`${API_BASE_URL}/settings/contact`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { settings?: SiteContactSettings } | null) => {
        if (!cancelled && data?.settings) {
          setContactSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch(() => {
        // Keep cached / default contact settings
      });

    fetch(`${API_BASE_URL}/cms/home`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { sections?: PageSection[] } | null) => {
        if (!cancelled && data?.sections && data.sections.length > 0) {
          setPageSections(data.sections);
        }
      })
      .catch(() => {
        // Keep server-rendered initialSections
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const firstProduct = products[0] || SEED_PRODUCTS[0];
  const [activeProductId, setActiveProductId] = useState<string>(firstProduct.id);
  const [activeVariantId, setActiveVariantId] = useState<string>(
    firstProduct.variants[0]?.id || ''
  );

  const [activeGlow, setActiveGlow] = useState<{
    primary: string;
    secondary: string;
  }>({
    primary: firstProduct.variants[0]?.primaryGlowHex || '#CCFF00',
    secondary: firstProduct.variants[0]?.secondaryAccentHex || '#10B981',
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const setActiveGlowColors = useCallback((primary: string, secondary: string) => {
    setActiveGlow({ primary, secondary });
  }, []);

  // Synchronize CSS variables for dynamic studio lighting across UI
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--glow-primary', activeGlow.primary);
      document.documentElement.style.setProperty(
        '--glow-secondary',
        activeGlow.secondary
      );
    }
  }, [activeGlow]);

  // Synchronize glow colors when active variant changes
  useEffect(() => {
    const product = products.find((p) => p.id === activeProductId);
    if (!product) return;
    const variant =
      product.variants.find((v) => v.id === activeVariantId) || product.variants[0];
    if (variant) {
      setActiveGlow({
        primary: variant.primaryGlowHex,
        secondary: variant.secondaryAccentHex,
      });
    }
  }, [activeProductId, activeVariantId, products]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.sizeSku === item.sizeSku);
      if (existing) {
        const nextQty = Math.min(existing.quantity + 1, item.maxStock);
        return prev.map((c) =>
          c.sizeSku === item.sizeSku ? { ...c, quantity: nextQty } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  }, []);

  const updateCartQuantity = useCallback((sizeSku: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.sizeSku !== sizeSku) return item;
          const nextQty = Math.min(item.quantity + delta, item.maxStock);
          return nextQty <= 0 ? null : { ...item, quantity: nextQty };
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const removeFromCart = useCallback((sizeSku: string) => {
    setCart((prev) => prev.filter((c) => c.sizeSku !== sizeSku));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const checkoutOrder = useCallback(
    async (customer: {
      customerName: string;
      customerEmail: string;
      line1: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      paymentMethod?: string;
      stripePaymentIntentId?: string;
      itemsOverride?: CartItem[];
    }) => {
      if (!authToken || !authUser) {
        return {
          ok: false,
          error: 'Please log in or sign up before placing an order.',
        };
      }

      const activeItems =
        customer.itemsOverride && customer.itemsOverride.length > 0
          ? customer.itemsOverride
          : cart;

      if (activeItems.length === 0) {
        return { ok: false, error: 'Your cart is empty.' };
      }

      // Live inventory validation against current catalog state
      for (const item of activeItems) {
        const prod = products.find((p) => p.id === item.productId);
        const variant = prod?.variants.find((v) => v.id === item.variantId);
        const sizeRow = variant?.sizes.find((s) => s.sku === item.sizeSku);
        if (!sizeRow || sizeRow.stockCount < item.quantity) {
          return {
            ok: false,
            error: `Insufficient stock for ${item.productName} (${item.sizeLabel}). Remaining: ${sizeRow?.stockCount ?? 0}`,
          };
        }
      }

      const paymentRef =
        customer.stripePaymentIntentId ||
        `${customer.paymentMethod || 'stripe'}_${Date.now()}`;

      // Real backend authenticated order creation (no guest orders permitted)
      let createdOrderNumber = `AV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      try {
        const res = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            customerName: customer.customerName,
            customerEmail: customer.customerEmail,
            shippingAddressJson: {
              line1: customer.line1,
              city: customer.city,
              state: customer.state,
              postalCode: customer.postalCode,
              country: customer.country,
            },
            stripePaymentIntentId: paymentRef,
            items: activeItems.map((c) => ({
              variantId: c.variantId,
              sizeSku: c.sizeSku,
              quantity: c.quantity,
            })),
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { order?: Order };
          if (data.order?.orderNumber) {
            createdOrderNumber = data.order.orderNumber;
          }
        } else {
          const errBody = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          if (res.status === 401 || res.status === 403) {
            logout();
            return {
              ok: false,
              error: errBody.error || 'Session expired. Please log in again to order.',
            };
          }
          if (errBody.error) {
            return { ok: false, error: errBody.error };
          }
          return { ok: false, error: 'Order validation failed on server.' };
        }
      } catch {
        return {
          ok: false,
          error: 'Unable to connect to order API. Please retry shortly.',
        };
      }

      const subtotal = activeItems.reduce(
        (acc, i) => acc + i.unitPrice * i.quantity,
        0
      );
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: createdOrderNumber,
        status: 'PAID',
        customerEmail: customer.customerEmail,
        customerName: customer.customerName,
        shippingAddressJson: {
          line1: customer.line1,
          city: customer.city,
          state: customer.state,
          postalCode: customer.postalCode,
          country: customer.country,
        },
        subtotal,
        totalAmount: subtotal,
        stripePaymentIntentId: paymentRef,
        createdAt: new Date().toISOString(),
        items: activeItems.map((c, idx) => ({
          id: `oi-${Date.now()}-${idx}`,
          variantId: c.variantId,
          productName: c.productName,
          colorName: c.colorName,
          sizeSku: c.sizeSku,
          sizeLabel: c.sizeLabel,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
        })),
      };

      // Deduct inventory cleanly across products state
      setProducts((prev) =>
        prev.map((prod) => ({
          ...prod,
          variants: prod.variants.map((variant) => ({
            ...variant,
            sizes: variant.sizes.map((sz) => {
              const ordered = activeItems.find((c) => c.sizeSku === sz.sku);
              if (!ordered) return sz;
              return {
                ...sz,
                stockCount: Math.max(0, sz.stockCount - ordered.quantity),
              };
            }),
          })),
        }))
      );

      setOrders((prev) => [newOrder, ...prev]);
      setCart([]);
      return { ok: true, orderNumber: createdOrderNumber };
    },
    [authToken, authUser, cart, logout, products]
  );

  const toggleCompareSlug = useCallback((slug: string) => {
    setCompareSlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), slug];
      }
      return [...prev, slug];
    });
  }, []);

  const value = useMemo(
    () => ({
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
      activeProductId,
      setActiveProductId,
      activeVariantId,
      setActiveVariantId,
      activeGlow,
      setActiveGlowColors,
      cart,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      checkoutOrder,
      compareSlugs,
      toggleCompareSlug,
      isCompareOpen,
      setIsCompareOpen,
      authUser,
      authToken,
      authLoaded,
      login,
      loginWithGoogle,
      register,
      updateAuthSession: persistSession,
      logout,
      contactSettings,
      setContactSettings,
    }),
    [
      products,
      blogs,
      pageSections,
      seoConfig,
      orders,
      contactSettings,
      activeProductId,
      activeVariantId,
      activeGlow,
      setActiveGlowColors,
      cart,
      isCartOpen,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      checkoutOrder,
      compareSlugs,
      toggleCompareSlug,
      isCompareOpen,
      authUser,
      authToken,
      authLoaded,
      login,
      loginWithGoogle,
      register,
      persistSession,
      logout,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return ctx;
}

