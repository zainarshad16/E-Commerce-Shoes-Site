import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma, isDbConnected } from '../config/db';
import { memoryStore, SeedBlogPost, SeedProduct } from '../data/seedData';
import {
  AuthenticatedRequest,
  authenticateJWT,
  requireRole,
  signAuthToken,
  UserRole,
} from '../middleware/auth.middleware';
import { createR2PresignedUpload } from '../services/r2.service';
import { triggerFrontendRevalidation } from '../services/revalidate.service';
import {
  CreateOrderSchema,
  HotspotBatchSchema,
  InventoryUpdateSchema,
  OrderStatusSchema,
  PageSectionUpdateSchema,
  PresignedUploadSchema,
  ProductUpsertSchema,
  SeoConfigSchema,
} from '../validators/schemas';

const router = Router();
const bootTime = Date.now();

function paramStr(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

/* -------------------------------------------------------------------------- */
/* API v1 Root Index & Health Keep-Alive                                      */
/* -------------------------------------------------------------------------- */
router.get('/', async (_req: Request, res: Response) => {
  const dbReady = await isDbConnected();
  res.json({
    status: 'ok',
    service: 'AETHER LABS Headless 3D E-Commerce API v1',
    databaseMode: dbReady ? 'neon-postgresql' : 'in-memory-seed',
    uptimeSeconds: Math.floor((Date.now() - bootTime) / 1000),
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      products: '/api/v1/products',
      productBySlug: '/api/v1/products/:slug',
      cmsSections: '/api/v1/cms/:pageSlug',
      seo: '/api/v1/seo',
      orders: '/api/v1/orders',
      presignedUpload: '/api/v1/upload/presigned',
    },
  });
});

