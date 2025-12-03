import path from 'node:path';
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'rapid-craft',
      root: './packages/rapid-craft',
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@sylphx/signal': path.resolve(__dirname, './packages/signal/src/index.ts'),
      },
    },
  },
  {
    test: {
      name: 'rapid-patterns',
      root: './packages/rapid-patterns',
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@sylphx/signal': path.resolve(__dirname, './packages/signal/src/index.ts'),
      },
    },
  },
  {
    test: {
      name: 'rapid-router',
      root: './packages/rapid-router',
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@sylphx/signal': path.resolve(__dirname, './packages/signal/src/index.ts'),
        '@sylphx/rapid-patterns': path.resolve(__dirname, './packages/rapid-patterns/src/index.ts'),
      },
    },
  },
  {
    test: {
      name: 'rapid-persistent',
      root: './packages/rapid-persistent',
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@sylphx/signal': path.resolve(__dirname, './packages/signal/src/index.ts'),
        '@sylphx/rapid-patterns': path.resolve(__dirname, './packages/rapid-patterns/src/index.ts'),
      },
    },
  },
  {
    test: {
      name: 'rapid-vue',
      root: './packages/rapid-vue',
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@sylphx/signal': path.resolve(__dirname, './packages/signal/src/index.ts'),
      },
    },
  },
  {
    test: {
      name: 'rapid-router-react',
      root: './packages/rapid-router-react',
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@sylphx/signal': path.resolve(__dirname, './packages/signal/src/index.ts'),
        '@sylphx/rapid-patterns': path.resolve(__dirname, './packages/rapid-patterns/src/index.ts'),
        '@sylphx/rapid-router': path.resolve(__dirname, './packages/rapid-router/src/index.ts'),
      },
    },
  },
]);
