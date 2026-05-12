// ── Types ──────────────────────────────────────────────

export type UserRole = 'super-admin' | 'admin' | 'customer';
export type PlotStatus = 'available' | 'reserved' | 'sold' | 'archived';
export type PurchaseStatus = 'active' | 'completed' | 'defaulted';
export type InstalmentStatus = 'pending' | 'paid' | 'overdue';
export type AlertStatus = 'pending' | 'sent' | 'failed';
export type AlertType = 'in-app' | 'email' | 'sms';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  phone: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface Plot {
  id: string;
  name: string;
  lengthFt: number;
  widthFt: number;
  areaSqFt: number;
  status: PlotStatus;
  createdAt: string;
}

export interface EffectivePrice {
  id: string;
  plotId: string;
  ratePerSqFt: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface Purchase {
  id: string;
  customerId: string;
  plotId: string;
  totalPrice: number;
  instalmentMonths: number;
  purchaseDate: string;
  status: PurchaseStatus;
  createdAt: string;
}

export interface Instalment {
  id: string;
  purchaseId: string;
  instalmentNumber: number;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: InstalmentStatus;
}

export interface Alert {
  id: string;
  instalmentId: string;
  alertDate: string;
  type: AlertType;
  status: AlertStatus;
  sentAt: string | null;
}

// ── Input types (no id, timestamps) ─────────────────────

export type CreateUser = Pick<User, 'email' | 'passwordHash' | 'role' | 'name' | 'phone'>;
export type UpdateUser = Partial<Pick<User, 'name' | 'phone' | 'role'>>;

export type CreateCustomer = Pick<Customer, 'userId' | 'address' | 'notes'>;
export type UpdateCustomer = Partial<Pick<Customer, 'address' | 'notes'>>;

export type CreatePlot = Pick<Plot, 'name' | 'lengthFt' | 'widthFt' | 'status'>;
export type UpdatePlot = Partial<Pick<Plot, 'name' | 'lengthFt' | 'widthFt' | 'status'>>;

export type CreatePrice = Pick<EffectivePrice, 'ratePerSqFt' | 'effectiveFrom' | 'effectiveTo'>;

export type CreatePurchase = Pick<Purchase, 'customerId' | 'plotId' | 'instalmentMonths' | 'purchaseDate'>;
export type CreateInstalment = Pick<Instalment, 'instalmentNumber' | 'amount' | 'dueDate' | 'status'>;

export type CreateAlert = Pick<Alert, 'instalmentId' | 'alertDate' | 'type'>;

// ── Adapter interface ──────────────────────────────────

export interface DBAdapter {
  // Users
  user: {
    create(data: CreateUser): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    update(id: string, data: UpdateUser): Promise<User>;
  };

  // Customers
  customer: {
    create(data: CreateCustomer): Promise<Customer>;
    findAll(): Promise<Customer[]>;
    findById(id: string): Promise<Customer | null>;
    findByUserId(userId: string): Promise<Customer | null>;
    update(id: string, data: UpdateCustomer): Promise<Customer>;
  };

  // Plots
  plot: {
    create(data: CreatePlot): Promise<Plot>;
    findAll(filters?: { status?: PlotStatus }): Promise<Plot[]>;
    findById(id: string): Promise<Plot | null>;
    update(id: string, data: UpdatePlot): Promise<Plot>;
  };

  // Effective Prices
  price: {
    create(plotId: string, data: CreatePrice): Promise<EffectivePrice>;
    findCurrentByPlotId(plotId: string): Promise<EffectivePrice | null>;
    findByPlotId(plotId: string): Promise<EffectivePrice[]>;
    updateCurrent(plotId: string, ratePerSqFt: number): Promise<EffectivePrice>;
  };

  // Purchases
  purchase: {
    create(data: CreatePurchase): Promise<Purchase>;
    findAll(filters?: { customerId?: string }): Promise<Purchase[]>;
    findById(id: string): Promise<Purchase | null>;
  };

  // Instalments
  instalment: {
    createMany(purchaseId: string, schedule: CreateInstalment[]): Promise<void>;
    findByPurchaseId(purchaseId: string): Promise<Instalment[]>;
    findDueSoon(days: number): Promise<Instalment[]>;
    findOverdue(): Promise<Instalment[]>;
    updateStatus(id: string, status: InstalmentStatus, paidAt?: string): Promise<Instalment>;
    findById(id: string): Promise<Instalment | null>;
  };

  // Alerts
  alert: {
    create(data: CreateAlert): Promise<Alert>;
    findByDateRange(start: string, end: string): Promise<Alert[]>;
    findByCustomerId(customerId: string): Promise<Alert[]>;
    updateStatus(id: string, status: AlertStatus, sentAt?: string): Promise<Alert>;
  };

  // Internal — DB initialization
  initialize(): Promise<void>;
}
