import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogBySlug, getSiteSeoConfig } from '@/lib/api';
import { buildBreadcrumbSchema, buildCanonicalUrl } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { BlogPostClient } from '@/components/storefront/BlogPostClient';

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const [blog, seo] = await Promise.all([
    getBlogBySlug(slug),
    getSiteSeoConfig(),
  ]);

  if (!blog) {
    return { title: 'Article Not Found | Atelier Vance' };
  }

  return {
    title: `${blog.title} | Atelier Vance Journal`,
    description: blog.excerpt,
    alternates: {
      canonical: buildCanonicalUrl(seo.siteUrl, `/blog/${blog.slug}`),
    },
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: [{ url: blog.coverImage }],
      type: 'article',
    },
  };
}

export default async function BlogArticlePage({
  params,
}: BlogArticlePageProps) {
  const { slug } = await params;
  const [blog, seo] = await Promise.all([
    getBlogBySlug(slug),
    getSiteSeoConfig(),
  ]);

  if (!blog) {
    notFound();
  }

  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: 'Home', pathname: '/' },
      { name: 'Journal', pathname: '/blog' },
      { name: blog.title, pathname: `/blog/${blog.slug}` },
    ],
    seo.siteUrl
  );

  return (
    <main className="min-h-screen bg-[#F6F3EC] pt-28 pb-20 text-stone-900">
      <JsonLd data={breadcrumbSchema} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-2 font-mono text-xs text-stone-500"
        >
          <Link href="/" className="transition hover:text-stone-900">
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" className="transition hover:text-stone-900">
            Journal
          </Link>
          <span>/</span>
          <span className="line-clamp-1 font-medium text-stone-900">
            {blog.title}
          </span>
        </nav>

        <BlogPostClient initialBlog={blog} />
      </div>
    </main>
  );
}

