import 'dotenv/config';
import bcrypt from 'bcrypt';
import { initDb, getDb } from '../src/db';

async function seed() {
  await initDb();
  const db = getDb();

  // Clear existing data so seed is re-runnable
  await db.clear();

  const adminHash = await bcrypt.hash('admin123', 12);
  const customerHash = await bcrypt.hash('customer123', 12);

  // Super-admin
  const superAdmin = await db.user.create({
    email: 'admin@mybooomi.com',
    passwordHash: adminHash,
    role: 'super-admin',
    name: 'Platform Admin',
    phone: '+1234567890',
  });

  // Admin
  const admin = await db.user.create({
    email: 'manager@mybooomi.com',
    passwordHash: adminHash,
    role: 'admin',
    name: 'Site Manager',
    phone: '+1234567891',
  });

  // Customer
  const customerUser = await db.user.create({
    email: 'customer@example.com',
    passwordHash: customerHash,
    role: 'customer',
    name: 'John Buyer',
    phone: '+1234567892',
  });

  const customer = await db.customer.create({
    userId: customerUser.id,
    address: '123 Main St, City',
    notes: 'VIP customer',
  });

  // Sample plots
  const plots = [
    await db.plot.create({ name: 'Plot A-1', lengthFt: 50, widthFt: 100, status: 'available' }),
    await db.plot.create({ name: 'Plot A-2', lengthFt: 60, widthFt: 100, status: 'available' }),
    await db.plot.create({ name: 'Plot B-1', lengthFt: 40, widthFt: 80, status: 'available' }),
    await db.plot.create({ name: 'Plot B-2', lengthFt: 40, widthFt: 80, status: 'reserved' }),
    await db.plot.create({ name: 'Plot C-1', lengthFt: 70, widthFt: 120, status: 'available' }),
  ];

  // Set prices for plots ($25/sqft)
  for (const plot of plots) {
    await db.price.create(plot.id, { ratePerSqFt: 25, effectiveFrom: '2026-01-01', effectiveTo: null });
  }

  console.log('Seed complete:');
  console.log(`  Super-admin: admin@mybooomi.com / admin123`);
  console.log(`  Admin: manager@mybooomi.com / admin123`);
  console.log(`  Customer: customer@example.com / customer123`);
}

seed().catch(console.error);
