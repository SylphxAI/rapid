#!/usr/bin/env node
/**
 * Fix CJS bundle size by creating proper re-exports
 * instead of bundling the entire plugin into each entry
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

// Create CJS re-exports for bundler-specific files
const bundlers = ['vite', 'webpack', 'rollup', 'esbuild'];

for (const bundler of bundlers) {
  const cjsFile = join(distDir, `${bundler}.cjs`);

  // CJS re-export that requires from index.cjs
  const content = `'use strict';

var index = require('./index.cjs');

Object.defineProperty(exports, '__esModule', { value: true });

var _plugin = index.${bundler}Plugin;
exports.zenSignal = _plugin;
exports.default = _plugin;
`;

  writeFileSync(cjsFile, content, 'utf-8');
  console.log(`✅ Fixed ${bundler}.cjs`);
}

console.log('\n✅ CJS files fixed successfully!\n');
