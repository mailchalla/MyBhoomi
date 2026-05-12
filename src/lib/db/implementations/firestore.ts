/**
 * Firestore implementation of DBAdapter
 *
 * ## Migration Path
 * When ready to migrate from SQLite to Firestore:
 * 1. Ensure Firebase Admin SDK is installed: npm install firebase-admin
 * 2. Initialize Firebase with: admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
 * 3. Implement each method using Firestore's collection/document API
 * 4. Update src/lib/db.ts to export from this file instead of sqlite.ts
 * 5. Remove implementations/sqlite.ts (or keep for local dev)
 *
 * ## Firestore Data Model
 * Collections:
 *   /users/{userId}          — User documents
 *   /customers/{customerId}  — Customer documents
 *   /plots/{plotId}           — Plot documents
 *   /effectivePrices/{priceId} — Price documents (subcollection of plots recommended)
 *   /purchases/{purchaseId}  — Purchase documents
 *   /instalments/{instId}    — Instalment documents (subcollection of purchases recommended)
 *   /alerts/{alertId}         — Alert documents (subcollection of instalments recommended)
 *
 * ## Key Differences from SQLite
 *
 * ### Writes
 * - Use Firestore transactions (runTransaction) for atomic multi-document updates
 * - Example: purchase.create() needs to create purchase + all instalments + all alerts atomically
 *
 * ### Reads
 * - All reads are async (return Promises), same as SQLite adapter
 * - Use collection group queries if instalments/alerts are stored as subcollections
 *
 * ### Indexes
 * - Firestore requires composite indexes for queries with multiple filters or orderBy
 * - Required indexes (create in Firebase console or via firebase.json):
 *   - instalments: [status ASC, due_date ASC]  — for findDueSoon
 *   - alerts: [alert_date ASC]                  — for findByDateRange
 *   - purchases: [customer_id ASC]              — for findAll({customerId})
 *
 * ### Security Rules
 * - Firestore security rules should enforce role-based access:
 *   - customers can only read their own documents
 *   - admins can read all
 *   - writes are admin-only
 *
 * ## Authentication
 * - This adapter does NOT handle Firebase Auth — that is separate
 * - JWT sessions are still issued by the Express server (see auth routes)
 * - Firestore is accessed using Firebase Admin SDK with a service account
 */

import { DBAdapter, CreateUser, UpdateUser, CreateCustomer, UpdateCustomer,
         CreatePlot, UpdatePlot, CreatePrice, CreatePurchase, CreateInstalment,
         CreateAlert, UserRole, PlotStatus, PurchaseStatus, InstalmentStatus,
         AlertStatus, AlertType } from '../adapter';

// Placeholder types (replace with Firestore document types)
type Firestore = any;
type DocumentReference = any;
type Transaction = any;

export function createFirestoreAdapter(
  _db: Firestore,
  _options?: { collectionPrefix?: string }
): DBAdapter {
  const col = (name: string) => name; // e.g. 'users', 'plots'

  function throwNotImplemented(method: string): never {
    throw new Error(`Firestore adapter: ${method} not yet implemented. See firestore.ts for migration notes.`);
  }

  return {
    async initialize() {
      // Firestore auto-creates collections on first write
      // No explicit schema migration needed — but set up required composite indexes
      console.log('[Firestore] Adapter ready — ensure composite indexes exist in Firebase console');
    },

    user: {
      create: (data: CreateUser) => throwNotImplemented('user.create'),
      findByEmail: (email: string) => throwNotImplemented('user.findByEmail'),
      findById: (id: string) => throwNotImplemented('user.findById'),
      findAll: () => throwNotImplemented('user.findAll'),
      update: (id: string, data: UpdateUser) => throwNotImplemented('user.update'),
    },

    customer: {
      create: (data: CreateCustomer) => throwNotImplemented('customer.create'),
      findAll: () => throwNotImplemented('customer.findAll'),
      findById: (id: string) => throwNotImplemented('customer.findById'),
      findByUserId: (userId: string) => throwNotImplemented('customer.findByUserId'),
      update: (id: string, data: UpdateCustomer) => throwNotImplemented('customer.update'),
    },

    plot: {
      create: (data: CreatePlot) => throwNotImplemented('plot.create'),
      findAll: (filters) => throwNotImplemented('plot.findAll'),
      findById: (id: string) => throwNotImplemented('plot.findById'),
      update: (id: string, data: UpdatePlot) => throwNotImplemented('plot.update'),
    },

    price: {
      create: (plotId: string, data: any) => throwNotImplemented('price.create'),
      findCurrentByPlotId: (plotId: string) => throwNotImplemented('price.findCurrentByPlotId'),
      findByPlotId: (plotId: string) => throwNotImplemented('price.findByPlotId'),
      updateCurrent: (plotId: string, ratePerSqFt: number) => throwNotImplemented('price.updateCurrent'),
    },

    purchase: {
      create: (data: CreatePurchase) => throwNotImplemented('purchase.create'),
      findAll: (filters) => throwNotImplemented('purchase.findAll'),
      findById: (id: string) => throwNotImplemented('purchase.findById'),
    },

    instalment: {
      createMany: (purchaseId: string, schedule: CreateInstalment[]) => throwNotImplemented('instalment.createMany'),
      findByPurchaseId: (purchaseId: string) => throwNotImplemented('instalment.findByPurchaseId'),
      findDueSoon: (days: number) => throwNotImplemented('instalment.findDueSoon'),
      findOverdue: () => throwNotImplemented('instalment.findOverdue'),
      updateStatus: (id: string, status: InstalmentStatus, paidAt?: string) => throwNotImplemented('instalment.updateStatus'),
      findById: (id: string) => throwNotImplemented('instalment.findById'),
    },

    alert: {
      create: (data: CreateAlert) => throwNotImplemented('alert.create'),
      findByDateRange: (start: string, end: string) => throwNotImplemented('alert.findByDateRange'),
      findByCustomerId: (customerId: string) => throwNotImplemented('alert.findByCustomerId'),
      updateStatus: (id: string, status: AlertStatus, sentAt?: string) => throwNotImplemented('alert.updateStatus'),
    },
  };
}