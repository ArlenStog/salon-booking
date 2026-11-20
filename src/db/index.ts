import "server-only";
import path from "node:path";
import bcrypt from "bcryptjs";
import { schemaSql } from "./schema";

/**
 * Tiny database layer over plain SQL.
 *
 * - Production (Vercel): DATABASE_URL points at a hosted Postgres (e.g. Neon)
 *   and we use node-postgres.
 * - Local dev / tests: no DATABASE_URL, so we run PGlite — real Postgres
 *   compiled to WASM — so nobody has to install Postgres to try the project.
 *
 * Both expose `query(text, params)` returning `{ rows }`, so the rest of the
 * app doesn't care which one it is talking to.
 */

export type Queryable = {
  query<T>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
};

type Db = Queryable & {
  transaction<R>(fn: (tx: Queryable) => Promise<R>): Promise<R>;
};

async function createDb(): Promise<Db> {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    return {
      query: async <T>(text: string, params?: unknown[]) => {
        const res = await pool.query(text, params);
        return { rows: res.rows as T[] };
      },
      transaction: async (fn) => {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const tx: Queryable = {
            query: async <T>(text: string, params?: unknown[]) => {
              const res = await client.query(text, params);
              return { rows: res.rows as T[] };
            },
          };
          const result = await fn(tx);
          await client.query("COMMIT");
          return result;
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
      },
    };
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const dataDir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".pglite");
  const pg = new PGlite(dataDir);
  return {
    query: <T>(text: string, params?: unknown[]) => pg.query<T>(text, params),
    transaction: (fn) => pg.transaction((tx) => fn({ query: <T>(t: string, p?: unknown[]) => tx.query<T>(t, p) })),
  };
}

async function init(): Promise<Db> {
  const db = await createDb();
  // Run statements one by one: parameterless multi-statement strings are
  // handled differently by node-postgres and PGlite.
  for (const statement of schemaSql.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean)) {
    await db.query(statement);
  }
  await seedAdmin(db);
  return db;
}

async function seedAdmin(db: Db) {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const hash = await bcrypt.hash(password, 10);
  await db.query(
    `INSERT INTO users (email, name, password_hash, role) VALUES ($1, 'Salon admin', $2, 'admin')
     ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
    [email, hash],
  );
}

// Cache the connection across hot reloads in dev and across requests in a warm lambda.
const globalForDb = globalThis as unknown as { __db?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!globalForDb.__db) {
    globalForDb.__db = init().catch((err) => {
      globalForDb.__db = undefined;
      throw err;
    });
  }
  return globalForDb.__db;
}
