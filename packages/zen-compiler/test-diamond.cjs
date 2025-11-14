/**
 * Test automatic inlining with diamond pattern
 */

const { transformSync } = require('@babel/core');
const zenCompilerPlugin = require('./dist/index.cjs').default;

const inputCode = `
import { zen, computed } from '@sylphx/zen';

const a = zen(1);
const b = zen(2);
const left = computed(() => a.value * 2);
const right = computed(() => b.value * 3);
const merge = computed(() => left.value + right.value);

// Should inline 'left' and 'right' into 'merge'
// Result: const merge = computed(() => a.value * 2 + b.value * 3);
`;

console.log('=== Diamond Pattern Test ===\n');
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
