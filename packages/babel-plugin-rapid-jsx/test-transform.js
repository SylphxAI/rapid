/**
 * Test the Babel transform output
 */

import { transformSync } from '@babel/core';
import zenJsxPlugin from './dist/index.js';

const inputCode = `
import { jsx } from '@rapid/tui/jsx-runtime';

const element = jsx(Provider, {
  value: x,
  children: jsx(Child, {})
});
`;

const result = transformSync(inputCode, {
  plugins: [zenJsxPlugin],
  filename: 'test.tsx',
});

console.log('Input:');
console.log(inputCode);
console.log('\nOutput:');
console.log(result.code);
