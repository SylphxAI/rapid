/**
 * Auto-detect framework from package.json
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export type Framework = 'react' | 'vue' | 'svelte' | 'zen';

/**
 * Detect framework from package.json dependencies
 */
export function detectFramework(cwd: string = process.cwd()): Framework | null {
  const packageJsonPath = join(cwd, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check in priority order
    if (deps['@zen/zen']) return 'zen';
    if (deps.react || deps['react-dom']) return 'react';
    if (deps.vue) return 'vue';
    if (deps.svelte) return 'svelte';

    return null;
  } catch {
    return null;
  }
}
