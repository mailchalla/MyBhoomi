import { Router } from 'express';
import { getDb } from '../lib/db';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const db = getDb();
  if (req.user!.role === 'customer') {
    const customer = await db.customer.findByUserId(req.user!.userId);
    if (!customer) { res.status(404).json({ error: 'Customer not found' }); return; }
    const alerts = await db.alert.findByCustomerId(customer.id);
    res.json({ alerts });
    return;
  }
  const alerts = await db.alert.findAll();
  res.json(alerts);
});

router.get('/unread', async (req, res) => {
  if (req.user!.role !== 'customer') { res.status(403).json({ error: 'Use the general alerts endpoint' }); return; }
  const db = getDb();
  const customer = await db.customer.findByUserId(req.user!.userId);
  if (!customer) { res.status(404).json({ error: 'Customer not found' }); return; }
  const alerts = await db.alert.findByCustomerId(customer.id);
  res.json({ alerts: alerts.filter(a => a.status === 'pending') });
});

export default router;
