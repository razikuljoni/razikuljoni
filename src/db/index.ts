import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.TURSO_DATABASE_URL : undefined) || (typeof process !== 'undefined' ? process.env.TURSO_DATABASE_URL : undefined);
const authToken = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.TURSO_AUTH_TOKEN : undefined) || (typeof process !== 'undefined' ? process.env.TURSO_AUTH_TOKEN : undefined);

export const isRealDbConfigured = Boolean(
  rawUrl &&
  !rawUrl.includes('dummy') &&
  (rawUrl.startsWith('libsql:') || rawUrl.startsWith('https:') || rawUrl.startsWith('http:') || rawUrl.startsWith('wss:') || rawUrl.startsWith('ws:'))
);

let dbUrl = isRealDbConfigured ? (rawUrl as string) : 'https://dummy.turso.io';

const client = createClient({
  url: dbUrl,
  authToken: authToken || '',
});

export const db = drizzle(client, { schema });
export { client };
export * from './schema';
