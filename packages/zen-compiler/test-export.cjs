/**
 * Test that exported computed is NOT inlined
 */

const { transformSync } = require('@babel/core');
const zenCompilerPlugin = require('./dist/index.cjs').default;

const inputCode = `
import { zen, computed } from '@sylphx/zen';

const count = zen(0);
const doubled = computed(() => count.value * 2);
const quad = computed(() => doubled.value * 2);

export { doubled, quad };

// 'doubled' is exported, so it MUST remain in the output
// even though it's only used once internally
`;

console.log('=== Export Test (should NOT inline exported) ===\n');
console.log(inputCode);

console.log('\n=== Running Compiler Plugin ===\n');

const result = transformSync(inputCode, {
  plugins: [
    [zenCompilerPlugin, {
      staticAnalysis: true,
      inlineComputed: true,
      warnings: true,
      moduleName: '@sylphx/zen',
    }],
  ],
  filename: 'test.ts',
});

console.log('\n=== Output Code ===\n');
console.log(result.code);
console.log('\n✅ Expected: "doubled" should still exist (exported)');
