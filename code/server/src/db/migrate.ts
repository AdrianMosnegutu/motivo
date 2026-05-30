import { closeDatabase, migrateDatabase } from '@/db';

void migrateDatabase()
  .then(() => {
    console.info('Database migrations complete');
  })
  .catch((error: unknown) => {
    console.error('Database migrations failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