router.get('/health', async (_req: Request, res: Response) => {
  const dbReady = await isDbConnected();
  res.json({
    status: 'ok',
    service: 'aether-backend-api',
    databaseMode: dbReady ? 'neon-postgresql' : 'in-memory-seed',
    uptimeSeconds: Math.floor((Date.now() - bootTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

/* -------------------------------------------------------------------------- */
/* Authentication, User Tracking & Contact Settings                           */
/* -------------------------------------------------------------------------- */
interface ManagedUserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  authProvider: 'email' | 'google';
  createdAt: string;
  lastLoginAt: string;
}

const DEFAULT_ADMIN_HASH = bcrypt.hashSync('AetherAdmin2026!', 10);
const DEFAULT_EDITOR_HASH = bcrypt.hashSync('AetherEditor2026!', 10);
const DEFAULT_CUSTOMER_HASH = bcrypt.hashSync('AtelierGuest2026!', 10);

const memoryUsers: ManagedUserRecord[] = [
  {
    id: 'local-admin',
    email: 'admin@aetherfootwear.com',
    name: 'Studio Director',
    passwordHash: DEFAULT_ADMIN_HASH,
    role: 'ADMIN',
    phone: '+92 300 1234567',
    address: '240 Mercer St, Flagship Studio',
    city: 'New York',
    state: 'NY',
    zipCode: '10012',
    authProvider: 'email',
    createdAt: '2026-01-10T09:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'local-editor',
    email: 'editor@aetherfootwear.com',
    name: 'Creative Editor',
    passwordHash: DEFAULT_EDITOR_HASH,
    role: 'EDITOR',
    phone: '+92 321 7654321',
    address: 'Atelier Editorial Desk',
    city: 'Lahore',
    state: 'PB',
    zipCode: '54000',
    authProvider: 'email',
    createdAt: '2026-01-15T10:30:00.000Z',
    lastLoginAt: new Date().toISOString(),
  },
  ...memoryStore.orders.slice(0, 3).map((ord, idx) => ({
    id: `seed-cust-${idx + 1}`,
    email: ord.customerEmail.toLowerCase(),
    name: ord.customerName,
    passwordHash: DEFAULT_CUSTOMER_HASH,
    role: 'CUSTOMER' as UserRole,
    phone: '+1 (555) 209-4410',
    address: ord.shippingAddressJson.line1,
    city: ord.shippingAddressJson.city,
    state: ord.shippingAddressJson.state,
    zipCode: ord.shippingAddressJson.postalCode,
    authProvider: 'email' as const,
    createdAt: ord.createdAt,
    lastLoginAt: ord.createdAt,
  })),
];

interface UserProfileMetaEntry {
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  authProvider?: 'email' | 'google';
  plainPassword?: string;
  lastLoginAt?: string;
}

const USER_PROFILE_META_PATH = path.resolve(
  __dirname,
  '../../data/user-profile-meta.json'
);

const userProfileMeta = new Map<string, UserProfileMetaEntry>();

function loadUserProfileMeta() {
  try {
    if (!fs.existsSync(USER_PROFILE_META_PATH)) return;
    const raw = fs.readFileSync(USER_PROFILE_META_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, UserProfileMetaEntry>;
    if (parsed && typeof parsed === 'object') {
      for (const [k, v] of Object.entries(parsed)) {
        if (v && typeof v === 'object') {
          userProfileMeta.set(k.toLowerCase(), v);
        }
      }
    }
  } catch {
    // Ignore corrupt or missing local metadata file
  }
}

function persistUserProfileMeta() {
  try {
    const dir = path.dirname(USER_PROFILE_META_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const obj: Record<string, UserProfileMetaEntry> = {};
    for (const [k, v] of userProfileMeta.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(
      USER_PROFILE_META_PATH,
      JSON.stringify(obj, null, 2),
      'utf8'
    );
  } catch {
    // Non-fatal persistence fallback
  }
}

loadUserProfileMeta();

if (!userProfileMeta.has('admin@aetherfootwear.com')) {
  userProfileMeta.set('admin@aetherfootwear.com', {
    authProvider: 'email',
    plainPassword: 'AetherAdmin2026!',
  });
}
if (!userProfileMeta.has('editor@aetherfootwear.com')) {
  userProfileMeta.set('editor@aetherfootwear.com', {
    authProvider: 'email',
    plainPassword: 'AetherEditor2026!',
  });
}

const VALID_ADMIN_TABS = new Set([
  'products',
  'blogs',
  'orders',
  'users',
  'roles',
  'contact-chat',
  'section-hero',
  'section-statement',
  'section-faq',
  'section-newsletter',
  'global-seo',
]);

const DEFAULT_EDITOR_TABS = [
  'products',
  'blogs',
  'section-hero',
  'section-statement',
  'section-faq',
  'section-newsletter',
  'global-seo',
];

const ROLE_PERMISSIONS_PATH = path.resolve(
  __dirname,
  '../../data/role-permissions.json'
);

let memoryRolePermissions: {
  editorTabs: string[];
  userTabOverrides: Record<string, string[]>;
  updatedAt: string;
} = {
  editorTabs: [...DEFAULT_EDITOR_TABS],
  userTabOverrides: {},
  updatedAt: new Date().toISOString(),
};

function loadRolePermissions() {
  try {
    if (!fs.existsSync(ROLE_PERMISSIONS_PATH)) return;
    const raw = fs.readFileSync(ROLE_PERMISSIONS_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<typeof memoryRolePermissions>;
    if (Array.isArray(parsed.editorTabs)) {
      memoryRolePermissions.editorTabs = parsed.editorTabs.filter((t) =>
        VALID_ADMIN_TABS.has(t)
      );
    }
    if (parsed.userTabOverrides && typeof parsed.userTabOverrides === 'object') {
      const cleanOverrides: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(parsed.userTabOverrides)) {
        if (Array.isArray(v)) {
          cleanOverrides[k.toLowerCase()] = v.filter((t) =>
            VALID_ADMIN_TABS.has(t)
          );
        }
      }
      memoryRolePermissions.userTabOverrides = cleanOverrides;
    }
    if (typeof parsed.updatedAt === 'string') {
      memoryRolePermissions.updatedAt = parsed.updatedAt;
    }
  } catch {
    // Keep defaults
  }
}

function persistRolePermissions() {
  try {
    const dir = path.dirname(ROLE_PERMISSIONS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      ROLE_PERMISSIONS_PATH,
      JSON.stringify(memoryRolePermissions, null, 2),
      'utf8'
    );
  } catch {
    // Non-fatal local persistence fallback
  }
}

loadRolePermissions();

const SEED_OR_TEST_EMAILS = new Set([
  'hannah.lindstrom@gmail.com',
  'tariq.mahmood@gmail.com',
  'guest.reader@gmail.com',
  'test.google@gmail.com',
  'verify_1794748606038@aether-test.io',
]);

function getLocalGitIdentity(
  knownNames: string[] = []
): { email: string; name: string } | null {
  try {
    const email = execSync('git config user.email', { encoding: 'utf8' })
      .trim()
      .toLowerCase();
    if (!email || !email.includes('@')) return null;
    const rawName = execSync('git config user.name', { encoding: 'utf8' }).trim();
    const handle = (rawName || email.split('@')[0]).replace(/\d+$/, '').toLowerCase();
    const matchedKnown = knownNames.find(
      (n) =>
        n.includes(' ') &&
        n.toLowerCase().replace(/\s+/g, '') === handle
    );
    let resolvedName = matchedKnown || rawName || email.split('@')[0];
    if (!matchedKnown && !resolvedName.includes(' ')) {
      const stripped = resolvedName.replace(/\d+$/, '');
      if (stripped.length >= 2) {
        resolvedName = stripped
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
    return { email, name: resolvedName };
  } catch {
    return null;
  }
}

function serializeManagedUser(user: ManagedUserRecord) {
  const emailLower = user.email.toLowerCase();
  const meta = userProfileMeta.get(emailLower);
  const matchingOrders = memoryStore.orders.filter(
    (o) => o.customerEmail.toLowerCase() === emailLower
  );
  const totalSpent = matchingOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: meta?.phone ?? user.phone ?? '',
    address: meta?.address ?? user.address ?? '',
    city: meta?.city ?? user.city ?? '',
    state: meta?.state ?? user.state ?? '',
    zipCode: meta?.zipCode ?? user.zipCode ?? '',
    authProvider:
      meta?.authProvider ??
      (emailLower.endsWith('@gmail.com') ? 'google' : user.authProvider),
    currentPassword:
      meta?.plainPassword ||
      ((meta?.authProvider ??
        (emailLower.endsWith('@gmail.com') ? 'google' : user.authProvider)) ===
      'google'
        ? 'Google OAuth (no password set)'
        : 'Encrypted (set new password below)'),
    createdAt: user.createdAt,
    lastLoginAt: meta?.lastLoginAt ?? user.lastLoginAt,
    orderCount: matchingOrders.length,
    totalSpent,
    orders: matchingOrders,
  };
}

let memoryContactSettings = {
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
  cloudflareZoneDomain: 'atelier-vance-storefront.vercel.app',
  googleClientId:
    '410827708760-5dd9s2sekl7vfro9gik90qf22irfetn5.apps.googleusercontent.com',
  updatedAt: new Date().toISOString(),
};

router.post('/auth/register', async (req: Request, res: Response) => {
  const rawName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const rawEmail =
    typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const rawPassword =
    typeof req.body?.password === 'string' ? req.body.password : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const address =
    typeof req.body?.address === 'string' ? req.body.address.trim() : '';
  const city = typeof req.body?.city === 'string' ? req.body.city.trim() : '';
  const state = typeof req.body?.state === 'string' ? req.body.state.trim() : '';
  const zipCode =
    typeof req.body?.zipCode === 'string' ? req.body.zipCode.trim() : '';

  if (rawName.length < 2) {
    res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    return;
  }
  if (!rawEmail.includes('@') || rawEmail.length < 5) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (rawPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  const nowIso = new Date().toISOString();
  userProfileMeta.set(rawEmail, {
    phone,
    address,
    city,
    state,
    zipCode,
    authProvider: 'email',
    plainPassword: rawPassword,
    lastLoginAt: nowIso,
  });
  persistUserProfileMeta();

  const dbReady = await isDbConnected();
  if (dbReady && prisma) {
    const existing = await prisma.user.findUnique({ where: { email: rawEmail } });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const created = await prisma.user.create({
      data: {
        email: rawEmail,
        name: rawName,
        passwordHash,
        role: 'CUSTOMER',
      },
    });

    const token = signAuthToken({
      userId: created.id,
      email: created.email,
      role: created.role,
      name: created.name,
    });
    res.status(201).json({
      token,
      user: {
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role,
        phone,
        address,
        city,
        state,
        zipCode,
      },
    });
    return;
  }

  const existingLocal = memoryUsers.find((u) => u.email.toLowerCase() === rawEmail);
  if (existingLocal) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const newUser: ManagedUserRecord = {
    id: `local-cust-${Date.now()}`,
    email: rawEmail,
    name: rawName,
    passwordHash,
    role: 'CUSTOMER',
    phone,
    address,
    city,
    state,
    zipCode,
    authProvider: 'email',
    createdAt: nowIso,
    lastLoginAt: nowIso,
  };
  memoryUsers.push(newUser);
  const token = signAuthToken({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
    name: newUser.name,
  });
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      phone,
      address,
      city,
      state,
      zipCode,
    },
  });
});

router.post('/auth/login', async (req: Request, res: Response) => {
  const email =
    typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const nowIso = new Date().toISOString();
  const dbReady = await isDbConnected();
  if (dbReady && prisma) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const prevMeta = userProfileMeta.get(email) || {};
    userProfileMeta.set(email, {
      ...prevMeta,
      plainPassword: password,
      lastLoginAt: nowIso,
    });
    persistUserProfileMeta();

    const token = signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: prevMeta.phone,
        address: prevMeta.address,
        city: prevMeta.city,
        state: prevMeta.state,
        zipCode: prevMeta.zipCode,
      },
    });
    return;
  }

  const localUser = memoryUsers.find((u) => u.email.toLowerCase() === email);
  if (localUser && (await bcrypt.compare(password, localUser.passwordHash))) {
    localUser.lastLoginAt = nowIso;
    const token = signAuthToken({
      userId: localUser.id,
      email: localUser.email,
      role: localUser.role,
      name: localUser.name,
    });
    res.json({
      token,
      user: {
        id: localUser.id,
        email: localUser.email,
        name: localUser.name,
        role: localUser.role,
        phone: localUser.phone,
        address: localUser.address,
        city: localUser.city,
        state: localUser.state,
        zipCode: localUser.zipCode,
      },
    });
    return;
  }

  res.status(401).json({ error: 'Invalid credentials.' });
});

router.get('/auth/google/current', async (_req: Request, res: Response) => {
  const accounts: { email: string; name: string; role: string }[] = [];
  const seen = new Set<string>();
  const dbGoogleAccounts: { email: string; name: string; role: string }[] = [];
  const knownNames: string[] = [];

  const dbReady = await isDbConnected();
  if (dbReady && prisma) {
    const dbUsers = await prisma.user.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    for (const u of dbUsers) {
      knownNames.push(u.name);
      const emailLower = u.email.toLowerCase();
      if (SEED_OR_TEST_EMAILS.has(emailLower)) continue;
      const meta = userProfileMeta.get(emailLower);
      if (meta?.authProvider === 'google' || emailLower.endsWith('@gmail.com')) {
        dbGoogleAccounts.push({
          email: emailLower,
          name: u.name,
          role: u.role,
        });
      }
    }
  } else {
    const sortedMem = [...memoryUsers].sort((a, b) =>
      b.lastLoginAt.localeCompare(a.lastLoginAt)
    );
    for (const u of sortedMem) {
      knownNames.push(u.name);
      const emailLower = u.email.toLowerCase();
      if (SEED_OR_TEST_EMAILS.has(emailLower)) continue;
      const meta = userProfileMeta.get(emailLower);
      if (
        meta?.authProvider === 'google' ||
        u.authProvider === 'google' ||
        emailLower.endsWith('@gmail.com')
      ) {
        dbGoogleAccounts.push({
          email: emailLower,
          name: u.name,
          role: u.role,
        });
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    const gitIdentity = getLocalGitIdentity(knownNames);
    if (
      gitIdentity &&
      gitIdentity.email.endsWith('@gmail.com') &&
      !SEED_OR_TEST_EMAILS.has(gitIdentity.email)
    ) {
      const existingRole =
        dbGoogleAccounts.find((a) => a.email === gitIdentity.email)?.role ||
        'CUSTOMER';
      seen.add(gitIdentity.email);
      accounts.push({
        email: gitIdentity.email,
        name: gitIdentity.name,
        role: existingRole,
      });
    }
  }

  for (const acc of dbGoogleAccounts) {
    if (!seen.has(acc.email)) {
      seen.add(acc.email);
      accounts.push(acc);
    }
  }

  res.json({
    account: accounts[0] || null,
    accounts,
  });
});

router.post('/auth/google', async (req: Request, res: Response) => {
  const rawEmail =
    typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
  const rawName =
    typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!rawEmail.includes('@') || rawEmail.length < 5) {
    res.status(400).json({ error: 'Valid Google account email is required.' });
    return;
  }

  const displayName =
    rawName.length >= 2
      ? rawName
      : rawEmail
          .split('@')[0]
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const nowIso = new Date().toISOString();
  const prevMeta = userProfileMeta.get(rawEmail) || {};
  userProfileMeta.set(rawEmail, {
    ...prevMeta,
    authProvider: 'google',
    lastLoginAt: nowIso,
  });
  persistUserProfileMeta();

  const dbReady = await isDbConnected();
  if (dbReady && prisma) {
    let user = await prisma.user.findUnique({ where: { email: rawEmail } });
    if (!user) {
      const randomHash = await bcrypt.hash(
        `google_oauth_${Date.now()}_${rawEmail}`,
        10
      );
      user = await prisma.user.create({
        data: {
          email: rawEmail,
          name: displayName,
          passwordHash: randomHash,
          role: 'CUSTOMER',
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(rawName.length >= 2 ? { name: rawName } : {}),
          updatedAt: new Date(),
        },
      });
    }

    const token = signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: prevMeta.phone,
        address: prevMeta.address,
        city: prevMeta.city,
        state: prevMeta.state,
        zipCode: prevMeta.zipCode,
      },
    });
    return;
  }

  let localUser = memoryUsers.find((u) => u.email.toLowerCase() === rawEmail);
  if (!localUser) {
    const passwordHash = await bcrypt.hash(`google_${Date.now()}`, 10);
    localUser = {
      id: `google-cust-${Date.now()}`,
      email: rawEmail,
      name: displayName,
      passwordHash,
      role: 'CUSTOMER',
      authProvider: 'google',
      createdAt: nowIso,
      lastLoginAt: nowIso,
    };
    memoryUsers.push(localUser);
  } else {
    if (rawName.length >= 2) {
      localUser.name = rawName;
    }
    localUser.lastLoginAt = nowIso;
    localUser.authProvider = 'google';
  }

  const token = signAuthToken({
    userId: localUser.id,
    email: localUser.email,
    role: localUser.role,
    name: localUser.name,
  });
  res.json({
    token,
    user: {
      id: localUser.id,
      email: localUser.email,
      name: localUser.name,
      role: localUser.role,
      phone: localUser.phone,
      address: localUser.address,
      city: localUser.city,
      state: localUser.state,
      zipCode: localUser.zipCode,
    },
  });
});

/* -------------------------------------------------------------------------- */
/* Admin User Directory, Account Recovery/Password Control & Admin Credentials*/
/* -------------------------------------------------------------------------- */
router.get(
  '/users',
  authenticateJWT,
  requireRole(['ADMIN']),
  async (_req: Request, res: Response) => {
    const dbReady = await isDbConnected();
    if (dbReady && prisma) {
      const dbUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
      const dbOrders = await prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      const serialized = dbUsers.map((u) => {
        const emailLower = u.email.toLowerCase();
        const meta = userProfileMeta.get(emailLower);
        const matchingOrders = dbOrders.filter(
          (o) => o.customerEmail.toLowerCase() === emailLower
        );
        const authProvider =
          meta?.authProvider ||
          (emailLower.endsWith('@gmail.com') ? 'google' : 'email');
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          phone: meta?.phone || '',
          address: meta?.address || '',
          city: meta?.city || '',
          state: meta?.state || '',
          zipCode: meta?.zipCode || '',
          authProvider,
          currentPassword:
            meta?.plainPassword ||
            (authProvider === 'google'
              ? 'Google OAuth (no password set)'
              : 'Encrypted (set new password below)'),
          createdAt: u.createdAt.toISOString(),
          lastLoginAt: meta?.lastLoginAt || u.updatedAt.toISOString(),
          orderCount: matchingOrders.length,
          totalSpent: matchingOrders.reduce((sum, o) => sum + o.totalAmount, 0),
          orders: matchingOrders,
        };
      });
      res.json({ users: serialized });
      return;
    }

    res.json({
      users: memoryUsers.map((u) => serializeManagedUser(u)),
    });
  }
);

