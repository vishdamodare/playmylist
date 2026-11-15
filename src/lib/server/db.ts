import { Pool } from "pg";

// One pool per server process, on the POOLED connection (PgBouncer) as Neon recommends for app traffic.
// Kept on globalThis so Next's dev hot-reload doesn't open a new pool per edit.
const g = globalThis as unknown as { pmlPool?: Pool };

export const db =
  g.pmlPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== "production") g.pmlPool = db;
