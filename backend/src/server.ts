import './config/env';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.routes';

const app = express();
app.set('trust proxy', true);
const PORT = Number(process.env.PORT || 4000);

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  'http://localhost:3000,https://atelier-vance-storefront.vercel.app'
)
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.workers.dev') ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.trycloudflare.com')
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-revalidate-secret',
      'CF-Connecting-IP',
      'CF-IPCountry',
      'CF-Ray',
    ],
  })
);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(
  '/api/v1/upload/direct',
  express.raw({ type: () => true, limit: '35mb' })
);
app.use(express.json({ limit: '4mb' }));
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Atelier-Edge-Ready', 'cloudflare');
  next();
});
app.use('/api/v1', apiRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'AETHER LABS Headless 3D E-Commerce API',
    version: '1.0.0',
    docs: '/api/v1/health',
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api-error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[aether-backend] Listening on http://localhost:${PORT}/api/v1`);
});

export default app;

