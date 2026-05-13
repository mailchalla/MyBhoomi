import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import {
  DBAdapter, UserRole, PlotStatus, PurchaseStatus, InstalmentStatus, AlertStatus, AlertType,
  CreateUser, UpdateUser, CreateCustomer, UpdateCustomer, CreatePlot, UpdatePlot,
  CreatePrice, CreatePurchase, CreateInstalment, CreateAlert,
  User, Customer, Plot, EffectivePrice, Purchase, Instalment, Alert,
} from '../adapter';

export function createSqliteAdapter(dbPath: string): DBAdapter {
  const db = new Database(dbPath);

  // ── Row converters ──────────────────────────────────────
  function rowToUser(r: any): User {
    return { id: r.id, email: r.email, passwordHash: r.password_hash, role: r.role as UserRole, name: r.name, phone: r.phone || '', createdAt: r.created_at };
  }
  function rowToCustomer(r: any): Customer {
    return { id: r.id, userId: r.user_id, address: r.address || '', notes: r.notes || '', createdAt: r.created_at };
  }
  function rowToPlot(r: any): Plot {
    return { id: r.id, name: r.name, lengthFt: r.length_ft, widthFt: r.width_ft, areaSqFt: r.area_sqft, status: r.status as PlotStatus, createdAt: r.created_at };
  }
  function rowToPrice(r: any): EffectivePrice {
    return { id: r.id, plotId: r.plot_id, ratePerSqFt: r.rate_per_sqft, effectiveFrom: r.effective_from, effectiveTo: r.effective_to };
  }
  function rowToPurchase(r: any): Purchase {
    return { id: r.id, customerId: r.customer_id, plotId: r.plot_id, totalPrice: r.total_price, instalmentMonths: r.instalment_months, purchaseDate: r.purchase_date, status: r.status as PurchaseStatus, createdAt: r.created_at };
  }
  function rowToInstalment(r: any): Instalment {
    return { id: r.id, purchaseId: r.purchase_id, instalmentNumber: r.instalment_number, amount: r.amount, dueDate: r.due_date, paidAt: r.paid_at, status: r.status as InstalmentStatus };
  }
  function rowToAlert(r: any): Alert {
    return { id: r.id, instalmentId: r.instalment_id, alertDate: r.alert_date, type: r.type as AlertType, status: r.status as AlertStatus, sentAt: r.sent_at };
  }

  // ── Sections (filled in below, referenced via adapter) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adapter: DBAdapter = null as any; // assigned fully after all sections are defined

  const userSection = {
    async create(data: CreateUser): Promise<User> {
      const id = uuidv4();
      db.prepare(`INSERT INTO users (id, email, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?, ?)`).run(id, data.email, data.passwordHash, data.role, data.name, data.phone || '');
      return (await adapter.user.findById(id))!;
    },
    async findByEmail(email: string): Promise<User | null> {
      const r = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as any;
      return r ? rowToUser(r) : null;
    },
    async findById(id: string): Promise<User | null> {
      const r = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as any;
      return r ? rowToUser(r) : null;
    },
    async findAll(): Promise<User[]> {
      return db.prepare(`SELECT * FROM users ORDER BY created_at DESC`).all().map(rowToUser);
    },
    async update(id: string, data: UpdateUser): Promise<User> {
      const sets: string[] = [];
      const vals: any[] = [];
      if (data.name !== undefined) { sets.push('name = ?'); vals.push(data.name); }
      if (data.phone !== undefined) { sets.push('phone = ?'); vals.push(data.phone); }
      if (data.role !== undefined) { sets.push('role = ?'); vals.push(data.role); }
      if (!sets.length) return (await adapter.user.findById(id))!;
      vals.push(id);
      db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
      return (await adapter.user.findById(id))!;
    },
  };

  const customerSection = {
    async create(data: CreateCustomer): Promise<Customer> {
      const id = uuidv4();
      db.prepare(`INSERT INTO customers (id, user_id, address, notes) VALUES (?, ?, ?, ?)`).run(id, data.userId, data.address || '', data.notes || '');
      return (await adapter.customer.findById(id))!;
    },
    async findAll(): Promise<Customer[]> {
      return db.prepare(`SELECT * FROM customers ORDER BY created_at DESC`).all().map(rowToCustomer);
    },
    async findById(id: string): Promise<Customer | null> {
      const r = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(id) as any;
      return r ? rowToCustomer(r) : null;
    },
    async findByUserId(userId: string): Promise<Customer | null> {
      const r = db.prepare(`SELECT * FROM customers WHERE user_id = ?`).get(userId) as any;
      return r ? rowToCustomer(r) : null;
    },
    async update(id: string, data: UpdateCustomer): Promise<Customer> {
      const sets: string[] = [];
      const vals: any[] = [];
      if (data.address !== undefined) { sets.push('address = ?'); vals.push(data.address); }
      if (data.notes !== undefined) { sets.push('notes = ?'); vals.push(data.notes); }
      if (!sets.length) return (await adapter.customer.findById(id))!;
      vals.push(id);
      db.prepare(`UPDATE customers SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
      return (await adapter.customer.findById(id))!;
    },
  };

  const plotSection = {
    async create(data: CreatePlot): Promise<Plot> {
      const id = uuidv4();
      const areaSqFt = data.lengthFt * data.widthFt;
      db.prepare(`INSERT INTO plots (id, name, length_ft, width_ft, area_sqft, status) VALUES (?, ?, ?, ?, ?, ?)`).run(id, data.name, data.lengthFt, data.widthFt, areaSqFt, data.status ?? 'available');
      return (await adapter.plot.findById(id))!;
    },
    async findAll(filters?: { status?: PlotStatus }): Promise<Plot[]> {
      if (filters?.status) {
        return db.prepare(`SELECT * FROM plots WHERE status = ? ORDER BY name`).all(filters.status).map(rowToPlot);
      }
      return db.prepare(`SELECT * FROM plots WHERE status != 'archived' ORDER BY name`).all().map(rowToPlot);
    },
    async findById(id: string): Promise<Plot | null> {
      const r = db.prepare(`SELECT * FROM plots WHERE id = ?`).get(id) as any;
      return r ? rowToPlot(r) : null;
    },
    async update(id: string, data: UpdatePlot): Promise<Plot> {
      // Pre-read to get current dimensions for area recomputation
      const current = await adapter.plot.findById(id);
      if (!current) throw new Error('Plot not found');

      const sets: string[] = [];
      const vals: any[] = [];
      if (data.name !== undefined) { sets.push('name = ?'); vals.push(data.name); }
      const newLength = data.lengthFt ?? current.lengthFt;
      const newWidth = data.widthFt ?? current.widthFt;
      if (data.lengthFt !== undefined) { sets.push('length_ft = ?'); vals.push(data.lengthFt); }
      if (data.widthFt !== undefined) { sets.push('width_ft = ?'); vals.push(data.widthFt); }
      if (data.lengthFt !== undefined || data.widthFt !== undefined) {
        sets.push('area_sqft = ?'); vals.push(newLength * newWidth);
      }
      if (data.status !== undefined) { sets.push('status = ?'); vals.push(data.status); }
      if (!sets.length) return current;
      vals.push(id);
      db.prepare(`UPDATE plots SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
      return (await adapter.plot.findById(id))!;
    },
  };

  const priceSection = {
    async create(plotId: string, data: CreatePrice): Promise<EffectivePrice> {
      // Close out any current active price
      db.prepare(`UPDATE effective_prices SET effective_to = ? WHERE plot_id = ? AND effective_to IS NULL`).run(data.effectiveFrom, plotId);
      const id = uuidv4();
      db.prepare(`INSERT INTO effective_prices (id, plot_id, rate_per_sqft, effective_from, effective_to) VALUES (?, ?, ?, ?, ?)`).run(id, plotId, data.ratePerSqFt, data.effectiveFrom, data.effectiveTo ?? null);
      const r = db.prepare(`SELECT * FROM effective_prices WHERE id = ?`).get(id) as any;
      return rowToPrice(r);
    },
    async findById(id: string): Promise<EffectivePrice | null> {
      const r = db.prepare(`SELECT * FROM effective_prices WHERE id = ?`).get(id) as any;
      return r ? rowToPrice(r) : null;
    },
    async findCurrentByPlotId(plotId: string): Promise<EffectivePrice | null> {
      const r = db.prepare(`SELECT * FROM effective_prices WHERE plot_id = ? AND effective_to IS NULL ORDER BY effective_from DESC LIMIT 1`).get(plotId) as any;
      return r ? rowToPrice(r) : null;
    },
    async findByPlotId(plotId: string): Promise<EffectivePrice[]> {
      return db.prepare(`SELECT * FROM effective_prices WHERE plot_id = ? ORDER BY effective_from DESC`).all(plotId).map(rowToPrice);
    },
    async updateCurrent(plotId: string, ratePerSqFt: number): Promise<EffectivePrice> {
      const today = new Date().toISOString().split('T')[0];
      const existing = await adapter.price.findCurrentByPlotId(plotId);
      if (existing) {
        db.prepare(`UPDATE effective_prices SET effective_to = ? WHERE id = ?`).run(today, existing.id);
      }
      return adapter.price.create(plotId, { ratePerSqFt, effectiveFrom: today, effectiveTo: null });
    },
  };

  const purchaseSection = {
    async create(data: CreatePurchase): Promise<Purchase> {
      const plot = await adapter.plot.findById(data.plotId);
      if (!plot) throw new Error('Plot not found');
      const currentPrice = await adapter.price.findCurrentByPlotId(data.plotId);
      if (!currentPrice) throw new Error('Plot has no active price');
      const totalPrice = currentPrice.ratePerSqFt * plot.areaSqFt;
      const id = uuidv4();
      db.prepare(`INSERT INTO purchases (id, customer_id, plot_id, total_price, instalment_months, purchase_date, status) VALUES (?, ?, ?, ?, ?, ?, 'active')`).run(id, data.customerId, data.plotId, totalPrice, data.instalmentMonths, data.purchaseDate);
      return (await adapter.purchase.findById(id))!;
    },
    async findAll(filters?: { customerId?: string }): Promise<Purchase[]> {
      if (filters?.customerId) {
        return db.prepare(`SELECT * FROM purchases WHERE customer_id = ? ORDER BY created_at DESC`).all(filters.customerId).map(rowToPurchase);
      }
      return db.prepare(`SELECT * FROM purchases ORDER BY created_at DESC`).all().map(rowToPurchase);
    },
    async findById(id: string): Promise<Purchase | null> {
      const r = db.prepare(`SELECT * FROM purchases WHERE id = ?`).get(id) as any;
      return r ? rowToPurchase(r) : null;
    },
  };

  const instalmentSection = {
    async createMany(purchaseId: string, schedule: CreateInstalment[]): Promise<void> {
      const insert = db.prepare(`INSERT INTO instalments (id, purchase_id, instalment_number, amount, due_date, status) VALUES (?, ?, ?, ?, ?, ?)`);
      const insertMany = db.transaction((items: CreateInstalment[]) => {
        for (const item of items) insert.run(uuidv4(), purchaseId, item.instalmentNumber, item.amount, item.dueDate, item.status);
      });
      insertMany(schedule);
    },
    async findByPurchaseId(purchaseId: string): Promise<Instalment[]> {
      return db.prepare(`SELECT * FROM instalments WHERE purchase_id = ? ORDER BY instalment_number`).all(purchaseId).map(rowToInstalment);
    },
    async findDueSoon(days: number): Promise<Instalment[]> {
      const today = new Date();
      const future = new Date(today);
      future.setDate(today.getDate() + days);
      return db.prepare(`SELECT * FROM instalments WHERE status = 'pending' AND due_date >= ? AND due_date <= ?`).all(today.toISOString().split('T')[0], future.toISOString().split('T')[0]).map(rowToInstalment);
    },
    async findOverdue(): Promise<Instalment[]> {
      const today = new Date().toISOString().split('T')[0];
      return db.prepare(`SELECT * FROM instalments WHERE status = 'pending' AND due_date < ?`).all(today).map(rowToInstalment);
    },
    async updateStatus(id: string, status: InstalmentStatus, paidAt?: string): Promise<Instalment> {
      if (paidAt) db.prepare(`UPDATE instalments SET status = ?, paid_at = ? WHERE id = ?`).run(status, paidAt, id);
      else db.prepare(`UPDATE instalments SET status = ? WHERE id = ?`).run(status, id);
      return (await adapter.instalment.findById(id))!;
    },
    async findById(id: string): Promise<Instalment | null> {
      const r = db.prepare(`SELECT * FROM instalments WHERE id = ?`).get(id) as any;
      return r ? rowToInstalment(r) : null;
    },
  };

  const alertSection = {
    async create(data: CreateAlert): Promise<Alert> {
      const id = uuidv4();
      db.prepare(`INSERT INTO alerts (id, instalment_id, alert_date, type, status) VALUES (?, ?, ?, ?, 'pending')`).run(id, data.instalmentId, data.alertDate, data.type);
      const r = db.prepare(`SELECT * FROM alerts WHERE id = ?`).get(id) as any;
      return rowToAlert(r);
    },
    async findAll(): Promise<Alert[]> {
      return db.prepare(`SELECT * FROM alerts ORDER BY alert_date`).all().map(rowToAlert);
    },
    async findByDateRange(start: string, end: string): Promise<Alert[]> {
      return db.prepare(`SELECT * FROM alerts WHERE alert_date >= ? AND alert_date <= ? ORDER BY alert_date`).all(start, end).map(rowToAlert);
    },
    async findByCustomerId(customerId: string): Promise<Alert[]> {
      return db.prepare(`SELECT a.* FROM alerts a JOIN instalments i ON a.instalment_id = i.id JOIN purchases p ON i.purchase_id = p.id WHERE p.customer_id = ? ORDER BY a.alert_date DESC`).all(customerId).map(rowToAlert);
    },
    async updateStatus(id: string, status: AlertStatus, sentAt?: string): Promise<Alert> {
      if (sentAt) db.prepare(`UPDATE alerts SET status = ?, sent_at = ? WHERE id = ?`).run(status, sentAt, id);
      else db.prepare(`UPDATE alerts SET status = ? WHERE id = ?`).run(status, id);
      const r = db.prepare(`SELECT * FROM alerts WHERE id = ?`).get(id) as any;
      return rowToAlert(r);
    },
    async findById(id: string): Promise<Alert | null> {
      const r = db.prepare(`SELECT * FROM alerts WHERE id = ?`).get(id) as any;
      return r ? rowToAlert(r) : null;
    },
  };

  // Build adapter with all sections
  adapter = {
    initialize: async () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'customer',
          name TEXT NOT NULL,
          phone TEXT DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          address TEXT DEFAULT '',
          notes TEXT DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS plots (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          length_ft REAL NOT NULL,
          width_ft REAL NOT NULL,
          area_sqft REAL NOT NULL,
          status TEXT NOT NULL DEFAULT 'available',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS effective_prices (
          id TEXT PRIMARY KEY,
          plot_id TEXT NOT NULL REFERENCES plots(id),
          rate_per_sqft REAL NOT NULL,
          effective_from TEXT NOT NULL,
          effective_to TEXT
        );
        CREATE TABLE IF NOT EXISTS purchases (
          id TEXT PRIMARY KEY,
          customer_id TEXT NOT NULL REFERENCES customers(id),
          plot_id TEXT NOT NULL REFERENCES plots(id),
          total_price REAL NOT NULL,
          instalment_months INTEGER NOT NULL,
          purchase_date TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS instalments (
          id TEXT PRIMARY KEY,
          purchase_id TEXT NOT NULL REFERENCES purchases(id),
          instalment_number INTEGER NOT NULL,
          amount REAL NOT NULL,
          due_date TEXT NOT NULL,
          paid_at TEXT,
          status TEXT NOT NULL DEFAULT 'pending'
        );
        CREATE TABLE IF NOT EXISTS alerts (
          id TEXT PRIMARY KEY,
          instalment_id TEXT NOT NULL REFERENCES instalments(id),
          alert_date TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          sent_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_purchases_customer ON purchases(customer_id);
        CREATE INDEX IF NOT EXISTS idx_purchases_plot ON purchases(plot_id);
        CREATE INDEX IF NOT EXISTS idx_instalments_due ON instalments(due_date);
        CREATE INDEX IF NOT EXISTS idx_instalments_status ON instalments(status);
        CREATE INDEX IF NOT EXISTS idx_alerts_date ON alerts(alert_date);
        CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
      `);
    },
    clear: async () => {
      db.exec(`
        DELETE FROM alerts;
        DELETE FROM instalments;
        DELETE FROM purchases;
        DELETE FROM effective_prices;
        DELETE FROM plots;
        DELETE FROM customers;
        DELETE FROM users;
      `);
    },
    user: userSection,
    customer: customerSection,
    plot: plotSection,
    price: priceSection,
    purchase: purchaseSection,
    instalment: instalmentSection,
    alert: alertSection,
  } as unknown as DBAdapter;

  return adapter;
}
