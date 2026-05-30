import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

import environment from '@/config';

let pool: Pool | undefined;
let poolDatabaseUrl: string | undefined;

export function getDatabasePool() {
  const databaseUrl = environment.database_url;

  if (!pool || poolDatabaseUrl !== databaseUrl) {
    pool = new Pool({ connectionString: databaseUrl });
    poolDatabaseUrl = databaseUrl;
  }

  return pool;
}

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: readonly unknown[],
): Promise<QueryResult<T>> {
  return getDatabasePool().query<T>(text, values ? [...values] : undefined);
}

export async function withDatabaseClient<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await getDatabasePool().connect();

  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

export async function closeDatabase() {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = undefined;
  poolDatabaseUrl = undefined;
}
