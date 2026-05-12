import { createSqliteAdapter } from './db/implementations/sqlite';
import { config } from '../config';
import { DBAdapter } from './db/adapter';

let _db: DBAdapter;

export async function initDb(): Promise<DBAdapter> {
  const db = createSqliteAdapter(config.DATABASE_URL);
  await db.initialize();
  _db = db;
  return db;
}

export function getDb(): DBAdapter {
  if (!_db) throw new Error('db not initialized — call initDb() first');
  return _db;
}
