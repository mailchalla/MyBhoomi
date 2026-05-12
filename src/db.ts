// Re-export from lib/ so that relative imports from routes are simple: '../db'
export { initDb, getDb } from './lib/db';