router.put(
  '/users/:id',
  authenticateJWT,
  requireRole(['ADMIN']),
  async (req: Request, res: Response) => {
    const targetId = paramStr(req.params.id);
    const body = req.body as {
      name?: string;
      email?: string;
      role?: UserRole;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      newPassword?: string;
    };

    const nextEmail = body.email?.trim().toLowerCase();
    const nextPassword = body.newPassword?.trim();
    if (nextPassword && nextPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const dbReady = await isDbConnected();
    if (dbReady && prisma) {
      const existing = await prisma.user.findUnique({ where: { id: targetId } });
      if (!existing) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }

      const updateData: {
        name?: string;
        email?: string;
        role?: UserRole;
        passwordHash?: string;
      } = {};
      if (body.name?.trim()) updateData.name = body.name.trim();
      if (nextEmail) updateData.email = nextEmail;
      if (body.role && ['ADMIN', 'EDITOR', 'CUSTOMER'].includes(body.role)) {
        updateData.role = body.role;
      }
      if (nextPassword) {
        updateData.passwordHash = await bcrypt.hash(nextPassword, 10);
      }

      const updated = await prisma.user.update({
        where: { id: targetId },
        data: updateData,
      });

      const metaKey = (nextEmail || updated.email).toLowerCase();
      const prevMeta = userProfileMeta.get(existing.email.toLowerCase()) || {};
      userProfileMeta.set(metaKey, {
        ...prevMeta,
        phone: body.phone ?? prevMeta.phone,
        address: body.address ?? prevMeta.address,
        city: body.city ?? prevMeta.city,
        state: body.state ?? prevMeta.state,
        zipCode: body.zipCode ?? prevMeta.zipCode,
        ...(nextPassword ? { plainPassword: nextPassword } : {}),
      });
      persistUserProfileMeta();

      res.json({
        user: serializeManagedUser({
          id: updated.id,
          email: updated.email,
          name: updated.name,
          passwordHash: '',
          role: updated.role,
          authProvider: prevMeta.authProvider || 'email',
          createdAt: updated.createdAt.toISOString(),
          lastLoginAt: prevMeta.lastLoginAt || updated.updatedAt.toISOString(),
        }),
      });
      return;
    }

    const userRecord = memoryUsers.find((u) => u.id === targetId);
    if (!userRecord) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    if (body.name?.trim()) userRecord.name = body.name.trim();
    if (nextEmail) userRecord.email = nextEmail;
    if (body.role && ['ADMIN', 'EDITOR', 'CUSTOMER'].includes(body.role)) {
      userRecord.role = body.role;
    }
    if (typeof body.phone === 'string') userRecord.phone = body.phone.trim();
    if (typeof body.address === 'string') userRecord.address = body.address.trim();
    if (typeof body.city === 'string') userRecord.city = body.city.trim();
    if (typeof body.state === 'string') userRecord.state = body.state.trim();
    if (typeof body.zipCode === 'string') userRecord.zipCode = body.zipCode.trim();
    if (nextPassword) {
      userRecord.passwordHash = await bcrypt.hash(nextPassword, 10);
    }

    const prevMemMeta = userProfileMeta.get(userRecord.email.toLowerCase()) || {};
    userProfileMeta.set(userRecord.email.toLowerCase(), {
      ...prevMemMeta,
      phone: userRecord.phone,
      address: userRecord.address,
      city: userRecord.city,
      state: userRecord.state,
      zipCode: userRecord.zipCode,
      authProvider: userRecord.authProvider,
      ...(nextPassword ? { plainPassword: nextPassword } : {}),
      lastLoginAt: userRecord.lastLoginAt,
    });
    persistUserProfileMeta();

    res.json({ user: serializeManagedUser(userRecord) });
  }
);

