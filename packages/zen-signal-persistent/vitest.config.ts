import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@zen/zen': path.resolve(__dirname, '../zen/src/index.ts'),
      '@zen/zen-patterns': path.resolve(__dirname, '../zen-patterns/src/index.ts'),
    },
  },
});
