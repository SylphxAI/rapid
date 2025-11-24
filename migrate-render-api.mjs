#!/usr/bin/env node
/**
 * Migrate old render APIs to new renderApp API
 *
 * Transforms:
 * - renderToTerminalReactive(() => <App />, { fullscreen: true })
 *   => renderApp(() => <FullscreenLayout><App /></FullscreenLayout>)
 *
 * - renderToTerminalReactive(() => <App />)
 *   => renderApp(() => <App />)
 *
 * - Updates imports accordingly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Find all .tsx files in examples
function findTsxFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTsxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Migrate a single file
function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if file uses old API
  if (!content.includes('renderToTerminalReactive') &&
      !content.includes('renderToTerminalPersistent') &&
      !content.includes('renderToTerminal')) {
    return false; // No changes needed
  }

  // Detect if fullscreen mode is used
  const hasFullscreen = /renderToTerminal(?:Reactive|Persistent)?\([^)]+,\s*\{\s*fullscreen:\s*true\s*\}/.test(content);

  // Update imports
  // Remove old render functions from imports
  content = content.replace(
    /(\bimport\s+\{[^}]*)\brenderToTerminal(?:Reactive|Persistent)?\b,?\s*/g,
    '$1'
  );

  // Clean up import issues first
  content = content.replace(/,\s*,/g, ',');
  content = content.replace(/\{\s*,/g, '{');
  content = content.replace(/,\s*}/g, '}');

  // Add renderApp to imports (with comma before)
  if (!content.includes('renderApp')) {
    content = content.replace(
      /(\bimport\s+\{[^}]+?)(}\s+from\s+['"]@zen\/tui['"])/,
      (match, imports, closing) => {
        const trimmed = imports.trim();
        if (trimmed.endsWith(',')) {
          return `${trimmed} renderApp${closing}`;
        } else {
          return `${trimmed}, renderApp${closing}`;
        }
      }
    );
  }

  // Add FullscreenLayout if fullscreen is used
  if (hasFullscreen && !content.includes('FullscreenLayout')) {
    content = content.replace(
      /(\bimport\s+\{[^}]+?)(}\s+from\s+['"]@zen\/tui['"])/,
      (match, imports, closing) => {
        const trimmed = imports.trim();
        if (trimmed.endsWith(',')) {
          return `${trimmed} FullscreenLayout${closing}`;
        } else {
          return `${trimmed}, FullscreenLayout${closing}`;
        }
      }
    );
  }

  // Final cleanup
  content = content.replace(/,\s+/g, ', ');

  // Replace render calls with fullscreen
  content = content.replace(
    /await\s+renderToTerminal(?:Reactive|Persistent)?\(\s*\(\)\s*=>\s*([^,]+),\s*\{\s*fullscreen:\s*true\s*\}\s*\)/g,
    (match, component) => {
      const trimmed = component.trim();
      // Check if component is already wrapped in JSX
      if (trimmed.startsWith('<')) {
        return `await renderApp(() => (\n  <FullscreenLayout>\n    ${trimmed}\n  </FullscreenLayout>\n))`;
      } else {
        return `await renderApp(() => (\n  <FullscreenLayout>\n    <${trimmed} />\n  </FullscreenLayout>\n))`;
      }
    }
  );

  // Replace render calls without fullscreen (inline mode)
  content = content.replace(
    /await\s+renderToTerminal(?:Reactive|Persistent)?\(\s*\(\)\s*=>\s*([^)]+)\s*\)/g,
    'await renderApp(() => $1)'
  );

  // Special case: function call without arrow function wrapper
  content = content.replace(
    /await\s+renderToTerminal(?:Reactive|Persistent)?\(\s*([A-Z]\w+)\s*,\s*\{\s*fullscreen:\s*true\s*\}\s*\)/g,
    'await renderApp(() => (\n  <FullscreenLayout>\n    <$1 />\n  </FullscreenLayout>\n))'
  );

  content = content.replace(
    /await\s+renderToTerminal(?:Reactive|Persistent)?\(\s*([A-Z]\w+)\s*\)/g,
    'await renderApp(() => <$1 />)'
  );

  // Write back
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

// Main
const examplesDir = path.join(__dirname, 'examples');
const files = findTsxFiles(examplesDir);

let migrated = 0;
let errors = 0;

console.log(`Found ${files.length} .tsx files`);

for (const file of files) {
  try {
    if (migrateFile(file)) {
      console.log(`✓ Migrated: ${path.relative(examplesDir, file)}`);
      migrated++;
    }
  } catch (err) {
    console.error(`✗ Error migrating ${path.relative(examplesDir, file)}: ${err.message}`);
    errors++;
  }
}

console.log(`\nMigration complete: ${migrated} files migrated, ${errors} errors`);
