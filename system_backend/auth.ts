import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

let JWT_SECRET: string | null = null;
const JWT_ACCESS_EXPIRES = '15m';
const JWT_REFRESH_EXPIRES = '7d';
const BCRYPT_ROUNDS = 12;

if (process.env.JWT_SECRET) {
  JWT_SECRET = process.env.JWT_SECRET;
} else if (process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET environment variable is required in production');
  process.exit(1);
} else {
  const devSecret = `dev-secret-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  JWT_SECRET = devSecret;
  console.warn('⚠️ WARNING: JWT_SECRET not set. Using a random dev-only secret. All sessions will be invalidated on restart.');
}

export interface AuthUser {
  userId: number;
  email: string;
  role: 'super_admin' | 'admin' | 'agent' | 'claim_staff';
  companyId: number | null;
  firstName: string;
  lastName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// In-memory token blacklist (in production, use Redis)
const tokenBlacklist = new Set<string>();

export function blacklistToken(token: string): void {
  tokenBlacklist.add(token);
}

export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(user: AuthUser): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
}

export function generateRefreshToken(user: AuthUser): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.sign(
    { userId: user.userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES }
  );
}

export function verifyToken(token: string): AuthUser {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  return decoded as AuthUser;
}

export function verifyRefreshToken(token: string): { userId: number; type: string } {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return decoded;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie('access_token', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refresh_token', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', { ...COOKIE_OPTIONS });
  res.clearCookie('refresh_token', { ...COOKIE_OPTIONS });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  let token: string | null = null;

  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.slice(7);
  }

  if (!token) {
    const cookies = (req as any).cookies;
    if (cookies?.access_token) {
      token = cookies.access_token;
    }
    if (!token && req.headers.cookie) {
      const rawMatch = req.headers.cookie.match(/access_token=([^;]+)/);
      if (rawMatch) {
        token = decodeURIComponent(rawMatch[1]);
      }
    }
  }

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  if (isTokenBlacklisted(token)) {
    res.status(401).json({ error: 'Token has been revoked' });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

const ENTITY_ROLES: Record<string, string[]> = {
  // Company admin
  'companies': ['admin', 'super_admin'],
  'company': ['admin', 'agent', 'claim_staff', 'super_admin'],
  'subscription-plans': ['super_admin'],
  'subscription_plans': ['super_admin'],
  'subscription_invoices': ['super_admin'],
  'invoices': ['super_admin'],

  // Admin only
  'branches': ['admin', 'super_admin'],
  'branch': ['admin', 'super_admin'],
  'branches-with-stats': ['admin', 'super_admin'],
  'companies-with-stats': ['super_admin'],
  'settings': ['admin', 'super_admin'],

  // Admin + agent
  'customers': ['admin', 'agent', 'super_admin'],
  'customer': ['admin', 'agent', 'super_admin'],
  'quotes': ['admin', 'agent', 'super_admin'],
  'quote': ['admin', 'agent', 'super_admin'],
  'policies': ['admin', 'agent', 'super_admin'],
  'policy': ['admin', 'agent', 'super_admin'],
  'payments': ['admin', 'agent', 'super_admin'],
  'payment': ['admin', 'agent', 'super_admin'],
  'payment-schedules': ['admin', 'agent', 'super_admin'],
  'payment_schedules': ['admin', 'agent', 'super_admin'],
  'commissions': ['admin', 'agent', 'super_admin'],
  'agent_commissions': ['admin', 'agent', 'super_admin'],
  'agent-performance': ['admin', 'agent', 'super_admin'],
  'agent_performance': ['admin', 'agent', 'super_admin'],
  'documents': ['admin', 'agent', 'claim_staff', 'super_admin'],
  'document': ['admin', 'agent', 'claim_staff', 'super_admin'],
  'notifications': ['admin', 'agent', 'claim_staff', 'super_admin'],
  'notification': ['admin', 'agent', 'claim_staff', 'super_admin'],
  'auto-assets': ['admin', 'agent', 'super_admin'],
  'auto_asset': ['admin', 'agent', 'super_admin'],
  'home-assets': ['admin', 'agent', 'super_admin'],
  'home_asset': ['admin', 'agent', 'super_admin'],
  'insurance_types': ['admin', 'agent', 'super_admin'],
  'claim-staff': ['admin', 'claim_staff', 'super_admin'],
  'claim_staff': ['admin', 'claim_staff', 'super_admin'],
  'claim-workflows': ['admin', 'claim_staff', 'super_admin'],
  'claim_workflow': ['admin', 'claim_staff', 'super_admin'],

  // Admin + claim_staff
  'claims': ['admin', 'claim_staff', 'super_admin'],
  'claim': ['admin', 'claim_staff', 'super_admin'],

  // Dashboard/analytics accessible to almost all
  'dashboard': ['admin', 'agent', 'claim_staff', 'super_admin'],
  'analytics': ['admin', 'super_admin'],
  'tasks': ['admin', 'agent', 'claim_staff', 'super_admin'],
  'search': ['admin', 'agent', 'claim_staff', 'super_admin'],

  // Agents - admin can see all, super_admin can see all
  'agents': ['admin', 'super_admin'],
  'agent': ['admin', 'super_admin'],
};

export function getRequiredRolesForPath(path: string): string[] | null {
  const normalized = path.toLowerCase().replace(/^\/api\//, '').replace(/\/\d+(\/.*)?$/, '').replace(/\/.*$/, '');
  if (ENTITY_ROLES[normalized]) {
    return ENTITY_ROLES[normalized];
  }
  // Try matching parent path (e.g., /api/policies/123/workflow -> policies)
  const parts = normalized.split('/');
  if (parts.length > 0 && ENTITY_ROLES[parts[0]]) {
    return ENTITY_ROLES[parts[0]];
  }
  return null;
}
