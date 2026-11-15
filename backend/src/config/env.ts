import path from 'path';
import dotenv from 'dotenv';

// Load backend/.env, root .env.local, and root .env cleanly regardless of working directory
const candidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '../.env.local'),
  path.resolve(process.cwd(), '../.env'),
];

for (const envPath of candidates) {
  dotenv.config({ path: envPath, override: false });
}

