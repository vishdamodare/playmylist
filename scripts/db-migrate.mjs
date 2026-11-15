// Applies db/schema.sql over the DIRECT (unpooled) connection, as Neon recommends for schema changes.
import { readFile } from "node:fs/promises";
import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // env may already be injected (CI / neon-env run)
}
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set — run `neon env pull` first");

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(await readFile(new URL("../db/schema.sql", import.meta.url), "utf8"));
  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema='public' order by 1"
  );
  console.log("schema applied; tables:", rows.map((r) => r.table_name).join(", "));
} finally {
  await client.end();
}
