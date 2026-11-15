import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  const expectedSecret =
    process.env.REVALIDATE_SECRET || 'isr-revalidate-webhook-secret-token';
  const providedSecret = req.headers.get('x-revalidate-secret');

  if (providedSecret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Invalid revalidation secret' },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      tags?: string[];
      paths?: string[];
    };

    const tags = Array.isArray(body.tags) && body.tags.length > 0
      ? body.tags
      : ['products', 'cms', 'seo', 'sitemap', 'faq'];

    const paths = Array.isArray(body.paths) && body.paths.length > 0
      ? body.paths
      : ['/', '/shop', '/faq'];

    for (const tag of tags) {
      revalidateTag(tag);
    }

    for (const path of paths) {
      revalidatePath(path);
    }

    return NextResponse.json({
      revalidated: true,
      tags,
      paths,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'ISR revalidation failed',
      },
      { status: 500 }
    );
  }
}

