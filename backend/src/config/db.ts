import './env';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const rawConnectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  '';

function normalizeWsConnectionString(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    // @neondatabase/serverless WebSocket tunnel does not expose raw TCP tls-server-end-point channel binding
    parsed.searchParams.delete('channel_binding');
    return parsed.toString();
  } catch {
    return urlString;
  }
}

const hasValidDatabaseUrl =
  rawConnectionString.startsWith('postgres') &&
  !rawConnectionString.includes('user:pass@ep-cool-darkness');

let prismaInstance: PrismaClient | null = null;

if (hasValidDatabaseUrl) {
  const connectionString = normalizeWsConnectionString(rawConnectionString);
  const adapter = new PrismaNeon({ connectionString });
  prismaInstance = new PrismaClient({ adapter });
}

export const prisma = prismaInstance;

export async function isDbConnected(): Promise<boolean> {
  if (!prisma) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    console.error('[db] Neon connection check failed:', err);
    return false;
  }
}
