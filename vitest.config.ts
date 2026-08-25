import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next'],
    testTimeout: 30000,
    hookTimeout: 60000,
    // Pin the timezone so date/time normalization tests are deterministic
    // regardless of the host machine's local timezone.
    env: { TZ: 'UTC' },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});