import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type UserRole = 'ADMIN' | 'EDITOR' | 'CUSTOMER';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export const JWT_SECRET =
  process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';

export function signAuthToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing Bearer token' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();

  // Allow deterministic dev token when NODE_ENV !== 'production' for seamless local Admin CMS evaluation
  if (
    process.env.NODE_ENV !== 'production' &&
    token === 'aether-dev-admin-token'
  ) {
    req.user = {
      userId: 'dev-admin-01',
      email: 'admin@aetherfootwear.com',
      role: 'ADMIN',
      name: 'Studio Director',
    };
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired JWT token' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Requires role ${allowedRoles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}

