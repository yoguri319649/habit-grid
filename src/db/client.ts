import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import * as schema from '@/db/schema';

const expoDb = SQLite.openDatabaseSync('habit-grid.db', { enableChangeListener: true });
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });
