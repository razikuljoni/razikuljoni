// Helper functions for admin authentication
import { db, adminSessions } from '../db';
import { eq, lt } from 'drizzle-orm';

export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function getSessionExpiry(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7); // Session valid for 7 days
  return date.toISOString();
}

export async function createSession(): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = getSessionExpiry();
  
  await db.insert(adminSessions).values({
    sessionToken: token,
    expiresAt: expiresAt,
  });
  
  return token;
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    const sessions = await db.select().from(adminSessions).where(eq(adminSessions.sessionToken, token));
    if (sessions.length === 0) return false;
    const session = sessions[0];
    return new Date(session.expiresAt) > new Date();
  } catch {
    return false;
  }
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.sessionToken, token));
}

export async function cleanExpiredSessions(): Promise<void> {
  const now = new Date().toISOString();
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, now));
}

export function verifyCredentials(username: string, password: string): boolean {
  const getEnv = (key: string) => (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : undefined) || (typeof process !== 'undefined' ? process.env[key] : undefined);
  const adminUsername = getEnv('ADMIN_USERNAME');
  const adminPassword = getEnv('ADMIN_PASSWORD');
  
  if (!adminUsername || !adminPassword) return false;
  
  return username === adminUsername && password === adminPassword;
}
