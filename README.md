# AETHER LABS — 3D Scrollytelling Sneaker E-Commerce Platform & Headless 3D CMS

A strictly decoupled, production-grade 3D scrollytelling e-commerce storefront, technical SEO engine, and visual 3D headless CMS engineered for **Cloudflare Workers**, **Neon Serverless PostgreSQL**, and **Cloudflare R2**.

---

## Architecture & Repository Blueprint

```text
├── README.md
├── backend/                          # Node.js + Express + TypeScript REST API
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma             # Neon Serverless PostgreSQL schema
│   │   └── seed.ts                   # Idempotent sneaker, colorway, hotspot & CMS seeder
│   └── src/
│       ├── config/db.ts              # @neondatabase/serverless Pool + PrismaNeon adapter
│       ├── data/seedData.ts          # Shared structured catalog & CMS fallback dataset
│       ├── middleware/auth.middleware.ts
│       ├── routes/api.routes.ts      # Products, Hotspots, R2 Presigned, CMS, SEO, Orders
│       ├── services/
│       │   ├── r2.service.ts         # @aws-sdk/client-s3 Cloudflare R2 presigned URLs
│       │   └── revalidate.service.ts # Next.js On-Demand ISR webhook dispatcher
│       ├── validators/schemas.ts     # Zod request validation schemas
│       └── server.ts                 # Express app entrypoint + CORS + error handler
│
└── frontend/                         # Next.js 15 App Router (Cloudflare Workers / Pages)
    ├── .env.example
    ├── next.config.ts                # R2 CDN remotePatterns, immutable .glb headers
    ├── package.json
    ├── postcss.config.mjs
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── wrangler.toml                 # @opennextjs/cloudflare edge deployment config
    └── src/
        ├── types/cms.ts              # Shared domain models
        ├── lib/
        │   ├── api.ts                # ISR-tagged SSR fetchers + graceful fallback
        │   ├── cms-seed.ts           # Deterministic SSR seed data
        │   └── seo.ts                # Schema.org JSON-LD & canonical URL builders
        ├── context/StoreContext.tsx  # Colorway glow engine, Cart & Admin CMS state
        ├── components/
        │   ├── seo/JsonLd.tsx        # Server-rendered JSON-LD script injector
        │   ├── three/
        │   │   ├── ProceduralSneakerMesh.tsx  # R2 GLB loader + procedural deconstructable shoe
        │   │   └── ShoeStage.tsx              # R3F Canvas, Dynamic Glow Lights & Orbit Telemetry
        │   └── storefront/
        │       ├── Navbar.tsx
        │       ├── Footer.tsx
        │       ├── CartDrawer.tsx
        │       ├── ComparisonModal.tsx
        │       ├── Progressive3DHero.tsx
        │       ├── ScrollytellingDeconstruct.tsx
        │       ├── CatalogClient.tsx
        │       └── ProductDetailInteractive.tsx
        └── app/
            ├── globals.css
            ├── layout.tsx            # Self-hosted next/font + Organization/WebSite JSON-LD
            ├── page.tsx              # SSR Homepage + 3D Hero + Scrollytelling + Lineup + FAQ
            ├── sitemap.ts            # Dynamic XML sitemap from Neon/Express API
            ├── robots.ts             # Crawl budget optimization (/admin, /api, /*?* blocked)
            ├── api/revalidate/route.ts  # On-Demand ISR webhook receiver
            ├── shop/page.tsx         # Filterable SSR catalog + multi-shoe compare
            ├── collections/[slug]/page.tsx
            ├── product/[slug]/page.tsx  # Dynamic metadata + Product JSON-LD + 3D/Gallery viewer
            ├── about/page.tsx
            ├── faq/page.tsx          # Dynamic FAQPage JSON-LD
            └── admin/page.tsx        # Visual 3D Hotspot Studio, R2 Uploader, SERP Preview & Orders
```

---

## Core Engineering Pillars

### 1. Google #1 Ranking & SSR-First + Progressive 3D Hydration SEO
- **Zero-CLS Instant LCP (`< 1.2s`):** Every 3D stage renders a server-side high-resolution studio poster image (`priority` / `fetchPriority="high"`) locked to its container aspect ratio while React Three Fiber loads asynchronously via `next/dynamic(..., { ssr: false })`.
- **Semantic HTML First:** All `<h1>` titles, product stories, `<dl>` specification lists, size availability tables, and FAQ accordions render directly in Next.js Server Components before client JS hydration.
- **Automated Technical SEO:**
  - `generateMetadata` on `/`, `/shop`, `/collections/[slug]`, `/product/[slug]`, `/about`, and `/faq` with self-referencing canonicals, OpenGraph, and Twitter cards.
  - Structured Data (`application/ld+json`): `Organization`, `WebSite` (`SearchAction`), `Product` (live `InStock`/`OutOfStock` mapped to `SizeInventory`), `BreadcrumbList`, and `FAQPage`.
  - Dynamic `sitemap.ts`, crawl-budget `robots.ts`, and instant On-Demand ISR via `/api/revalidate`.

