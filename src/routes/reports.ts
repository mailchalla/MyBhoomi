import { Router } from 'express';
import { getDb } from '../lib/db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
router.use(authenticate, requireRole('admin', 'super-admin'));

router.get('/upcoming', async (req, res) => {
  const db = getDb();
  const days = parseInt(req.query.days as string || '7', 10);
  const instalments = await db.instalment.findDueSoon(days);
  const enriched = await Promise.all(instalments.map(async (inst) => {
    const purchase = await db.purchase.findById(inst.purchaseId);
    const plot = purchase ? await db.plot.findById(purchase.plotId) : null;
    const customer = purchase ? await db.customer.findById(purchase.customerId) : null;
    const user = customer ? await db.user.findById(customer.userId) : null;
    return { ...inst, plot, customer, customerName: user?.name };
  }));
  res.json({ instalments: enriched, count: enriched.length });
});

router.get('/due', async (req, res) => {
  const db = getDb();
  const instalments = await db.instalment.findOverdue();
  const enriched = await Promise.all(instalments.map(async (inst) => {
    const purchase = await db.purchase.findById(inst.purchaseId);
    const plot = purchase ? await db.plot.findById(purchase.plotId) : null;
    const customer = purchase ? await db.customer.findById(purchase.customerId) : null;
    const user = customer ? await db.user.findById(customer.userId) : null;
    return { ...inst, plot, customer, customerName: user?.name };
  }));
  res.json({ instalments: enriched, count: enriched.length });
});

export default router;