router.put(
  '/admin/credentials',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const body = req.body as {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    const nextEmail = body.email?.trim().toLowerCase();
    const nextName = body.name?.trim();
    const nextPassword = body.newPassword?.trim();

    if (nextEmail && (!nextEmail.includes('@') || nextEmail.length < 5)) {
      res.status(400).json({ error: 'Please provide a valid admin email address.' });
      return;
    }
    if (nextPassword && nextPassword.length < 6) {
      res.status(400).json({ error: 'New admin password must be at least 6 characters.' });
      return;
    }

    const dbReady = await isDbConnected();
    if (dbReady && prisma) {
      const dbUser = await prisma.user.findUnique({ where: { id: authUser.userId } });
      if (!dbUser) {
        res.status(404).json({ error: 'Admin user record not found.' });
        return;
      }
      if (
        body.currentPassword &&
        !(await bcrypt.compare(body.currentPassword, dbUser.passwordHash))
      ) {
        res.status(401).json({ error: 'Current password did not match.' });
        return;
      }

      const passwordHash = nextPassword
        ? await bcrypt.hash(nextPassword, 10)
        : dbUser.passwordHash;
      const updated = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          email: nextEmail || dbUser.email,
          name: nextName || dbUser.name,
          passwordHash,
        },
      });

      const prevMeta = userProfileMeta.get(dbUser.email.toLowerCase()) || {};
      userProfileMeta.set(updated.email.toLowerCase(), {
        ...prevMeta,
        ...(nextPassword ? { plainPassword: nextPassword } : {}),
        lastLoginAt: new Date().toISOString(),
      });
      persistUserProfileMeta();

      const token = signAuthToken({
        userId: updated.id,
        email: updated.email,
        role: updated.role,
        name: updated.name,
      });
      res.json({
        token,
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          role: updated.role,
        },
      });
      return;
    }

    const memUser =
      memoryUsers.find((u) => u.id === authUser.userId) ||
      memoryUsers.find(
        (u) => u.email.toLowerCase() === authUser.email.toLowerCase()
      );
    if (!memUser) {
      res.status(404).json({ error: 'Admin account not found in memory store.' });
      return;
    }

    if (
      body.currentPassword &&
      !(await bcrypt.compare(body.currentPassword, memUser.passwordHash))
    ) {
      res.status(401).json({ error: 'Current password did not match.' });
      return;
    }

    if (nextEmail) memUser.email = nextEmail;
    if (nextName) memUser.name = nextName;
    if (nextPassword) memUser.passwordHash = await bcrypt.hash(nextPassword, 10);

    const token = signAuthToken({
      userId: memUser.id,
      email: memUser.email,
      role: memUser.role,
      name: memUser.name,
    });
    res.json({
      token,
      user: {
        id: memUser.id,
        email: memUser.email,
        name: memUser.name,
        role: memUser.role,
      },
    });
  }
);

router.get(
  '/settings/roles',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  async (_req: Request, res: Response) => {
    const dbReady = await isDbConnected();
    if (dbReady && prisma) {
      const saved = await prisma.pageSection.findUnique({
        where: { id: 'site-role-permissions' },
      });
      if (saved?.contentJson && typeof saved.contentJson === 'object') {
        const json = saved.contentJson as Partial<typeof memoryRolePermissions>;
        res.json({
          permissions: {
            editorTabs: Array.isArray(json.editorTabs)
              ? json.editorTabs.filter((t) => VALID_ADMIN_TABS.has(t))
              : memoryRolePermissions.editorTabs,
            userTabOverrides:
              json.userTabOverrides && typeof json.userTabOverrides === 'object'
                ? json.userTabOverrides
                : memoryRolePermissions.userTabOverrides,
            updatedAt: json.updatedAt || memoryRolePermissions.updatedAt,
          },
        });
        return;
      }
    }
    res.json({ permissions: memoryRolePermissions });
  }
);

router.put(
  '/settings/roles',
  authenticateJWT,
  requireRole(['ADMIN']),
  async (req: Request, res: Response) => {
    const body = req.body as Partial<typeof memoryRolePermissions>;
    const cleanEditorTabs = Array.isArray(body.editorTabs)
      ? Array.from(
          new Set(body.editorTabs.filter((t) => VALID_ADMIN_TABS.has(t)))
        )
      : memoryRolePermissions.editorTabs;

    const cleanOverrides: Record<string, string[]> = {};
    if (body.userTabOverrides && typeof body.userTabOverrides === 'object') {
      for (const [emailKey, tabs] of Object.entries(body.userTabOverrides)) {
        if (Array.isArray(tabs)) {
          cleanOverrides[emailKey.trim().toLowerCase()] = Array.from(
            new Set(tabs.filter((t) => VALID_ADMIN_TABS.has(t)))
          );
        }
      }
    }

    memoryRolePermissions = {
      editorTabs: cleanEditorTabs,
      userTabOverrides: cleanOverrides,
      updatedAt: new Date().toISOString(),
    };
    persistRolePermissions();

    const dbReady = await isDbConnected();
    if (dbReady && prisma) {
      await prisma.pageSection.upsert({
        where: { id: 'site-role-permissions' },
        update: {
          contentJson: memoryRolePermissions as unknown as Prisma.InputJsonValue,
        },
        create: {
          id: 'site-role-permissions',
          pageSlug: 'settings',
          sectionType: 'NEWSLETTER',
          contentJson: memoryRolePermissions as unknown as Prisma.InputJsonValue,
          orderIndex: 100,
          isVisible: true,
        },
      });
    }

    res.json({ permissions: memoryRolePermissions });
  }
);

router.get('/settings/contact', async (_req: Request, res: Response) => {
  const dbReady = await isDbConnected();
  if (dbReady && prisma) {
    const saved = await prisma.pageSection.findUnique({
      where: { id: 'site-contact-settings' },
    });
    if (saved?.contentJson && typeof saved.contentJson === 'object') {
      res.json({
        settings: {
          ...memoryContactSettings,
          ...(saved.contentJson as Record<string, unknown>),
        },
      });
      return;
    }
  }
  res.json({ settings: memoryContactSettings });
});

router.put(
  '/settings/contact',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  async (req: Request, res: Response) => {
    const body = req.body as Partial<typeof memoryContactSettings>;
    memoryContactSettings = {
      whatsappNumber: body.whatsappNumber?.trim() || memoryContactSettings.whatsappNumber,
      supportPhone: body.supportPhone?.trim() || memoryContactSettings.supportPhone,
      adminEmail: body.adminEmail?.trim() || memoryContactSettings.adminEmail,
      storeAddress: body.storeAddress?.trim() || memoryContactSettings.storeAddress,
      whatsappGreeting:
        body.whatsappGreeting?.trim() || memoryContactSettings.whatsappGreeting,
      chatbotName: body.chatbotName?.trim() || memoryContactSettings.chatbotName,
      chatbotEnabled:
        typeof body.chatbotEnabled === 'boolean'
          ? body.chatbotEnabled
          : memoryContactSettings.chatbotEnabled,
      cookieBannerEnabled:
        typeof body.cookieBannerEnabled === 'boolean'
          ? body.cookieBannerEnabled
          : memoryContactSettings.cookieBannerEnabled,
      cookieBannerTitle:
        body.cookieBannerTitle?.trim() || memoryContactSettings.cookieBannerTitle,
      cookieBannerDescription:
        body.cookieBannerDescription?.trim() ||
        memoryContactSettings.cookieBannerDescription,
      cloudflareAnalyticsToken:
        typeof body.cloudflareAnalyticsToken === 'string'
          ? body.cloudflareAnalyticsToken.trim()
          : memoryContactSettings.cloudflareAnalyticsToken,
      cloudflareZoneDomain:
        body.cloudflareZoneDomain?.trim() || memoryContactSettings.cloudflareZoneDomain,
      googleClientId:
        typeof body.googleClientId === 'string'
          ? body.googleClientId.trim()
          : memoryContactSettings.googleClientId,
      updatedAt: new Date().toISOString(),
    };

    const dbReady = await isDbConnected();
    if (dbReady && prisma) {
      await prisma.pageSection.upsert({
        where: { id: 'site-contact-settings' },
        update: {
          contentJson: memoryContactSettings as unknown as Prisma.InputJsonValue,
        },
        create: {
          id: 'site-contact-settings',
          pageSlug: 'settings',
          sectionType: 'NEWSLETTER',
          contentJson: memoryContactSettings as unknown as Prisma.InputJsonValue,
          orderIndex: 99,
          isVisible: true,
        },
      });
    }

    const revalidation = await triggerFrontendRevalidation(
      ['settings'],
      ['/', '/shop', '/faq', '/contact']
    );
    res.json({ settings: memoryContactSettings, revalidation });
  }
);

/* -------------------------------------------------------------------------- */
/* Cloudflare R2 Direct Presigned Upload                                      */
/* -------------------------------------------------------------------------- */
router.post(
  '/upload/presigned',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  async (req: Request, res: Response) => {
    const parsed = PresignedUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid upload request payload',
        details: parsed.error.flatten(),
      });
      return;
    }

    try {
      const presigned = await createR2PresignedUpload(parsed.data);
      res.json(presigned);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Presigned upload failed',
      });
    }
  }
);