### 2. Cloudflare R2 Direct Presigned Upload Pipeline
- Admin uploads `.glb` models (`model/gltf-binary`, max 8 MB) and `.webp` images directly from the browser to Cloudflare R2 using S3-compatible presigned `PUT` URLs (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`) with `Cache-Control: public, max-age=31536000, immutable`.

### 3. Visual 3D CMS & Camera Hotspot Studio (`/admin`)
- Orbit any sneaker inside the live Three.js preview studio, switch colorway glow hex codes, and click **Capture Camera Hotspot** at scroll percentages (`20%`, `50%`, `80%`) to persist exact 3D camera `position` & `target` vectors to Neon PostgreSQL and purge edge caches via ISR.

---

## Local Development Setup

### 1. Backend (`/backend`)
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
# When DATABASE_URL points to your Neon DB:
# npx prisma db push && npx tsx prisma/seed.ts
npm run dev
```

### 2. Frontend (`/frontend`)
```bash
cd frontend
cp .env.example .env.local
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:3000` for the storefront and `http://localhost:3000/admin` for the Visual 3D CMS & Hotspot Studio.

---

## Production Deployment (Neon + Cloudflare R2 + Cloudflare Workers)

1. **Neon PostgreSQL:** Provision a Neon Serverless database, set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) in `/backend/.env`, then run `npx prisma migrate deploy && npx tsx prisma/seed.ts`.
2. **Cloudflare R2:** Create an R2 bucket (`aether-3d-assets`), attach a custom public CDN domain (`cdn.aetherfootwear.com`), configure CORS for `PUT`/`GET` from your frontend origin, and populate `R2_*` env vars.
3. **Backend API:** Deploy `/backend` to Railway, Fly.io, or Render (`npm run build && npm start`).
4. **Frontend on Cloudflare Workers:**
   ```bash
   cd frontend
   npx opennextjs-cloudflare build
   npx wrangler deploy
   ```

---

## Customizing the 3D Scroll-Driven Showcase (`AETHER LABS`)

### 1. Swapping the Original Studio Shoe Photos (`/public/images/shoes/*.png`)
The persistent showcase component ([Sneaker.tsx](frontend/src/components/three/Sneaker.tsx)) and studio cards ([SneakerStudioThumb.tsx](frontend/src/components/storefront/SneakerStudioThumb.tsx)) render the authentic studio PNG cutouts located under `frontend/public/images/shoes/` (no procedural AI `.glb` geometry).

- To process or re-import source shoe photos into normalized `1024x1024` transparent studio PNGs:
  ```bash
  node frontend/scripts/import-original-shoes.mjs
  ```

### 2. Brand Config, Copy & Currencies (`brand.config.ts`)
Edit [brand.config.ts](frontend/src/config/brand.config.ts) to customize:
- Brand name (`AETHER LABS`), `"WALK THE FUTURE"` hero lines, and dark palette (`#0A0A0F` + `#C8FF2E` / `#FF5A1F`)
- Supported currencies (`USD` and `PKR` exchange rates + formatting via `formatBrandPrice`)
- Section 2 360° orbit callout angle windows (`showcaseCallouts`)
- Section 3 explode vectors and benefit labels (`anatomyParts`)
- Section 7 social proof stats & quotes

### 3. Adding Colorways & Products (`products.json`)
All lineup products (`Runner`, `Court`, `Trail`, `Lifestyle`), their hex palettes (`upper`, `midsole`, `outsole`, `laces`, `tongue`, `logo`, `bgGradient`), limited tags (`isLimited`), and EU/US/UK stock levels live in [products.json](frontend/src/data/products.json) (typed in [products.ts](frontend/src/data/products.ts)).

### 4. Editing GSAP ScrollTrigger Timelines
All 8 scroll choreography keyframes (`Hero -> 360° -> Anatomy Explode -> Colorways -> Lineup -> Buy Panel -> Social Proof -> Final CTA`) live in [ShowcaseExperience.tsx](frontend/src/components/showcase/ShowcaseExperience.tsx), using Lenis smooth scroll (`scrub: 1`) and `sneakerScrollState.ts`.

### 5. Stripe Checkout Placeholder Env Vars
[CartDrawer.tsx](frontend/src/components/storefront/CartDrawer.tsx) currently executes live authenticated Neon PostgreSQL order allocation and includes a `TODO` hook for Stripe Checkout redirect. Add the following keys when enabling Stripe:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```


