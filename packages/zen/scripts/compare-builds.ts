#!/usr/bin/env bun
/**
 * Compare Standard vs Optimized Build
 *
 * Compares bundle size and performance between:
 * - Standard build (dist/index.js)
 * - Optimized build (dist/optimized/zen-optimized.js)
 */

import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

interface BuildStats {
  name: string;
  path: string;
  raw: number;
  minified: number;
  gzipped: number;
  brotli?: number;
}

function getFileSize(path: string): number {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

function getGzipSize(path: string): number {
  try {
    const content = readFileSync(path);
    return gzipSync(content, { level: 9 }).length;
  } catch {
    return 0;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
}

function formatDiff(original: number, optimized: number): string {
  const diff = ((optimized - original) / original) * 100;
  const sign = diff > 0 ? '+' : '';
  const color = diff < 0 ? '\x1b[32m' : diff > 0 ? '\x1b[31m' : '\x1b[33m';
  const reset = '\x1b[0m';
  return `${color}${sign}${diff.toFixed(1)}%${reset}`;
}

async function analyzeBuild(name: string, path: string): Promise<BuildStats> {
  const raw = getFileSize(path);
  const gzipped = getGzipSize(path);

  return {
    name,
    path,
    raw,
    minified: raw, // bunup already minifies
    gzipped,
  };
}

async function main() {
  console.log('🔬 Comparing Standard vs Optimized vs Ultra Builds\n');

  const distDir = join(import.meta.dir, '../dist');

  // Analyze builds
  const standard = await analyzeBuild('Standard', join(distDir, 'index.js'));
  const optimized = await analyzeBuild('Optimized', join(distDir, 'optimized/zen-optimized.js'));
  const ultra = await analyzeBuild('Ultra', join(distDir, 'ultra/zen-ultra.js'));

  // Print results
  console.log('📦 Bundle Sizes:\n');
  console.log('┌─────────────┬──────────────┬──────────────┬────────────┐');
  console.log('│ Build       │ Raw          │ Minified     │ Gzipped    │');
  console.log('├─────────────┼──────────────┼──────────────┼────────────┤');
  console.log(
    `│ Standard    │ ${formatBytes(standard.raw).padEnd(12)} │ ${formatBytes(standard.minified).padEnd(12)} │ ${formatBytes(standard.gzipped).padEnd(10)} │`,
  );
  console.log(
    `│ Optimized   │ ${formatBytes(optimized.raw).padEnd(12)} │ ${formatBytes(optimized.minified).padEnd(12)} │ ${formatBytes(optimized.gzipped).padEnd(10)} │`,
  );
  console.log(
    `│ Ultra       │ ${formatBytes(ultra.raw).padEnd(12)} │ ${formatBytes(ultra.minified).padEnd(12)} │ ${formatBytes(ultra.gzipped).padEnd(10)} │`,
  );
  console.log('└─────────────┴──────────────┴──────────────┴────────────┘\n');

  // Calculate savings
  console.log('💰 Size Reduction (vs Standard):\n');
  console.log(`Optimized - Raw:      ${formatDiff(standard.raw, optimized.raw)}`);
  console.log(`Optimized - Minified: ${formatDiff(standard.minified, optimized.minified)}`);
  console.log(`Optimized - Gzipped:  ${formatDiff(standard.gzipped, optimized.gzipped)}`);
  console.log();
  console.log(`Ultra - Raw:      ${formatDiff(standard.raw, ultra.raw)}`);
  console.log(`Ultra - Minified: ${formatDiff(standard.minified, ultra.minified)}`);
  console.log(`Ultra - Gzipped:  ${formatDiff(standard.gzipped, ultra.gzipped)}`);
  console.log();

  // Absolute savings
  const optRawSaved = standard.raw - optimized.raw;
  const optGzipSaved = standard.gzipped - optimized.gzipped;
  const ultraRawSaved = standard.raw - ultra.raw;
  const ultraGzipSaved = standard.gzipped - ultra.gzipped;

  console.log(`Optimized Saved: ${formatBytes(optRawSaved)} raw, ${formatBytes(optGzipSaved)} gzipped`);
  console.log(`Ultra Saved: ${formatBytes(ultraRawSaved)} raw, ${formatBytes(ultraGzipSaved)} gzipped\n`);

  // Print what's included/excluded
  console.log('📋 Build Contents:\n');
  console.log('Standard Build includes:');
  console.log('  ✅ zen, computed, computedAsync, select, map, deepMap');
  console.log('  ✅ batch, subscribe, get, set');
  console.log('  ✅ effect, batched, batchedUpdate');
  console.log('  ✅ onSet, onNotify, onStart, onStop, onMount');
  console.log('  ✅ untracked, tracked, isTracking');
  console.log('  ✅ mapCreator, listenKeys, listenPaths');
  console.log();
  console.log('Optimized Build includes:');
  console.log('  ✅ zen, computed, computedAsync, select, map');
  console.log('  ✅ batch, subscribe, setKey');
  console.log('  ❌ get/set (use .value property)');
  console.log('  ❌ deepMap, effect, batched, lifecycle, untracked, mapCreator');
  console.log();
  console.log('Ultra Build includes:');
  console.log('  ✅ zen, computed, computedAsync');
  console.log('  ✅ batch, subscribe');
  console.log('  ❌ select (use computed)');
  console.log('  ❌ map/setKey (use zen with objects)');
  console.log('  ❌ get/set (use .value property)');
  console.log('  ❌ All advanced features');
  console.log();

  // Recommendations
  console.log('💡 Build Selection Guide:\n');
  console.log('📦 Standard Build (Full-Featured):');
  console.log('   Use when you need all features and APIs');
  console.log('   Perfect for: Complex apps, prototyping, full feature set\n');

  if (optGzipSaved > 0) {
    const optPercentage = ((optGzipSaved / standard.gzipped) * 100).toFixed(1);
    console.log('⚡ Optimized Build (Balanced):');
    console.log(`   ${optPercentage}% smaller, keeps most commonly used features`);
    console.log('   Perfect for: Production apps, most use cases\n');
  }

  if (ultraGzipSaved > 0) {
    const ultraPercentage = ((ultraGzipSaved / standard.gzipped) * 100).toFixed(1);
    console.log('🚀 Ultra Build (Maximum Performance):');
    console.log(`   ${ultraPercentage}% smaller, absolute minimum bundle size`);
    console.log('   Perfect for: Libraries, embedded widgets, maximum size optimization');
  }
}

main().catch(console.error);