router.post(
  '/upload/direct',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  (req: Request, res: Response) => {
    const rawName =
      typeof req.query.filename === 'string' ? req.query.filename : 'asset.glb';
    const rawSlug =
      typeof req.query.productSlug === 'string'
        ? req.query.productSlug
        : 'catalog';
    const safeSlug =
      rawSlug
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 64) || 'catalog';
    const safeName =
      rawName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'asset.glb';

    const fileBuffer = Buffer.isBuffer(req.body)
      ? req.body
      : req.body
      ? Buffer.from(req.body)
      : Buffer.alloc(0);

    if (fileBuffer.length === 0) {
      res.status(400).json({ error: 'Uploaded file payload is empty.' });
      return;
    }

    const uploadDir = path.join(process.cwd(), 'uploads', safeSlug);
    fs.mkdirSync(uploadDir, { recursive: true });
    const storedName = `${Date.now()}-${safeName}`;
    fs.writeFileSync(path.join(uploadDir, storedName), fileBuffer);

    const host = req.get('host') || `localhost:${process.env.PORT || 4000}`;
    const publicCdnUrl = `${req.protocol}://${host}/uploads/${safeSlug}/${storedName}`;

    res.json({
      publicCdnUrl,
      mode: 'local-disk',
      bytes: fileBuffer.length,
    });
  }
);

/* -------------------------------------------------------------------------- */
/* Products & 3D Hotspots                                                     */
/* -------------------------------------------------------------------------- */
router.get('/products', async (req: Request, res: Response) => {
  const includeUnpublished = req.query.includeUnpublished === 'true';
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const collection =
    typeof req.query.collection === 'string' ? req.query.collection : undefined;

  const dbReady = await isDbConnected();
  if (dbReady && prisma) {
    const products = await prisma.product.findMany({
      where: {
        ...(includeUnpublished ? {} : { published: true }),
        ...(category ? { category } : {}),
        ...(collection ? { collectionSlug: collection } : {}),
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        variants: {
          include: {
            sizes: true,
          },
        },
        hotspots: {
          orderBy: { scrollPercentage: 'asc' },
        },
      },
    });
    res.json({ products });
    return;
  }

  let items = [...memoryStore.products];
  if (!includeUnpublished) items = items.filter((p) => p.published);
  if (category) items = items.filter((p) => p.category === category);
  if (collection) items = items.filter((p) => p.collectionSlug === collection);
  items.sort((a, b) => a.displayOrder - b.displayOrder);
  res.json({ products: items });
});

router.get('/products/:slug', async (req: Request, res: Response) => {
  const slug = paramStr(req.params.slug);
  const dbReady = await isDbConnected();
  if (dbReady && prisma) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: { include: { sizes: true } },
        hotspots: { orderBy: { scrollPercentage: 'asc' } },
      },
    });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ product });
    return;
  }

  const product = memoryStore.products.find((p) => p.slug === slug);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json({ product });
});

router.post(
  '/products',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  async (req: Request, res: Response) => {
    const parsed = ProductUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
      return;
    }

    const data = parsed.data;
    const dbReady = await isDbConnected();

    if (dbReady && prisma) {
      try {
        const created = await prisma.product.create({
          data: {
            slug: data.slug,
            name: data.name,
            tagline: data.tagline,
            description: data.description,
            richStoryHtml: data.richStoryHtml,
            basePrice: data.basePrice,
            category: data.category,
            collectionSlug: data.collectionSlug,
            isFeaturedHero: data.isFeaturedHero,
            displayOrder: data.displayOrder,
            published: data.published,
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
            ogImageUrl: data.ogImageUrl,
            keywords: data.keywords,
            specsJson: (data.specsJson ?? {}) as Prisma.InputJsonValue,
            ratingValue: data.ratingValue,
            reviewCount: data.reviewCount,
            variants: {
              create: data.variants.map((v) => ({
                colorName: v.colorName,
                skuPrefix: v.skuPrefix,
                primaryGlowHex: v.primaryGlowHex,
                secondaryAccentHex: v.secondaryAccentHex,
                glbModelUrl: v.glbModelUrl,
                posterImageUrl: v.posterImageUrl,
                galleryImages: v.galleryImages,
                altText: v.altText,
                sizes: {
                  create: v.sizes.map((s) => ({
                    sizeLabel: s.sizeLabel,
                    sku: s.sku,
                    stockCount: s.stockCount,
                  })),
                },
              })),
            },
            hotspots: {
              create: data.hotspots.map((h) => ({
                scrollPercentage: h.scrollPercentage,
                title: h.title,
                subtitle: h.subtitle,
                cameraPosition: h.cameraPosition as Prisma.InputJsonValue,
                cameraTarget: h.cameraTarget as Prisma.InputJsonValue,
              })),
            },
          },
          include: {
            variants: { include: { sizes: true } },
            hotspots: { orderBy: { scrollPercentage: 'asc' } },
          },
        });

        const revalidation = await triggerFrontendRevalidation(
          ['products', 'sitemap', `product-${created.slug}`],
          ['/', '/shop', `/product/${created.slug}`]
        );
        res.status(201).json({ product: created, revalidation });
        return;
      } catch (error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : 'Failed to create product',
        });
        return;
      }
    }

    if (memoryStore.products.some((p) => p.slug === data.slug)) {
      res.status(409).json({ error: `Product with slug "${data.slug}" already exists.` });
      return;
    }

    const created: SeedProduct = {
      id: `prod-${Date.now()}`,
      ...data,
      specsJson: data.specsJson ?? {},
      updatedAt: new Date().toISOString(),
      variants: data.variants.map((v, idx) => ({
        id: v.id || `var-${Date.now()}-${idx}`,
        ...v,
        sizes: v.sizes.map((s, sIdx) => ({
          id: s.id || `sz-${Date.now()}-${idx}-${sIdx}`,
          ...s,
        })),
      })),
      hotspots: data.hotspots.map((h, idx) => ({
        id: h.id || `hs-${Date.now()}-${idx}`,
        ...h,
      })),
    };

    memoryStore.products.push(created);
    const revalidation = await triggerFrontendRevalidation(
      ['products', 'sitemap', `product-${created.slug}`],
      ['/', '/shop', `/product/${created.slug}`]
    );
    res.status(201).json({ product: created, revalidation });
  }
);

