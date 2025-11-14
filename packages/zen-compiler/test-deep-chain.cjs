/**
 * Test automatic inlining with deep chain
 */

const { transformSync } = require('@babel/core');
const zenCompilerPlugin = require('./dist/index.cjs').default;

const inputCode = `
import { zen, computed } from '@sylphx/zen';

const base = zen(0);
const c1 = computed(() => base.value + 1);
const c2 = computed(() => c1.value + 1);
const c3 = computed(() => c2.value + 1);
const c4 = computed(() => c3.value + 1);
const c5 = computed(() => c4.value + 1);

// Should inline c1, c2, c3, c4 into c5
// Result: const c5 = computed(() => base.value + 5);
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
