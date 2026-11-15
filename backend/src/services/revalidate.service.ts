export interface RevalidationResult {
  dispatched: boolean;
  tags: string[];
  paths: string[];
  status?: number;
  error?: string;
}

/**
 * Triggers On-Demand ISR cache purging on the Next.js Cloudflare storefront
 * whenever an Admin creates, updates, or deletes CMS/Product/SEO records.
 */
export async function triggerFrontendRevalidation(
  tags: string[],
  paths: string[] = []
): Promise<RevalidationResult> {
  const rawFrontendUrls = (
    process.env.FRONTEND_URL || 'https://atelier-vance-storefront.vercel.app'
  )
    .split(',')
    .map((u) => u.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const frontendUrl =
    rawFrontendUrls.find((u) => !u.includes('localhost')) ||
    rawFrontendUrls[0] ||
    'https://atelier-vance-storefront.vercel.app';
  const secret = process.env.REVALIDATE_SECRET || 'isr-revalidate-webhook-secret-token';
  const endpoint = `${frontendUrl}/api/revalidate`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({ tags, paths }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return {
      dispatched: response.ok,
      tags,
      paths,
      status: response.status,
    };
  } catch (error) {
    return {
      dispatched: false,
      tags,
      paths,
      error: error instanceof Error ? error.message : 'Revalidation webhook unreachable',
    };
  }
}