router.put(
  '/products/:id',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  async (req: Request, res: Response) => {
    const id = paramStr(req.params.id);
    const parsed = ProductUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
      return;
    }

    const data = parsed.data;
    const dbReady = await isDbConnected();

    if (dbReady && prisma) {
      try {
        const updated = await prisma.$transaction(async (tx) => {
          const existingVariants = await tx.colorwayVariant.findMany({
            where: { productId: id },
            orderBy: { id: 'asc' },
          });

          await tx.sizeInventory.deleteMany({
            where: { variant: { productId: id } },
          });
          await tx.scrollHotspot.deleteMany({ where: { productId: id } });

          await tx.product.update({
            where: { id },
            data: {
              slug: data.slug,
              name: data.name,
              tagline: data.tagline,
              description: data.description,
              richStoryHtml: data.richStoryHtml,
              basePrice: data.basePrice,
              category: data.category,
              collectionSlug: data.collectionSlug,
              isFeaturedHero: data.isFeaturedHero,
              displayOrder: data.displayOrder,
              published: data.published,
              metaTitle: data.metaTitle,
              metaDescription: data.metaDescription,
              ogImageUrl: data.ogImageUrl,
              keywords: data.keywords,
              specsJson: (data.specsJson ?? {}) as Prisma.InputJsonValue,
              ratingValue: data.ratingValue,
              reviewCount: data.reviewCount,
            },
          });

          const usedVariantIds = new Set<string>();

          for (const v of data.variants) {
            const matched =
              (v.id
                ? existingVariants.find(
                    (ev) => ev.id === v.id && !usedVariantIds.has(ev.id)
                  )
                : undefined) ||
              existingVariants.find(
                (ev) =>
                  ev.skuPrefix === v.skuPrefix && !usedVariantIds.has(ev.id)
              ) ||
              existingVariants.find((ev) => !usedVariantIds.has(ev.id));

            if (matched) {
              usedVariantIds.add(matched.id);
              await tx.colorwayVariant.update({
                where: { id: matched.id },
                data: {
                  colorName: v.colorName,
                  skuPrefix: v.skuPrefix,
                  primaryGlowHex: v.primaryGlowHex,
                  secondaryAccentHex: v.secondaryAccentHex,
                  glbModelUrl: v.glbModelUrl,
                  posterImageUrl: v.posterImageUrl,
                  galleryImages: v.galleryImages,
                  altText: v.altText,
                  sizes: {
                    create: v.sizes.map((s) => ({
                      sizeLabel: s.sizeLabel,
                      sku: s.sku,
                      stockCount: s.stockCount,
                    })),
                  },
                },
              });
            } else {
              await tx.colorwayVariant.create({
                data: {
                  productId: id,
                  colorName: v.colorName,
                  skuPrefix: v.skuPrefix,
                  primaryGlowHex: v.primaryGlowHex,
                  secondaryAccentHex: v.secondaryAccentHex,
                  glbModelUrl: v.glbModelUrl,
                  posterImageUrl: v.posterImageUrl,
                  galleryImages: v.galleryImages,
                  altText: v.altText,
                  sizes: {
                    create: v.sizes.map((s) => ({
                      sizeLabel: s.sizeLabel,
                      sku: s.sku,
                      stockCount: s.stockCount,
                    })),
                  },
                },
              });
            }
          }

          for (const ev of existingVariants) {
            if (usedVariantIds.has(ev.id)) continue;
            const orderCount = await tx.orderItem.count({
              where: { variantId: ev.id },
            });
            if (orderCount === 0) {
              await tx.colorwayVariant.delete({ where: { id: ev.id } });
            }
          }

          if (data.hotspots.length > 0) {
            await tx.scrollHotspot.createMany({
              data: data.hotspots.map((h) => ({
                productId: id,
                scrollPercentage: h.scrollPercentage,
                title: h.title,
                subtitle: h.subtitle,
                cameraPosition: h.cameraPosition as Prisma.InputJsonValue,
                cameraTarget: h.cameraTarget as Prisma.InputJsonValue,
              })),
            });
          }

          return tx.product.findUniqueOrThrow({
            where: { id },
            include: {
              variants: { include: { sizes: true } },
              hotspots: { orderBy: { scrollPercentage: 'asc' } },
            },
          });
        });

        const revalidation = await triggerFrontendRevalidation(
          ['products', 'sitemap', `product-${updated.slug}`],
          ['/', '/shop', `/product/${updated.slug}`]
        );
        res.json({ product: updated, revalidation });
        return;
      } catch (error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : 'Failed to update product',
        });
        return;
      }
    }

    const index = memoryStore.products.findIndex((p) => p.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const updated: SeedProduct = {
      id,
      ...data,
      specsJson: data.specsJson ?? {},
      updatedAt: new Date().toISOString(),
      variants: data.variants.map((v, idx) => ({
        id: v.id || `var-${Date.now()}-${idx}`,
        ...v,
        sizes: v.sizes.map((s, sIdx) => ({
          id: s.id || `sz-${Date.now()}-${idx}-${sIdx}`,
          ...s,
        })),
      })),
      hotspots: data.hotspots.map((h, idx) => ({
        id: h.id || `hs-${Date.now()}-${idx}`,
        ...h,
      })),
    };

    memoryStore.products[index] = updated;
    const revalidation = await triggerFrontendRevalidation(
      ['products', 'sitemap', `product-${updated.slug}`],
      ['/', '/shop', `/product/${updated.slug}`]
    );
    res.json({ product: updated, revalidation });
  }
);

router.delete(
  '/products/:id',
  authenticateJWT,
  requireRole(['ADMIN']),
  async (req: Request, res: Response) => {
    const id = paramStr(req.params.id);
    const dbReady = await isDbConnected();

    if (dbReady && prisma) {
      try {
        await prisma.orderItem.deleteMany({
          where: { variant: { productId: id } },
        });
        const deleted = await prisma.product.delete({ where: { id } });
        const revalidation = await triggerFrontendRevalidation(
          ['products', 'sitemap', `product-${deleted.slug}`],
          ['/', '/shop']
        );
        res.json({ deletedId: id, revalidation });
        return;
      } catch {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
    }

    const existing = memoryStore.products.find((p) => p.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    memoryStore.products = memoryStore.products.filter((p) => p.id !== id);
    const revalidation = await triggerFrontendRevalidation(
      ['products', 'sitemap', `product-${existing.slug}`],
      ['/', '/shop']
    );
    res.json({ deletedId: id, revalidation });
  }
);

router.put(
  '/products/:id/hotspots',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  async (req: Request, res: Response) => {
    const id = paramStr(req.params.id);
    const parsed = HotspotBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid hotspot payload',
        details: parsed.error.flatten(),
      });
      return;
    }

    const sortedHotspots = [...parsed.data.hotspots].sort(
      (a, b) => a.scrollPercentage - b.scrollPercentage
    );
    const dbReady = await isDbConnected();

    if (dbReady && prisma) {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      const updatedHotspots = await prisma.$transaction(async (tx) => {
        await tx.scrollHotspot.deleteMany({ where: { productId: id } });
        await tx.scrollHotspot.createMany({
          data: sortedHotspots.map((h) => ({
            productId: id,
            scrollPercentage: h.scrollPercentage,
            title: h.title,
            subtitle: h.subtitle,
            cameraPosition: h.cameraPosition as Prisma.InputJsonValue,
            cameraTarget: h.cameraTarget as Prisma.InputJsonValue,
          })),
        });
        return tx.scrollHotspot.findMany({
          where: { productId: id },
          orderBy: { scrollPercentage: 'asc' },
        });
      });

      const revalidation = await triggerFrontendRevalidation(
        ['products', `product-${product.slug}`],
        ['/', `/product/${product.slug}`]
      );
      res.json({ hotspots: updatedHotspots, revalidation });
      return;
    }

    const product = memoryStore.products.find((p) => p.id === id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    product.hotspots = sortedHotspots.map((h, idx) => ({
      id: h.id || `hs-${Date.now()}-${idx}`,
      scrollPercentage: h.scrollPercentage,
      title: h.title,
      subtitle: h.subtitle,
      cameraPosition: h.cameraPosition,
      cameraTarget: h.cameraTarget,
    }));
    product.updatedAt = new Date().toISOString();

    const revalidation = await triggerFrontendRevalidation(
      ['products', `product-${product.slug}`],
      ['/', `/product/${product.slug}`]
    );
    res.json({ hotspots: product.hotspots, revalidation });
  }
);

/* -------------------------------------------------------------------------- */
/* Inventory Matrix                                                           */
/* -------------------------------------------------------------------------- */
router.put(
  '/inventory/:sku',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  async (req: Request, res: Response) => {
    const sku = paramStr(req.params.sku);
    const parsed = InventoryUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid stockCount value' });
      return;
    }

    const dbReady = await isDbConnected();
    if (dbReady && prisma) {
      try {
        const updated = await prisma.sizeInventory.update({
          where: { sku },
          data: { stockCount: parsed.data.stockCount },
        });
        const revalidation = await triggerFrontendRevalidation(['products']);
        res.json({ inventory: updated, revalidation });
        return;
      } catch {
        res.status(404).json({ error: `SKU "${sku}" not found` });
        return;
      }
    }

    for (const product of memoryStore.products) {
      for (const variant of product.variants) {
        const sizeItem = variant.sizes.find((s) => s.sku === sku);
        if (sizeItem) {
          sizeItem.stockCount = parsed.data.stockCount;
          const revalidation = await triggerFrontendRevalidation([
            'products',
            `product-${product.slug}`,
          ]);
          res.json({ inventory: sizeItem, revalidation });
          return;
        }
      }
    }

    res.status(404).json({ error: `SKU "${sku}" not found` });
  }
);

/* -------------------------------------------------------------------------- */
/* CMS Page Sections                                                          */
/* -------------------------------------------------------------------------- */
router.get('/cms/:pageSlug', async (req: Request, res: Response) => {
  const pageSlug = paramStr(req.params.pageSlug);
  const dbReady = await isDbConnected();

  if (dbReady && prisma) {
    const sections = await prisma.pageSection.findMany({
      where: { pageSlug },
      orderBy: { orderIndex: 'asc' },
    });
    res.json({ sections });
    return;
  }

  const sections = memoryStore.pageSections
    .filter((s) => s.pageSlug === pageSlug)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  res.json({ sections });
});

