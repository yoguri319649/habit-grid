import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import fs from 'fs';
import path from 'path';

import * as schema from '@/db/schema';

const MIGRATION_SQL = fs
  .readFileSync(path.join(__dirname, '../../../drizzle/0000_clumsy_shiva.sql'), 'utf-8')
  .replace(/--> statement-breakpoint/g, '');

/** In-memory SQLite DB (schema applied from the real drizzle migration) for repository unit tests. */
export function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(MIGRATION_SQL);

  return drizzle(sqlite, { schema });
}
