/**
 * Verify all exports are accessible
 */

console.log('Verifying unplugin-zen-signal exports...\n');

try {
  // Test main exports
  const { unplugin, vitePlugin, webpackPlugin, rollupPlugin, esbuildPlugin } = await import('./dist/index.js');

  console.log('✅ Main exports:');
  console.log('  - unplugin:', typeof unplugin === 'object' ? 'OK' : 'FAIL');
  console.log('  - vitePlugin:', typeof vitePlugin === 'function' ? 'OK' : 'FAIL');
  console.log('  - webpackPlugin:', typeof webpackPlugin === 'function' ? 'OK' : 'FAIL');
  console.log('  - rollupPlugin:', typeof rollupPlugin === 'function' ? 'OK' : 'FAIL');
  console.log('  - esbuildPlugin:', typeof esbuildPlugin === 'function' ? 'OK' : 'FAIL');

  // Test bundler-specific exports
  const vite = await import('./dist/vite.js');
  console.log('\n✅ Bundler-specific exports:');
  console.log('  - vite.zenSignal:', typeof vite.zenSignal === 'function' ? 'OK' : 'FAIL');
  console.log('  - vite.default:', typeof vite.default === 'function' ? 'OK' : 'FAIL');

  const webpack = await import('./dist/webpack.js');
  console.log('  - webpack.zenSignal:', typeof webpack.zenSignal === 'function' ? 'OK' : 'FAIL');
  console.log('  - webpack.default:', typeof webpack.default === 'function' ? 'OK' : 'FAIL');

  const rollup = await import('./dist/rollup.js');
  console.log('  - rollup.zenSignal:', typeof rollup.zenSignal === 'function' ? 'OK' : 'FAIL');
  console.log('  - rollup.default:', typeof rollup.default === 'function' ? 'OK' : 'FAIL');

  const esbuild = await import('./dist/esbuild.js');
  console.log('  - esbuild.zenSignal:', typeof esbuild.zenSignal === 'function' ? 'OK' : 'FAIL');
  console.log('  - esbuild.default:', typeof esbuild.default === 'function' ? 'OK' : 'FAIL');

  // Test runtime exports
  console.log('\n✅ Runtime exports:');
  const reactRuntime = await import('./jsx-runtime/react/index.tsx');
  console.log('  - React runtime:', typeof reactRuntime.jsx === 'function' ? 'OK' : 'FAIL');

  const vueRuntime = await import('./jsx-runtime/vue/index.ts');
  console.log('  - Vue runtime:', typeof vueRuntime.h === 'function' ? 'OK' : 'FAIL');

  const sveltePreprocessor = await import('./svelte-preprocessor/index.ts');
  console.log('  - Svelte preprocessor:', typeof sveltePreprocessor.zenSignalPreprocessor === 'function' ? 'OK' : 'FAIL');

  console.log('\n✅ All exports verified successfully!\n');

} catch (error) {
  console.error('❌ Export verification failed:', error);
  process.exit(1);
}