router.put(
  '/cms/:pageSlug',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  async (req: Request, res: Response) => {
    const pageSlug = paramStr(req.params.pageSlug);
    const parsed = PageSectionUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid CMS page sections payload',
        details: parsed.error.flatten(),
      });
      return;
    }

    const dbReady = await isDbConnected();
    if (dbReady && prisma) {
      const updated = await prisma.$transaction(async (tx) => {
        await tx.pageSection.deleteMany({ where: { pageSlug } });
        await tx.pageSection.createMany({
          data: parsed.data.sections.map((s) => ({
            id: s.id,
            pageSlug,
            sectionType: s.sectionType,
            contentJson: s.contentJson as Prisma.InputJsonValue,
            orderIndex: s.orderIndex,
            isVisible: s.isVisible,
          })),
        });
        return tx.pageSection.findMany({
          where: { pageSlug },
          orderBy: { orderIndex: 'asc' },
        });
      });

      const revalidation = await triggerFrontendRevalidation(
        ['cms', 'faq'],
        ['/', '/faq']
      );
      res.json({ sections: updated, revalidation });
      return;
    }

    const otherSections = memoryStore.pageSections.filter(
      (s) => s.pageSlug !== pageSlug
    );
    const updatedSections = parsed.data.sections.map((s) => ({
      ...s,
      pageSlug,
      updatedAt: new Date().toISOString(),
    }));
    memoryStore.pageSections = [...otherSections, ...updatedSections];

    const revalidation = await triggerFrontendRevalidation(
      ['cms', 'faq'],
      ['/', '/faq']
    );
    res.json({
      sections: updatedSections.sort((a, b) => a.orderIndex - b.orderIndex),
      revalidation,
    });
  }
);

/* -------------------------------------------------------------------------- */
/* Site SEO Config                                                            */
/* -------------------------------------------------------------------------- */
router.get('/seo', async (_req: Request, res: Response) => {
  const dbReady = await isDbConnected();
  if (dbReady && prisma) {
    const config = await prisma.siteSeoConfig.findFirst();
    if (config) {
      res.json({ seoConfig: config });
      return;
    }
  }
  res.json({ seoConfig: memoryStore.seoConfig });
});

router.put(
  '/seo',
  authenticateJWT,
  requireRole(['ADMIN']),
  async (req: Request, res: Response) => {
    const parsed = SeoConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid SEO config payload',
        details: parsed.error.flatten(),
      });
      return;
    }

    const dbReady = await isDbConnected();
    if (dbReady && prisma) {
      const existing = await prisma.siteSeoConfig.findFirst();
      const seoConfig = existing
        ? await prisma.siteSeoConfig.update({
            where: { id: existing.id },
            data: {
              ...parsed.data,
              organizationSchemaJson:
                parsed.data.organizationSchemaJson as Prisma.InputJsonValue,
            },
          })
        : await prisma.siteSeoConfig.create({
            data: {
              ...parsed.data,
              organizationSchemaJson:
                parsed.data.organizationSchemaJson as Prisma.InputJsonValue,
            },
          });

      const revalidation = await triggerFrontendRevalidation(
        ['seo', 'sitemap'],
        ['/', '/shop', '/about', '/faq']
      );
      res.json({ seoConfig, revalidation });
      return;
    }

    memoryStore.seoConfig = {
      ...memoryStore.seoConfig,
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };
    const revalidation = await triggerFrontendRevalidation(
      ['seo', 'sitemap'],
      ['/', '/shop', '/about', '/faq']
    );
    res.json({ seoConfig: memoryStore.seoConfig, revalidation });
  }
);

