#!/usr/bin/env node

/**
 * Fix bunup duplicate export bug
 *
 * bunup generates duplicate exports in jsx-runtime.js:
 * - Line 1: export { jsx, appendChild, Fragment, ... }
 * - Line 2: export { __toESM, __toCommonJS, __commonJS, __export, __esm, appendChild, Fragment }
 *
 * This script removes appendChild and Fragment from the second export.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsxRuntimePath = join(__dirname, '../dist/jsx-runtime.js');

try {
  let content = readFileSync(jsxRuntimePath, 'utf-8');

  // Match the problematic export line with duplicate exports
  const duplicateExportPattern = /export\s*{\s*__toESM,\s*__toCommonJS,\s*__commonJS,\s*__export,\s*__esm,\s*appendChild,\s*Fragment\s*};/;

  // Replace with fixed export (only CommonJS helpers)
  const fixedExport = 'export { __toESM, __toCommonJS, __commonJS, __export, __esm };';

  if (duplicateExportPattern.test(content)) {
    content = content.replace(duplicateExportPattern, fixedExport);
    writeFileSync(jsxRuntimePath, content, 'utf-8');
    console.log('✓ Fixed duplicate exports in jsx-runtime.js');
  } else {
    console.log('✓ No duplicate exports found (already fixed or bunup updated)');
  }
} catch (error) {
  console.error('✗ Failed to fix exports:', error.message);
  process.exit(1);
}
