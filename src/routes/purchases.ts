import { Router } from 'express';
import type { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getDb } from '../db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { generateInstalmentSchedule, generateAlertsForInstalment } from '../services/instalmentService';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const db = getDb();
  if (req.user!.role === 'customer') {
    const customer = await db.customer.findByUserId(req.user!.userId);
    if (!customer) { res.status(404).json({ error: 'Customer record not found' }); return; }
    const purchases = await db.purchase.findAll({ customerId: customer.id });
    const enriched = await Promise.all(purchases.map(async (p) => {
      const plot = await db.plot.findById(p.plotId);
      const instalments = await db.instalment.findByPurchaseId(p.id);
      return { ...p, plot, instalments };
    }));
    res.json({ purchases: enriched });
    return;
  }
  const purchases = await db.purchase.findAll();
  const enriched = await Promise.all(purchases.map(async (p) => {
    const plot = await db.plot.findById(p.plotId);
    const customer = await db.customer.findById(p.customerId);
    const instalments = await db.instalment.findByPurchaseId(p.id);
    return { ...p, plot, customer, instalments };
  }));
  res.json({ purchases: enriched });
});

router.post(
  '/',
  requireRole('admin', 'super-admin'),
  [
    body('customerId').isUUID(),
    body('plotId').isUUID(),
    body('instalmentMonths').isInt({ gt: 0 }),
    body('purchaseDate').isISO8601(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
    const db = getDb();
    const { customerId, plotId, instalmentMonths, purchaseDate } = req.body;

    const plot = await db.plot.findById(plotId);
    if (!plot) { res.status(404).json({ error: 'Plot not found' }); return; }
    if (plot.status !== 'available') { res.status(400).json({ error: 'Plot is not available' }); return; }

    const currentPrice = await db.price.findCurrentByPlotId(plotId);
    if (!currentPrice) { res.status(400).json({ error: 'Plot has no active price. Set a price first.' }); return; }

    const totalPrice = currentPrice.ratePerSqFt * plot.areaSqFt;
    const purchase = await db.purchase.create({ customerId, plotId, instalmentMonths, purchaseDate });

    const schedule = generateInstalmentSchedule(purchaseDate, totalPrice, instalmentMonths);
    await db.instalment.createMany(purchase.id, schedule);

    const instalments = await db.instalment.findByPurchaseId(purchase.id);
    for (const inst of instalments) {
      const alerts = generateAlertsForInstalment(inst.id, inst.dueDate);
      for (const alert of alerts) await db.alert.create(alert);
    }

    await db.plot.update(plotId, { status: 'sold' });

    res.status(201).json({ purchase, instalments, totalPrice });
  }
);

router.get('/:id', async (req: Request, res: Response) => {
  const db = getDb();
  const purchase = await db.purchase.findById(req.params.id);
  if (!purchase) { res.status(404).json({ error: 'Purchase not found' }); return; }
  if (req.user!.role === 'customer') {
    const customer = await db.customer.findByUserId(req.user!.userId);
    if (!customer || purchase.customerId !== customer.id) { res.status(403).json({ error: 'Access denied' }); return; }
  }
  const plot = await db.plot.findById(purchase.plotId);
  const instalments = await db.instalment.findByPurchaseId(purchase.id);
  res.json({ purchase, plot, instalments });
});

router.get('/:id/instalments', async (req: Request, res: Response) => {
  const db = getDb();
  const purchase = await db.purchase.findById(req.params.id);
  if (!purchase) { res.status(404).json({ error: 'Purchase not found' }); return; }
  if (req.user!.role === 'customer') {
    const customer = await db.customer.findByUserId(req.user!.userId);
    if (!customer || purchase.customerId !== customer.id) { res.status(403).json({ error: 'Access denied' }); return; }
  }
  const instalments = await db.instalment.findByPurchaseId(purchase.id);
  res.json({ instalments });
});

router.put(
  '/:id/instalments/:instId/pay',
  requireRole('admin', 'super-admin'),
  async (req: Request, res: Response) => {
    const db = getDb();
    const inst = await db.instalment.updateStatus(req.params.instId, 'paid', new Date().toISOString());
    res.json({ instalment: inst });
  }
);

export default router;