import { migrations } from '@/db/migrations';
import { query, withDatabaseClient } from '@/db/pool';

export { closeDatabase, getDatabasePool, query, withDatabaseClient } from '@/db/pool';

export async function migrateDatabase() {
  await withDatabaseClient(async (client) => {
    await client.query('BEGIN');

    try {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('motivo_schema_migrations'))");
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version text PRIMARY KEY,
          name text NOT NULL,
          applied_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      const appliedResult = await client.query<{ version: string }>(
        'SELECT version FROM schema_migrations',
      );
      const appliedVersions = new Set(appliedResult.rows.map((row) => row.version));

      for (const migration of migrations) {
        if (appliedVersions.has(migration.version)) {
          continue;
        }

        await client.query(migration.sql);
        await client.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [
          migration.version,
          migration.name,
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function resetDatabase() {
  await query('DELETE FROM sessions');
  await query('DELETE FROM motivo_files');
  await query('DELETE FROM users');
}
