import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'jsx-runtime': 'src/jsx-runtime.ts',
  },
  format: ['esm'],
  dts: false, // Disable for now - types inferred from source
  clean: true,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
  treeshake: true,
  external: [
    '@zen/runtime',
    '@zen/signal',
    '@zen/tui/jsx-runtime',
    'chalk',
    'cli-boxes',
    'string-width',
    'strip-ansi',
  ],
});
