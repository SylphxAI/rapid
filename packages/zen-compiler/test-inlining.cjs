/**
 * Test automatic inlining transformation
 */

const { transformSync } = require('@babel/core');
const zenCompilerPlugin = require('./dist/index.cjs').default;

const inputCode = `
import { zen, computed } from '@sylphx/zen';

const count = zen(0);
const doubled = computed(() => count.value * 2);
const quad = computed(() => doubled.value * 2);

// Should inline 'doubled' into 'quad'
// Result: const quad = computed(() => count.value * 2 * 2);
`;

const _result = transformSync(inputCode, {
  plugins: [
    [
      zenCompilerPlugin,
      {
        staticAnalysis: true,
        inlineComputed: true,
        warnings: true,
        moduleName: '@sylphx/zen',
      },
    ],
  ],
  filename: 'test.ts',
});
