import { Router } from 'express';
import type { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { getDb } from '../db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
router.use(authenticate, requireRole('admin', 'super-admin'));

router.get('/', async (_req, res) => {
  const db = getDb();
  const customers = await db.customer.findAll();
  res.json({ customers });
});

router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().isLength({ min: 1 }),
    body('phone').optional(),
    body('address').optional(),
    body('notes').optional(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
    const db = getDb();
    const { email, password, name, phone = '', address = '', notes = '' } = req.body;
    const existing = await db.user.findByEmail(email);
    if (existing) { res.status(409).json({ error: 'Email already registered' }); return; }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({ email, passwordHash, role: 'customer', name, phone });
    const customer = await db.customer.create({ userId: user.id, address, notes });
    res.status(201).json({ customer, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }
);

router.get('/:id', async (req: Request, res: Response) => {
  const db = getDb();
  const customer = await db.customer.findById(req.params.id);
  if (!customer) { res.status(404).json({ error: 'Customer not found' }); return; }
  const user = await db.user.findById(customer.userId);
  const purchases = await db.purchase.findAll({ customerId: customer.id });
  const purchasesWithPlots = await Promise.all(
    purchases.map(async (p) => {
      const plot = await db.plot.findById(p.plotId);
      return { ...p, plot };
    })
  );
  res.json({ customer, user, purchases: purchasesWithPlots });
});

router.put('/:id', async (req: Request, res: Response) => {
  const db = getDb();
  const customer = await db.customer.update(req.params.id, req.body);
  if (!customer) { res.status(404).json({ error: 'Customer not found' }); return; }
  res.json({ customer });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const db = getDb();
  await db.customer.update(req.params.id, {});
  res.json({ ok: true });
});

export default router;