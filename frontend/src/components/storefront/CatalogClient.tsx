'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  GitCompare,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { SEED_COLLECTIONS } from '@/lib/cms-seed';
import {
  SneakerStudioThumb,
  resolveOriginalShoeImage,
  resolveSilhouetteFromText,
} from './SneakerStudioThumb';

interface CatalogClientProps {
  initialCollectionSlug?: string;
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export function CatalogClient({ initialCollectionSlug }: CatalogClientProps) {
  const router = useRouter();
  const {
    products,
    addToCart,
    setIsCartOpen,
    compareSlugs,
    toggleCompareSlug,
    setIsCompareOpen,
    setActiveGlowColors,
    authUser,
  } = useStore();

  const [selectedCollection, setSelectedCollection] = useState<string>(
    initialCollectionSlug || 'all'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(products.filter((p) => p.published).map((p) => p.category))
    );
    return ['all', ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = products
      .filter((p) => p.published)
      .filter((p) =>
        selectedCollection === 'all'
          ? true
          : p.collectionSlug === selectedCollection
      )
      .filter((p) =>
        selectedCategory === 'all' ? true : p.category === selectedCategory
      )
      .filter((p) => {
        if (!query) return true;
        return (
          p.name.toLowerCase().includes(query) ||
          p.tagline.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.keywords.some((k) => k.toLowerCase().includes(query))
        );
      });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.basePrice - b.basePrice);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.basePrice - a.basePrice);
    }
    if (sortBy === 'rating') {
      return [...list].sort((a, b) => b.ratingValue - a.ratingValue);
    }
    return [...list].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [products, selectedCollection, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-8">
      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-4 rounded-3xl border border-stone-900/10 bg-white/95 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Collection Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCollection('all')}
            className={`rounded-full px-4 py-2 text-xs font-medium transition ${
              selectedCollection === 'all'
                ? 'bg-[#18181B] text-[#F6F3EC]'
                : 'border border-stone-900/10 bg-[#F6F3EC] text-stone-700 hover:border-stone-900/30 hover:text-stone-900'
            }`}
          >
            All Styles ({products.filter((p) => p.published).length})
          </button>

          {SEED_COLLECTIONS.map((col) => (
            <button
              key={col.slug}
              type="button"
              onClick={() => setSelectedCollection(col.slug)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                selectedCollection === col.slug
                  ? 'bg-[#18181B] text-[#F6F3EC]'
                  : 'border border-stone-900/10 bg-[#F6F3EC] text-stone-700 hover:border-stone-900/30 hover:text-stone-900'
              }`}
            >
              {col.name}
            </button>
          ))}
        </div>

        {/* Search + Category + Sort + Compare Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leather, suede, runner..."
              aria-label="Search footwear"
              className="h-10 w-full rounded-full border border-stone-900/10 bg-[#F6F3EC] pl-9 pr-4 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#8C4A27] focus:outline-none"
            />
          </div>

          <label className="sr-only" htmlFor="category-filter">
            Filter by footwear category
          </label>
          <div className="inline-flex h-10 items-center gap-1.5 rounded-full border border-stone-900/10 bg-[#F6F3EC] px-3 text-xs text-stone-700">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#8C4A27]" />
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent pr-1 text-xs font-medium text-stone-800 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <label className="sr-only" htmlFor="sort-order">
            Sort footwear
          </label>
          <select
            id="sort-order"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-10 rounded-full border border-stone-900/10 bg-[#F6F3EC] px-3.5 text-xs font-medium text-stone-800 focus:border-[#8C4A27] focus:outline-none"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          {compareSlugs.length > 0 && (
            <button
              type="button"
              onClick={() => setIsCompareOpen(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#8C4A27]/30 bg-[#8C4A27]/10 px-4 text-xs font-semibold text-[#8C4A27] transition hover:bg-[#8C4A27] hover:text-white"
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span>Compare ({compareSlugs.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-stone-900/10 bg-white px-6 py-16 text-center shadow-sm">
          <p className="font-condensed text-3xl uppercase text-stone-900">
            No matching pairs found
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Try clearing your search or switching back to all footwear styles.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCollection('all');
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-5 rounded-full bg-[#18181B] px-6 py-2.5 text-xs font-semibold text-[#F6F3EC] transition hover:bg-[#8C4A27]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const primaryVar = product.variants[0];
            const firstInStockSize =
              primaryVar?.sizes.find((s) => s.stockCount > 0) ||
              primaryVar?.sizes[0];
            const totalStock =
              primaryVar?.sizes.reduce((acc, s) => acc + s.stockCount, 0) ?? 0;
            const isComparing = compareSlugs.includes(product.slug);

            const silhouette = resolveSilhouetteFromText(
              `${product.name} ${product.slug} ${product.category}`
            );
            const shoeImage =
              primaryVar?.posterImageUrl ||
              product.ogImageUrl ||
              resolveOriginalShoeImage(
                product.name,
                primaryVar?.skuPrefix,
                product.category
              );

            return (
              <article
                key={product.id}
                onMouseEnter={() => {
                  if (primaryVar) {
                    setActiveGlowColors(
                      primaryVar.primaryGlowHex,
                      primaryVar.secondaryAccentHex
                    );
                  }
                }}
                className="atelier-card group flex flex-col justify-between rounded-3xl p-5"
              >
                <div>
                  {/* Top Meta Bar */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8C4A27]">
                      {product.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCompareSlug(product.slug)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                        isComparing
                          ? 'bg-[#18181B] text-[#F6F3EC]'
                          : 'border border-stone-900/10 bg-[#F6F3EC] text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <GitCompare className="h-3 w-3" />
                      <span>{isComparing ? 'Selected' : 'Compare'}</span>
                    </button>
                  </div>

                  {/* Studio Image */}
                  <Link href={`/product/${product.slug}`} className="block">
                    <SneakerStudioThumb
                      name={product.name}
                      category={product.category}
                      sku={primaryVar?.skuPrefix}
                      imageUrl={shoeImage}
                      primaryGlowHex={primaryVar?.primaryGlowHex}
                      secondaryAccentHex={primaryVar?.secondaryAccentHex}
                      silhouette={silhouette}
                      className="h-56 w-full transition duration-500 group-hover:scale-[1.03]"
                    />
                  </Link>

                  {/* Title & Price */}
                  <div className="mt-5 flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/product/${product.slug}`}
                        className="font-serif text-2xl font-semibold tracking-tight text-stone-900 transition group-hover:text-[#8C4A27]"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">
                        {product.tagline}
                      </p>
                    </div>
                    <span className="shrink-0 font-serif text-2xl font-semibold tabular-nums text-stone-900">
                      ${product.basePrice}
                    </span>
                  </div>

                  {/* Colorway Swatches & Rating */}
                  <div className="mt-4 flex items-center justify-between border-t border-stone-900/10 pt-3">
                    <div className="flex items-center gap-1.5">
                      {product.variants.map((v) => (
                        <span
                          key={v.id}
                          title={v.colorName}
                          className="h-4 w-4 rounded-full border border-stone-900/20"
                          style={{ backgroundColor: v.primaryGlowHex }}
                        />
                      ))}
                      <span className="ml-1 text-[11px] text-stone-500">
                        {product.variants.length}{' '}
                        {product.variants.length === 1 ? 'finish' : 'finishes'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-stone-700">
                      <Star className="h-3.5 w-3.5 fill-[#8C4A27] text-[#8C4A27]" />
                      <span className="font-semibold tabular-nums">
                        {product.ratingValue.toFixed(1)}
                      </span>
                      <span className="text-stone-400">
                        ({product.reviewCount})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 flex items-center gap-2">
                  <Link
                    href={`/product/${product.slug}`}
                    className="inline-flex h-10 items-center justify-center gap-1 rounded-full border border-stone-900/15 bg-[#F6F3EC] px-4 text-xs font-semibold text-stone-900 transition hover:border-[#8C4A27]/60 hover:bg-[#EFECE4] hover:text-[#8C4A27]"
                  >
                    <span>Showroom</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>

                  <button
                    type="button"
                    disabled={!primaryVar || !firstInStockSize || totalStock === 0}
                    onClick={() => {
                      if (!primaryVar || !firstInStockSize) return;
                      if (!authUser) {
                        router.push('/login?redirect=/shop');
                        return;
                      }
                      addToCart({
                        productId: product.id,
                        productSlug: product.slug,
                        productName: product.name,
                        variantId: primaryVar.id,
                        colorName: primaryVar.colorName,
                        primaryGlowHex: primaryVar.primaryGlowHex,
                        posterImageUrl: primaryVar.posterImageUrl,
                        sizeSku: firstInStockSize.sku,
                        sizeLabel: firstInStockSize.sizeLabel,
                        unitPrice: product.basePrice,
                        maxStock: firstInStockSize.stockCount,
                      });
                      setIsCartOpen(true);
                    }}
                    className="btn-atelier inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>
                      Quick Add (
                      {firstInStockSize?.sizeLabel || 'Out of Stock'})
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
