import { Router } from 'express';
import type { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { getDb } from '../lib/db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  [query('status').optional().isIn(['available', 'reserved', 'sold', 'archived'])],
  async (req: Request, res: Response) => {
    const db = getDb();
    const status = req.query.status as any;
    const plots = await db.plot.findAll(status ? { status } : undefined);
    if (req.user!.role === 'customer') {
      res.json({ plots: plots.filter((p) => p.status === 'available') });
      return;
    }
    res.json({ plots });
  }
);

router.post(
  '/',
  requireRole('admin', 'super-admin'),
  [
    body('name').trim().isLength({ min: 1 }),
    body('lengthFt').isFloat({ gt: 0 }),
    body('widthFt').isFloat({ gt: 0 }),
    body('status').optional().isIn(['available', 'reserved']),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
    const db = getDb();
    const plot = await db.plot.create(req.body);
    res.status(201).json({ plot });
  }
);

router.get('/:id', async (req: Request, res: Response) => {
  const db = getDb();
  const plot = await db.plot.findById(req.params.id);
  if (!plot) { res.status(404).json({ error: 'Plot not found' }); return; }
  const currentPrice = await db.price.findCurrentByPlotId(plot.id);
  const priceHistory = await db.price.findByPlotId(plot.id);
  res.json({ plot, currentPrice, priceHistory });
});

router.put(
  '/:id',
  requireRole('admin', 'super-admin'),
  async (req: Request, res: Response) => {
    const db = getDb();
    const plot = await db.plot.update(req.params.id, req.body);
    if (!plot) { res.status(404).json({ error: 'Plot not found' }); return; }
    res.json({ plot });
  }
);

router.delete('/:id', requireRole('admin', 'super-admin'), async (req: Request, res: Response) => {
  const db = getDb();
  await db.plot.update(req.params.id, { status: 'archived' });
  res.json({ ok: true });
});

// Price history
router.get('/:id/prices', async (req: Request, res: Response) => {
  const db = getDb();
  const prices = await db.price.findByPlotId(req.params.id);
  res.json({ prices });
});

// Add new price period
router.post(
  '/:id/prices',
  requireRole('admin', 'super-admin'),
  [
    body('ratePerSqFt').isFloat({ gt: 0 }),
    body('effectiveFrom').isISO8601(),
    body('effectiveTo').optional({ nullable: true }).isISO8601(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
    const db = getDb();
    const price = await db.price.create(req.params.id, req.body);
    res.status(201).json({ price });
  }
);

// Update current active price
router.put(
  '/:id/prices/current',
  requireRole('admin', 'super-admin'),
  [body('ratePerSqFt').isFloat({ gt: 0 })],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
    const db = getDb();
    const price = await db.price.updateCurrent(req.params.id, req.body.ratePerSqFt);
    res.json({ price });
  }
);

export default router;
