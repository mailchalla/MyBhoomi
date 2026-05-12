import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { getDb } from '../db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
router.use(authenticate, requireRole('super-admin'));

router.get('/', async (_req, res) => {
  const db = getDb();
  const users = await db.user.findAll();
  res.json({ users: users.map(({ passwordHash: _, ...u }) => u) });
});

router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().isLength({ min: 1 }),
    body('role').isIn(['super-admin', 'admin', 'customer']),
    body('phone').optional(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
    const db = getDb();
    const existing = await db.user.findByEmail(req.body.email);
    if (existing) { res.status(409).json({ error: 'Email already in use' }); return; }
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await db.user.create({ ...req.body, passwordHash });
    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json({ user: safeUser });
  }
);

router.put('/:id/role', [body('role').isIn(['super-admin', 'admin', 'customer'])], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  const db = getDb();
  const user = await db.user.update(req.params.id, { role: req.body.role });
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

router.delete('/:id', async (req, res) => {
  const db = getDb();
  await db.user.update(req.params.id, {});
  res.json({ ok: true });
});

export default router;