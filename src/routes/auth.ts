import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getDb } from '../lib/db';
import { config } from '../config';
import { authenticate } from '../middleware/auth';

const router = Router();

const BCRYPT_ROUNDS = 12;

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().isLength({ min: 1 }),
    body('phone').optional().isMobilePhone('any'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { email, password, name, phone = '' } = req.body;
    const db = getDb();
    const existing = await db.user.findByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await db.user.create({ email, passwordHash, role: 'customer', name, phone });
    const token = jwt.sign({ userId: user.id, role: user.role }, config.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('session', token, { httpOnly: true, sameSite: 'lax', secure: false });
    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json({ user: safeUser });
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 1 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { email, password } = req.body;
    const db = getDb();
    const user = await db.user.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, config.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('session', token, { httpOnly: true, sameSite: 'lax', secure: false });
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser });
  }
);

router.post('/logout', (_req, res) => {
  res.clearCookie('session');
  res.json({ ok: true });
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  const db = getDb();
  const user = await db.user.findById(req.user!.userId);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

export default router;