/* -------------------------------------------------------------------------- */
/* Orders & Atomic Inventory Deduction                                        */
/* -------------------------------------------------------------------------- */
router.get(
  '/orders',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  async (_req: Request, res: Response) => {
    const dbReady = await isDbConnected();
    if (dbReady && prisma) {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });
      const normalizedOrders = orders.map((order) => ({
        ...order,
        items: order.items.map((item) => ({
          id: item.id,
          variantId: item.variantId,
          productName: item.variant?.product?.name,
          colorName: item.variant?.colorName,
          sizeSku: item.sizeSku,
          sizeLabel: item.sizeLabel,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      }));
      res.json({ orders: normalizedOrders });
      return;
    }

    res.json({ orders: memoryStore.orders });
  }
);

router.post(
  '/orders',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid order payload',
      details: parsed.error.flatten(),
    });
    return;
  }

  const data = parsed.data;
  const dbReady = await isDbConnected();

  if (dbReady && prisma) {
    try {
      const createdOrder = await prisma.$transaction(async (tx) => {
        let subtotal = 0;
        const resolvedItems: {
          variantId: string;
          sizeSku: string;
          sizeLabel: string;
          quantity: number;
          unitPrice: number;
        }[] = [];

        for (const item of data.items) {
          const variant = await tx.colorwayVariant.findUnique({
            where: { id: item.variantId },
            include: { product: true },
          });
          if (!variant) {
            throw new Error(`Variant ${item.variantId} not found`);
          }

          const sizeRow = await tx.sizeInventory.findUnique({
            where: { sku: item.sizeSku },
          });
          if (!sizeRow || sizeRow.variantId !== item.variantId) {
            throw new Error(`SKU ${item.sizeSku} not found for variant`);
          }
          if (sizeRow.stockCount < item.quantity) {
            throw new Error(
              `Insufficient inventory for ${variant.product.name} (${sizeRow.sizeLabel}). Remaining: ${sizeRow.stockCount}`
            );
          }

          // Atomic decrement with non-negative stock guard
          const updatedStock = await tx.sizeInventory.updateMany({
            where: {
              sku: item.sizeSku,
              stockCount: { gte: item.quantity },
            },
            data: {
              stockCount: { decrement: item.quantity },
            },
          });

          if (updatedStock.count === 0) {
            throw new Error(`Concurrent stock conflict on SKU ${item.sizeSku}`);
          }

          subtotal += variant.product.basePrice * item.quantity;
          resolvedItems.push({
            variantId: variant.id,
            sizeSku: item.sizeSku,
            sizeLabel: sizeRow.sizeLabel,
            quantity: item.quantity,
            unitPrice: variant.product.basePrice,
          });
        }

        const orderNumber = `AETH-${new Date().getFullYear()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;

        return tx.order.create({
          data: {
            orderNumber,
            status: data.stripePaymentIntentId ? 'PAID' : 'PENDING',
            customerEmail: data.customerEmail,
            customerName: data.customerName,
            shippingAddressJson:
              data.shippingAddressJson as Prisma.InputJsonValue,
            subtotal,
            totalAmount: subtotal,
            stripePaymentIntentId:
              data.stripePaymentIntentId || `pi_sim_${Date.now()}`,
            items: {
              create: resolvedItems,
            },
          },
          include: { items: true },
        });
      });

      const revalidation = await triggerFrontendRevalidation(['products']);
      res.status(201).json({ order: createdOrder, revalidation });
      return;
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Order creation failed',
      });
      return;
    }
  }

  // In-memory atomic verification & deduction
  let subtotal = 0;
  const resolvedItems: {
    id: string;
    variantId: string;
    productName: string;
    colorName: string;
    sizeSku: string;
    sizeLabel: string;
    quantity: number;
    unitPrice: number;
  }[] = [];

  for (const reqItem of data.items) {
    let matchedProduct: SeedProduct | undefined;
    let matchedVariant: SeedProduct['variants'][number] | undefined;

    for (const prod of memoryStore.products) {
      const v = prod.variants.find((variant) => variant.id === reqItem.variantId);
      if (v) {
        matchedProduct = prod;
        matchedVariant = v;
        break;
      }
    }

    if (!matchedProduct || !matchedVariant) {
      res.status(400).json({ error: `Variant ${reqItem.variantId} not found.` });
      return;
    }

    const sizeRow = matchedVariant.sizes.find((s) => s.sku === reqItem.sizeSku);
    if (!sizeRow) {
      res.status(400).json({ error: `SKU ${reqItem.sizeSku} not found.` });
      return;
    }

    if (sizeRow.stockCount < reqItem.quantity) {
      res.status(400).json({
        error: `Insufficient stock for ${matchedProduct.name} (${sizeRow.sizeLabel}). Remaining: ${sizeRow.stockCount}`,
      });
      return;
    }

    sizeRow.stockCount -= reqItem.quantity;
    subtotal += matchedProduct.basePrice * reqItem.quantity;
    resolvedItems.push({
      id: `oi-${Date.now()}-${resolvedItems.length}`,
      variantId: matchedVariant.id,
      productName: matchedProduct.name,
      colorName: matchedVariant.colorName,
      sizeSku: sizeRow.sku,
      sizeLabel: sizeRow.sizeLabel,
      quantity: reqItem.quantity,
      unitPrice: matchedProduct.basePrice,
    });
  }

  const order = {
    id: `ord-${Date.now()}`,
    orderNumber: `AETH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    status: (data.stripePaymentIntentId ? 'PAID' : 'PENDING') as 'PAID' | 'PENDING',
    customerEmail: data.customerEmail,
    customerName: data.customerName,
    shippingAddressJson: data.shippingAddressJson,
    subtotal,
    totalAmount: subtotal,
    stripePaymentIntentId: data.stripePaymentIntentId || `pi_sim_${Date.now()}`,
    createdAt: new Date().toISOString(),
    items: resolvedItems,
  };

  memoryStore.orders.unshift(order);
  const revalidation = await triggerFrontendRevalidation(['products']);
  res.status(201).json({ order, revalidation });
});

router.patch(
  '/orders/:id/status',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  async (req: Request, res: Response) => {
    const id = paramStr(req.params.id);
    const parsed = OrderStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid order status' });
      return;
    }

    const dbReady = await isDbConnected();
    if (dbReady && prisma) {
      try {
        const order = await prisma.order.update({
          where: { id },
          data: { status: parsed.data.status },
          include: { items: true },
        });
        res.json({ order });
        return;
      } catch {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
    }

    const order = memoryStore.orders.find((o) => o.id === id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    order.status = parsed.data.status;
    res.json({ order });
  }
);

/* -------------------------------------------------------------------------- */
/* Editorial Journal / Blogs CRUD                                             */
/* -------------------------------------------------------------------------- */
async function seedBlogsInDbIfEmpty() {
  if (!prisma) return;
  const count = await prisma.pageSection.count({
    where: { pageSlug: 'blog' },
  });
  if (count === 0) {
    await prisma.pageSection.createMany({
      data: memoryStore.blogs.map((blog, idx) => ({
        id: blog.id,
        pageSlug: 'blog',
        sectionType: 'STATEMENT_BANNER',
        contentJson: blog as unknown as Prisma.InputJsonValue,
        orderIndex: idx,
        isVisible: blog.published,
      })),
      skipDuplicates: true,
    });
  }
}

router.get('/blogs', async (req: Request, res: Response) => {
  const includeUnpublished = req.query.includeUnpublished === 'true';
  const dbReady = await isDbConnected();

  if (dbReady && prisma) {
    const rows = await prisma.pageSection.findMany({
      where: {
        pageSlug: 'blog',
        ...(includeUnpublished ? {} : { isVisible: true }),
      },
      orderBy: { orderIndex: 'asc' },
    });

    if (rows.length > 0) {
      const blogs = rows.map(
        (r) => r.contentJson as unknown as SeedBlogPost
      );
      res.json({ blogs });
      return;
    }
  }

  const blogs = includeUnpublished
    ? memoryStore.blogs
    : memoryStore.blogs.filter((b) => b.published);
  res.json({ blogs });
});

router.get('/blogs/:slug', async (req: Request, res: Response) => {
  const slug = paramStr(req.params.slug);
  const dbReady = await isDbConnected();

  if (dbReady && prisma) {
    const rows = await prisma.pageSection.findMany({
      where: { pageSlug: 'blog' },
      orderBy: { orderIndex: 'asc' },
    });
    if (rows.length > 0) {
      const match = rows
        .map((r) => r.contentJson as unknown as SeedBlogPost)
        .find((b) => b.slug === slug);
      if (match) {
        res.json({ blog: match });
        return;
      }
      res.status(404).json({ error: 'Article not found.' });
      return;
    }
  }

  const match = memoryStore.blogs.find((b) => b.slug === slug);
  if (!match) {
    res.status(404).json({ error: 'Article not found.' });
    return;
  }
  res.json({ blog: match });
});

router.post(
  '/blogs',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  async (req: Request, res: Response) => {
    const body = req.body as Partial<SeedBlogPost>;
    if (!body?.title || !body?.slug) {
      res.status(400).json({ error: 'Blog title and slug are required.' });
      return;
    }

    const blog: SeedBlogPost = {
      id: body.id || `blog-${Date.now()}`,
      slug: body.slug,
      title: body.title,
      subtitle: body.subtitle || '',
      excerpt: body.excerpt || '',
      category: body.category || 'Workshop Notes',
      author: body.author || 'Atelier Vance Editorial',
      authorRole: body.authorRole || 'Footwear Desk',
      publishedAt: body.publishedAt || new Date().toISOString().slice(0, 10),
      readTime: body.readTime || '4 min read',
      coverImage: body.coverImage || '/images/shoes/espresso-hightop.png',
      relatedProductSlug: body.relatedProductSlug || 'heritage-mocha-hightop',
      tags: Array.isArray(body.tags) ? body.tags : [],
      sections: Array.isArray(body.sections) ? body.sections : [],
      published: body.published !== false,
      featured: Boolean(body.featured),
    };

    const existingIdx = memoryStore.blogs.findIndex((b) => b.id === blog.id);
    if (existingIdx >= 0) {
      memoryStore.blogs[existingIdx] = blog;
    } else {
      memoryStore.blogs.unshift(blog);
    }

    const dbReady = await isDbConnected();
    if (dbReady && prisma) {
      await seedBlogsInDbIfEmpty();
      await prisma.pageSection.upsert({
        where: { id: blog.id },
        update: {
          contentJson: blog as unknown as Prisma.InputJsonValue,
          isVisible: blog.published,
        },
        create: {
          id: blog.id,
          pageSlug: 'blog',
          sectionType: 'STATEMENT_BANNER',
          contentJson: blog as unknown as Prisma.InputJsonValue,
          orderIndex: 0,
          isVisible: blog.published,
        },
      });
    }

    const revalidation = await triggerFrontendRevalidation(
      ['blogs'],
      ['/blog', `/blog/${blog.slug}`]
    );
    res.status(201).json({ blog, revalidation });
  }
);

router.put(
  '/blogs/:id',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  async (req: Request, res: Response) => {
    const id = paramStr(req.params.id);
    const body = req.body as Partial<SeedBlogPost>;
    if (!body?.title || !body?.slug) {
      res.status(400).json({ error: 'Blog title and slug are required.' });
      return;
    }

    const blog: SeedBlogPost = {
      id,
      slug: body.slug,
      title: body.title,
      subtitle: body.subtitle || '',
      excerpt: body.excerpt || '',
      category: body.category || 'Workshop Notes',
      author: body.author || 'Atelier Vance Editorial',
      authorRole: body.authorRole || 'Footwear Desk',
      publishedAt: body.publishedAt || new Date().toISOString().slice(0, 10),
      readTime: body.readTime || '4 min read',
      coverImage: body.coverImage || '/images/shoes/espresso-hightop.png',
      relatedProductSlug: body.relatedProductSlug || 'heritage-mocha-hightop',
      tags: Array.isArray(body.tags) ? body.tags : [],
      sections: Array.isArray(body.sections) ? body.sections : [],
      published: body.published !== false,
      featured: Boolean(body.featured),
    };

    const idx = memoryStore.blogs.findIndex((b) => b.id === id);
    if (idx >= 0) {
      memoryStore.blogs[idx] = blog;
    } else {
      memoryStore.blogs.push(blog);
    }

    const dbReady = await isDbConnected();
    if (dbReady && prisma) {
      await seedBlogsInDbIfEmpty();
      await prisma.pageSection.upsert({
        where: { id },
        update: {
          contentJson: blog as unknown as Prisma.InputJsonValue,
          isVisible: blog.published,
        },
        create: {
          id,
          pageSlug: 'blog',
          sectionType: 'STATEMENT_BANNER',
          contentJson: blog as unknown as Prisma.InputJsonValue,
          orderIndex: idx >= 0 ? idx : memoryStore.blogs.length,
          isVisible: blog.published,
        },
      });
    }

    const revalidation = await triggerFrontendRevalidation(
      ['blogs'],
      ['/blog', `/blog/${blog.slug}`]
    );
    res.json({ blog, revalidation });
  }
);

router.delete(
  '/blogs/:id',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  async (req: Request, res: Response) => {
    const id = paramStr(req.params.id);
    memoryStore.blogs = memoryStore.blogs.filter((b) => b.id !== id);

    const dbReady = await isDbConnected();
    if (dbReady && prisma) {
      await prisma.pageSection.deleteMany({
        where: { id, pageSlug: 'blog' },
      });
    }

    const revalidation = await triggerFrontendRevalidation(['blogs'], ['/blog']);
    res.json({ deletedId: id, revalidation });
  }
);

export default router;

