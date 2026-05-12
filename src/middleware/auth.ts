import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthPayload {
  userId: string;
  role: 'super-admin' | 'admin' | 'customer';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.session;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}