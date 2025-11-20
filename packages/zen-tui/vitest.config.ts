import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    env: {
      FORCE_COLOR: '1', // Force chalk to use colors in tests
    },
  },
});
