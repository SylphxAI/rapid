/**
 * Test that multiple-use computed is NOT inlined
 */

const { transformSync } = require('@babel/core');
const zenCompilerPlugin = require('./dist/index.cjs').default;

const inputCode = `
import { zen, computed } from '@sylphx/zen';

const count = zen(0);
const doubled = computed(() => count.value * 2);
const quad = computed(() => doubled.value * 2);
const oct = computed(() => doubled.value * 4);

// 'doubled' is used by BOTH quad and oct
// Should NOT inline 'doubled' (would duplicate work)
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
