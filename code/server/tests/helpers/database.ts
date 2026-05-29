import { Client } from 'pg';
import { afterAll, beforeAll, beforeEach } from 'vitest';

import { closeDatabase, migrateDatabase, resetDatabase } from '@/db';

const defaultDatabaseUrl = 'postgres://motivo:motivo@localhost:5432/motivo_test';

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function ensureDefaultTestDatabase() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const databaseUrl = new URL(defaultDatabaseUrl);
  const databaseName = databaseUrl.pathname.slice(1);
  databaseUrl.pathname = '/postgres';

  const client = new Client({ connectionString: databaseUrl.toString() });
  await client.connect();

  try {
    const result = await client.query<{ exists: boolean }>(
      'SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1) AS exists',
      [databaseName],
    );

    if (!result.rows[0]?.exists) {
      await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    }
  } finally {
    await client.end();
  }

  process.env.DATABASE_URL = defaultDatabaseUrl;
}

export function useTestDatabase() {
  beforeAll(async () => {
    await ensureDefaultTestDatabase();
    process.env.SESSION_SECRET ??= 'test-session-secret';
    await migrateDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });
}
