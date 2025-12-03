try {
  // Test main exports
  const { unplugin, vitePlugin, webpackPlugin, rollupPlugin, esbuildPlugin } = await import(
    './dist/index.js'
  );

  // Test bundler-specific exports
  const _vite = await import('./dist/vite.js');

  const _webpack = await import('./dist/webpack.js');

  const _rollup = await import('./dist/rollup.js');

  const _esbuild = await import('./dist/esbuild.js');
  const _reactRuntime = await import('./jsx-runtime/react/index.tsx');

  const _vueRuntime = await import('./jsx-runtime/vue/index.ts');

  const _sveltePreprocessor = await import('./svelte-preprocessor/index.ts');
} catch (_error) {
  process.exit(1);
}
