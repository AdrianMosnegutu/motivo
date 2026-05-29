import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tests': resolve(__dirname, 'tests'),
    },
  },
  test: {
    setupFiles: ['./tests/setup.ts'],
    // Integration tests share one Postgres database; parallel files race on resetDatabase().
    fileParallelism: false,
    coverage: {
      all: true,
      exclude: ['dist/**', 'tests/**', 'vitest.config.ts', 'eslint.config.mjs'],
      provider: 'v8',
      reportOnFailure: true,
      reporter: ['text', 'html', 'lcov', 'json-summary', 'json'],
      reportsDirectory: 'coverage',
    },
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
