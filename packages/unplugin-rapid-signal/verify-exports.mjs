try {
  // Test main exports - verify they exist
  const {
    unplugin: _unplugin,
    vitePlugin: _vitePlugin,
    webpackPlugin: _webpackPlugin,
    rollupPlugin: _rollupPlugin,
    esbuildPlugin: _esbuildPlugin,
  } = await import('./dist/index.js');

  // Test bundler-specific exports
  await import('./dist/vite.js');
  await import('./dist/webpack.js');
  await import('./dist/rollup.js');
  await import('./dist/esbuild.js');
  await import('./jsx-runtime/react/index.tsx');
  await import('./jsx-runtime/vue/index.ts');
  await import('./svelte-preprocessor/index.ts');
} catch (_error) {
  process.exit(1);
}
