import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import fs from 'fs';

// Create the Turso client
const url = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.TURSO_DATABASE_URL : undefined) || process.env.TURSO_DATABASE_URL;
const authToken = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.TURSO_AUTH_TOKEN : undefined) || process.env.TURSO_AUTH_TOKEN;

// Support local SQLite file for development if no Turso URL is provided, otherwise in-memory fallback
let dbUrl = url;
if (!dbUrl) {
  if (fs.existsSync('local.db')) {
    dbUrl = 'file:local.db';
  } else {
    dbUrl = ':memory:';
  }
}

const client = createClient({
  url: dbUrl,
  authToken: authToken || '',
});

// Create the Drizzle database instance
export const db = drizzle(client, { schema });

// Export the client for direct SQL queries if needed
export { client };

// Export schema for convenience
export * from './schema';
