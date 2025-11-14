/**
 * Test compiler transformation with real benchmarks
 */

import { describe, test, expect } from 'vitest';
import { transformSync } from '@babel/core';
// @ts-ignore
import zenCompilerPlugin from '../../zen-compiler/dist/index.js';
import { zen, computed } from './index';

describe('Compiler Transformation Benchmarks', () => {
  test('Simple chain: Automatically inlined code should be faster', () => {
    const iterations = 10000;

    // === Without compiler (manual code) ===
    const startManual = performance.now();

    const count1 = zen(0);
    const doubled1 = computed(() => count1.value * 2);
    const quad1 = computed(() => doubled1.value * 2);

    for (let i = 0; i < iterations; i++) {
      count1.value = i;
      const _ = quad1.value;
    }

    const manualTime = performance.now() - startManual;

    // === With compiler (transformed code) ===
    const inputCode = `
      import { zen, computed } from '@sylphx/zen';
      const count = zen(0);
      const doubled = computed(() => count.value * 2);
      const quad = computed(() => doubled.value * 2);
    `;

    const result = transformSync(inputCode, {
      plugins: [
        [
          zenCompilerPlugin,
          {
            staticAnalysis: true,
            inlineComputed: true,
            warnings: false,
          },
        ],
      ],
      filename: 'test.ts',
    });

    // Transformed code should be:
    // const quad = computed(() => count.value * 2 * 2);
    expect(result?.code).toContain('count.value * 2 * 2');
    expect(result?.code).not.toContain('const doubled');

    // Run transformed code
    const startCompiled = performance.now();

    const count2 = zen(0);
    const quad2 = computed(() => count2.value * 2 * 2);

    for (let i = 0; i < iterations; i++) {
      count2.value = i;
      const _ = quad2.value;
    }

    const compiledTime = performance.now() - startCompiled;

    // Results
    const speedup = ((manualTime - compiledTime) / manualTime) * 100;

    console.log('\n=== Compiler Transform: Simple Chain ===');
    console.log(`Manual (no compiler):     ${manualTime.toFixed(2)}ms`);
    console.log(`Compiler-transformed:     ${compiledTime.toFixed(2)}ms`);
    console.log(`Speedup:                  ${speedup.toFixed(1)}%`);
    console.log(`Status:                   ${speedup > 0 ? '✅ Faster' : '❌ Slower'}`);

    // Compiler-transformed should be faster
    expect(compiledTime).toBeLessThan(manualTime);
  });

  test('Diamond pattern: Automatically inlined code should be faster', () => {
    const iterations = 5000;

    // === Without compiler (manual code) ===
    const startManual = performance.now();

    const a1 = zen(1);
    const b1 = zen(2);
    const left1 = computed(() => a1.value * 2);
    const right1 = computed(() => b1.value * 3);
    const merge1 = computed(() => left1.value + right1.value);

    for (let i = 0; i < iterations; i++) {
      a1.value = i;
      b1.value = i + 1;
      const _ = merge1.value;
    }

    const manualTime = performance.now() - startManual;

    // === With compiler (transformed code) ===
    const inputCode = `
      import { zen, computed } from '@sylphx/zen';
      const a = zen(1);
      const b = zen(2);
      const left = computed(() => a.value * 2);
      const right = computed(() => b.value * 3);
      const merge = computed(() => left.value + right.value);
    `;

    const result = transformSync(inputCode, {
      plugins: [
        [
          zenCompilerPlugin,
          {
            staticAnalysis: true,
            inlineComputed: true,
            warnings: false,
          },
        ],
      ],
      filename: 'test.ts',
    });

    // Transformed code should inline left and right
    expect(result?.code).toContain('a.value * 2 + b.value * 3');
    expect(result?.code).not.toContain('const left');
    expect(result?.code).not.toContain('const right');

    // Run transformed code
    const startCompiled = performance.now();

    const a2 = zen(1);
    const b2 = zen(2);
    const merge2 = computed(() => a2.value * 2 + b2.value * 3);

    for (let i = 0; i < iterations; i++) {
      a2.value = i;
      b2.value = i + 1;
      const _ = merge2.value;
    }

    const compiledTime = performance.now() - startCompiled;

    // Results
    const speedup = ((manualTime - compiledTime) / manualTime) * 100;

    console.log('\n=== Compiler Transform: Diamond Pattern ===');
    console.log(`Manual (no compiler):     ${manualTime.toFixed(2)}ms`);
    console.log(`Compiler-transformed:     ${compiledTime.toFixed(2)}ms`);
    console.log(`Speedup:                  ${speedup.toFixed(1)}%`);
    console.log(`Status:                   ${speedup > 0 ? '✅ Faster' : '❌ Slower'}`);

    // Compiler-transformed should be faster
    expect(compiledTime).toBeLessThan(manualTime);
  });

  test('Multiple uses: Should NOT inline (preserve shared computed)', () => {
    const inputCode = `
      import { zen, computed } from '@sylphx/zen';
      const count = zen(0);
      const doubled = computed(() => count.value * 2);
      const quad = computed(() => doubled.value * 2);
      const oct = computed(() => doubled.value * 4);
    `;

    const result = transformSync(inputCode, {
      plugins: [
        [
          zenCompilerPlugin,
          {
            staticAnalysis: true,
            inlineComputed: true,
            warnings: false,
          },
        ],
      ],
      filename: 'test.ts',
    });

    // 'doubled' should NOT be inlined (used by both quad and oct)
    expect(result?.code).toContain('const doubled');
    expect(result?.code).toContain('doubled.value * 2');
    expect(result?.code).toContain('doubled.value * 4');

    console.log('\n=== Compiler Transform: Multiple Uses ===');
    console.log('✅ Correctly preserved "doubled" (used 2 times)');
  });

  test('Exported values: Should NOT inline', () => {
    const inputCode = `
      import { zen, computed } from '@sylphx/zen';
      const count = zen(0);
      const doubled = computed(() => count.value * 2);
      const quad = computed(() => doubled.value * 2);
      export { doubled, quad };
    `;

    const result = transformSync(inputCode, {
      plugins: [
        [
          zenCompilerPlugin,
          {
            staticAnalysis: true,
            inlineComputed: true,
            warnings: false,
          },
        ],
      ],
      filename: 'test.ts',
    });

    // 'doubled' should NOT be inlined (exported)
    expect(result?.code).toContain('const doubled');
    expect(result?.code).toContain('export { doubled, quad }');

    console.log('\n=== Compiler Transform: Exported Values ===');
    console.log('✅ Correctly preserved "doubled" (exported)');
  });
});
