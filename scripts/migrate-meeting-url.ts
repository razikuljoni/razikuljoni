import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import fs from 'fs';
import { siteSettings } from '../src/db/schema';

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}

const dbUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || '';
const newMeetingUrl = process.env.PUBLIC_MEETING_URL || 'https://cal.com/razikuljoni/15min';

console.log(`🔗 Connecting to database: ${dbUrl.startsWith('file:') ? dbUrl : dbUrl.replace(/\/\/.*@/, '//***@')}`);

const client = createClient({
  url: dbUrl,
  authToken,
});

const db = drizzle(client);

async function migrateMeetingUrl() {
  try {
    const existing = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'meeting_url'))
      .limit(1);

    if (existing.length === 0) {
      console.log('ℹ️ meeting_url setting not found in DB. Inserting default meeting URL...');
      await db.insert(siteSettings).values({
        key: 'meeting_url',
        value: newMeetingUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ meeting_url inserted: ${newMeetingUrl}`);
    } else {
      const current = existing[0]?.value || '';
      console.log(`Current stored meeting_url: "${current}"`);

      if (!current || /linkedin\.com/i.test(current)) {
        console.log(`🔄 Migrating legacy LinkedIn/empty meeting_url -> "${newMeetingUrl}"`);
        await db
          .update(siteSettings)
          .set({
            value: newMeetingUrl,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(siteSettings.key, 'meeting_url'));
        console.log(`✅ Stored meeting_url successfully migrated to ${newMeetingUrl}`);
      } else {
        console.log(`✅ meeting_url is already non-legacy (${current}). No migration needed.`);
      }
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  process.exit(0);
}

migrateMeetingUrl();
