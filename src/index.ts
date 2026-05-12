import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDb } from './lib/db';
import { config } from './config';
import { alertService } from './services/alertService';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import plotsRouter from './routes/plots';
import customersRouter from './routes/customers';
import purchasesRouter from './routes/purchases';
import alertsRouter from './routes/alerts';
import reportsRouter from './routes/reports';

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/plots', plotsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/reports', reportsRouter);

// ── Cron endpoint ────────────────────────────────────────────────────────────

app.get('/api/jobs/check-alerts', async (_req: Request, res: Response) => {
  const secret = _req.headers['x-cron-secret'] as string | undefined;
  if (secret !== config.ALERT_CRON_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  await alertService.checkAndSendDueAlerts();
  res.json({ ok: true, processed: 'alerts' });
});

// ── Global error handler ──────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

async function start(): Promise<void> {
  try {
    await initDb();
    console.log('Database initialized');
    app.listen(config.PORT, () => {
      console.log(`Backend running on http://localhost:${config.PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();