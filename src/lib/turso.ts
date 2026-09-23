import { createClient } from "@libsql/client";

const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.TURSO_DATABASE_URL : undefined) || (typeof process !== 'undefined' ? process.env.TURSO_DATABASE_URL : undefined);
const authToken = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.TURSO_AUTH_TOKEN : undefined) || (typeof process !== 'undefined' ? process.env.TURSO_AUTH_TOKEN : undefined);

export const isTursoConfigured = Boolean(
  rawUrl &&
  !rawUrl.includes('dummy') &&
  (rawUrl.startsWith('libsql:') || rawUrl.startsWith('https:') || rawUrl.startsWith('http:') || rawUrl.startsWith('wss:') || rawUrl.startsWith('ws:'))
);

let dbUrl = isTursoConfigured ? (rawUrl as string) : 'https://dummy.turso.io';

export const turso = createClient({
    url: dbUrl,
    authToken: authToken,
});

export async function getGlobalClicks(): Promise<number> {
    try {
        const result = await turso.execute("SELECT count FROM clicks WHERE id = 'global'");
        if (result.rows.length === 0) {
            const startVal = 152162;
            await turso.execute({
                sql: "INSERT INTO clicks (id, count) VALUES ('global', ?)",
                args: [startVal]
            });
            return startVal;
        }
        return Number(result.rows[0].count);
    } catch (e) {
        try {
            await turso.execute(`
                CREATE TABLE IF NOT EXISTS clicks (
                    id TEXT PRIMARY KEY,
                    count INTEGER
                )
            `);
            const result = await turso.execute("SELECT count FROM clicks WHERE id = 'global'");
            if (result.rows.length === 0) {
                const startVal = 152162;
                await turso.execute({
                    sql: "INSERT INTO clicks (id, count) VALUES ('global', ?)",
                    args: [startVal]
                });
                return startVal;
            }
            return Number(result.rows[0].count);
        } catch (e2) {
            return 152162;
        }
    }
}

export async function incrementGlobalClicks(amount: number): Promise<number> {
    try {
        const result = await turso.execute({
            sql: "UPDATE clicks SET count = count + ? WHERE id = 'global' RETURNING count",
            args: [amount]
        });

        if (result.rows.length > 0) {
            return Number(result.rows[0].count);
        }
        return await getGlobalClicks();
    } catch (e) {
        return 0;
    }
}
