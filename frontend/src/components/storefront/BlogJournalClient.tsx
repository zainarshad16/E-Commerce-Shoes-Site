'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Clock,
  Search,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export function BlogJournalClient() {
  const { blogs, products } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const publishedBlogs = useMemo(
    () => blogs.filter((b) => b.published),
    [blogs]
  );

  const categories = useMemo(() => {
    const uniq = Array.from(new Set(publishedBlogs.map((b) => b.category)));
    return ['All', ...uniq];
  }, [publishedBlogs]);

  const filteredBlogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publishedBlogs
      .filter((b) =>
        selectedCategory === 'All' ? true : b.category === selectedCategory
      )
      .filter((b) => {
        if (!q) return true;
        return (
          b.title.toLowerCase().includes(q) ||
          b.subtitle.toLowerCase().includes(q) ||
          b.excerpt.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
  }, [publishedBlogs, selectedCategory, searchQuery]);

  const featuredArticle =
    filteredBlogs.find((b) => b.featured) || filteredBlogs[0];
  const restArticles = featuredArticle
    ? filteredBlogs.filter((b) => b.id !== featuredArticle.id)
    : [];

  return (
    <div className="space-y-12">
      {/* Editorial Filter & Search Bar */}
      <div className="flex flex-col gap-4 rounded-3xl border border-stone-900/10 bg-white/95 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-[#18181B] text-[#F6F3EC]'
                  : 'border border-stone-900/10 bg-[#F6F3EC] text-stone-700 hover:border-stone-900/30 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leather guides, care notes..."
            aria-label="Search journal articles"
            className="h-10 w-full rounded-full border border-stone-900/10 bg-[#F6F3EC] pl-9 pr-4 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#8C4A27] focus:outline-none"
          />
        </div>
      </div>

      {/* Featured Story Hero */}
      {featuredArticle && (
        <article className="atelier-card overflow-hidden rounded-3xl">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <Link
              href={`/blog/${featuredArticle.slug}`}
              className="group relative flex min-h-[300px] items-center justify-center bg-[#EFECE4] p-10 lg:col-span-5"
            >
              <span className="absolute top-5 left-5 rounded-full border border-[#8C4A27]/30 bg-white/90 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8C4A27]">
                Featured Dispatch
              </span>
              <img
                src={featuredArticle.coverImage}
                alt={featuredArticle.title}
                className="max-h-72 w-auto object-contain drop-shadow-[0_24px_30px_rgba(24,24,27,0.18)] transition duration-500 group-hover:scale-105"
              />
            </Link>

            <div className="flex flex-col justify-between p-7 sm:p-10 lg:col-span-7">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8C4A27]">
                    {featuredArticle.category}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {featuredArticle.readTime}
                  </span>
                  <span>·</span>
                  <span>{featuredArticle.publishedAt}</span>
                </div>

                <Link href={`/blog/${featuredArticle.slug}`} className="block">
                  <h2 className="mt-3 font-condensed text-4xl uppercase leading-[0.98] tracking-tight text-stone-900 transition hover:text-[#8C4A27] sm:text-5xl">
                    {featuredArticle.title}
                  </h2>
                </Link>

                <p className="mt-3 font-serif text-lg italic text-stone-600">
                  {featuredArticle.subtitle}
                </p>

                <p className="mt-4 text-sm leading-relaxed text-stone-600">
                  {featuredArticle.excerpt}
                </p>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-stone-900/10 pt-5">
                <div className="text-xs">
                  <p className="font-semibold text-stone-900">
                    {featuredArticle.author}
                  </p>
                  <p className="text-stone-500">{featuredArticle.authorRole}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    href={`/product/${featuredArticle.relatedProductSlug}`}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-stone-900/15 bg-[#F6F3EC] px-4 text-xs font-semibold text-stone-800 transition hover:border-[#8C4A27] hover:text-[#8C4A27]"
                  >
                    <span>Shop Featured Shoe</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/blog/${featuredArticle.slug}`}
                    className="btn-atelier inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-semibold"
                  >
                    <span>Read Story</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>
      )}

      {/* Article Grid for Each Signature Shoe */}
      {restArticles.length > 0 && (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {restArticles.map((article) => {
            const matchedShoe = products.find(
              (p) => p.slug === article.relatedProductSlug
            );

            return (
              <article
                key={article.id}
                className="atelier-card flex flex-col justify-between overflow-hidden rounded-3xl p-5"
              >
                <div>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="group relative flex h-52 items-center justify-center overflow-hidden rounded-2xl bg-[#EFECE4] p-5"
                  >
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#8C4A27]">
                      {article.category}
                    </span>
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="max-h-40 w-auto object-contain drop-shadow-[0_18px_22px_rgba(24,24,27,0.16)] transition duration-500 group-hover:scale-105"
                    />
                  </Link>

                  <div className="mt-5 flex items-center gap-2 text-[11px] text-stone-500">
                    <span>{article.publishedAt}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-[#8C4A27]" />
                      {article.readTime}
                    </span>
                  </div>

                  <Link href={`/blog/${article.slug}`} className="block">
                    <h3 className="mt-2 font-condensed text-2xl uppercase leading-tight text-stone-900 transition hover:text-[#8C4A27]">
                      {article.title}
                    </h3>
                  </Link>

                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-stone-600">
                    {article.excerpt}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-2 border-t border-stone-900/10 pt-4">
                  <Link
                    href={`/product/${article.relatedProductSlug}`}
                    className="truncate text-[11px] font-semibold text-[#8C4A27] hover:underline"
                  >
                    {matchedShoe?.name || 'View Featured Shoe'} →
                  </Link>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#18181B] px-3.5 py-1.5 text-[11px] font-semibold text-[#F6F3EC] transition hover:bg-[#8C4A27]"
                  >
                    <span>Read</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {filteredBlogs.length === 0 && (
        <div className="rounded-3xl border border-stone-900/10 bg-white p-12 text-center">
          <p className="font-condensed text-3xl uppercase text-stone-900">
            No Journal Entries Found
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Reset filters to read all seven footwear guides and craft essays.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="btn-atelier mt-5 rounded-full px-6 py-2.5 text-xs font-semibold"
          >
            Show All Articles
          </button>
        </div>
      )}
    </div>
  );
}

