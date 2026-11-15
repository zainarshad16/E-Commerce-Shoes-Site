'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, Sparkles, Tag } from 'lucide-react';
import { BlogPost } from '@/types/cms';
import { useStore } from '@/context/StoreContext';
import {
  SneakerStudioThumb,
  resolveSilhouetteFromText,
} from '@/components/storefront/SneakerStudioThumb';

interface BlogPostClientProps {
  initialBlog: BlogPost;
}

export function BlogPostClient({ initialBlog }: BlogPostClientProps) {
  const { blogs, products } = useStore();

  // Prefer live CMS state if admin edited the post in the current session
  const article =
    blogs.find((b) => b.id === initialBlog.id || b.slug === initialBlog.slug) ||
    initialBlog;

  const relatedShoe = products.find(
    (p) => p.slug === article.relatedProductSlug
  );
  const moreStories = blogs
    .filter((b) => b.published && b.slug !== article.slug)
    .slice(0, 3);

  return (
    <article className="mx-auto max-w-6xl">
      {/* Header */}
      <header className="mb-10 border-b border-stone-900/10 pb-8">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-stone-500">
          <span className="rounded-full bg-[#8C4A27]/10 px-3 py-1 font-semibold uppercase tracking-[0.16em] text-[#8C4A27]">
            {article.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {article.readTime}
          </span>
          <span>·</span>
          <span>Published {article.publishedAt}</span>
        </div>

        <h1 className="mt-4 max-w-4xl font-condensed text-5xl uppercase leading-[0.95] tracking-tight text-stone-900 sm:text-6xl">
          {article.title}
        </h1>

        <p className="mt-4 max-w-3xl font-serif text-2xl italic leading-relaxed text-stone-700">
          {article.subtitle}
        </p>

        <div className="mt-6 flex items-center gap-3 text-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#18181B] font-bold text-[#F6F3EC]">
            {article.author
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-stone-900">{article.author}</p>
            <p className="text-stone-500">{article.authorRole}</p>
          </div>
        </div>
      </header>

      {/* Main Article + Featured Shoe Sticky Column */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <div className="flex h-80 items-center justify-center overflow-hidden rounded-3xl border border-stone-900/10 bg-[#EFECE4] p-8 sm:h-96">
            <img
              src={article.coverImage}
              alt={article.title}
              className="max-h-72 w-auto object-contain drop-shadow-[0_24px_34px_rgba(24,24,27,0.18)]"
            />
          </div>

          <p className="rounded-2xl border-l-4 border-[#8C4A27] bg-white px-6 py-5 text-base leading-relaxed text-stone-800 shadow-sm">
            {article.excerpt}
          </p>

          <div className="space-y-8 rounded-3xl border border-stone-900/10 bg-white p-7 shadow-sm sm:p-10">
            {article.sections.map((section, idx) => (
              <section key={`${section.heading}-${idx}`} className="space-y-3">
                <h2 className="font-condensed text-3xl uppercase tracking-tight text-stone-900">
                  {section.heading}
                </h2>
                <p className="text-base leading-relaxed text-stone-700">
                  {section.body}
                </p>
              </section>
            ))}

            {article.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-stone-900/10 pt-6">
                <Tag className="h-3.5 w-3.5 text-[#8C4A27]" />
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-stone-900/10 bg-[#F6F3EC] px-3 py-1 text-xs font-medium text-stone-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#8C4A27] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Journal Stories</span>
          </Link>
        </div>

        {/* Sticky Featured Shoe Card */}
        <aside className="lg:col-span-4">
          {relatedShoe && (
            <div className="atelier-card sticky top-24 rounded-3xl p-6">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8C4A27]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Featured Pair in This Story</span>
              </div>

              <Link
                href={`/product/${relatedShoe.slug}`}
                className="mt-4 block"
              >
                <SneakerStudioThumb
                  name={relatedShoe.name}
                  category={relatedShoe.category}
                  imageUrl={
                    relatedShoe.variants[0]?.posterImageUrl ||
                    article.coverImage
                  }
                  primaryGlowHex={relatedShoe.variants[0]?.primaryGlowHex}
                  secondaryAccentHex={
                    relatedShoe.variants[0]?.secondaryAccentHex
                  }
                  silhouette={resolveSilhouetteFromText(relatedShoe.name)}
                  className="h-52 w-full"
                />
              </Link>

              <div className="mt-5 flex items-baseline justify-between gap-2">
                <h2 className="font-condensed text-3xl uppercase text-stone-900">
                  {relatedShoe.name}
                </h2>
                <span className="font-condensed text-3xl tabular-nums text-stone-900">
                  ${relatedShoe.basePrice}
                </span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                {relatedShoe.tagline}
              </p>

              <Link
                href={`/product/${relatedShoe.slug}`}
                className="btn-atelier mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-xs font-semibold uppercase tracking-wider"
              >
                <span>Open Shoe Showroom</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* More Journal Stories */}
      {moreStories.length > 0 && (
        <section className="mt-16 border-t border-stone-900/10 pt-14">
          <p className="font-serif text-base italic text-[#8C4A27]">
            Continue Reading
          </p>
          <h2 className="mt-1 font-condensed text-4xl uppercase text-stone-900">
            More Stories from the Workshop
          </h2>

          <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-3">
            {moreStories.map((story) => (
              <Link
                key={story.id}
                href={`/blog/${story.slug}`}
                className="atelier-card group rounded-3xl p-5"
              >
                <div className="flex h-40 items-center justify-center rounded-2xl bg-[#EFECE4] p-4">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="max-h-32 w-auto object-contain transition duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8C4A27]">
                  {story.category}
                </p>
                <h3 className="mt-1 font-condensed text-2xl uppercase leading-tight text-stone-900 group-hover:text-[#8C4A27]">
                  {story.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

