import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request { user?: { id: string; email: string } }

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = (req as any).cookies?.token as string | undefined;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const secret = process.env.JWT_SECRET as string;
    const payload = jwt.verify(token, secret) as { id: string; email: string };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
