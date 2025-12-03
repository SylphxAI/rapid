import zenCompiler from '@rapid/compiler';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    zenCompiler({ importSource: '@rapid/web' }),
    Icons({
      compiler: 'raw',
      autoInstall: true,
      defaultClass: 'icon',
    }),
  ],
  esbuild: {
    // Disable esbuild's JSX transformation - let zenCompiler (Babel) handle it
    jsx: 'preserve',
  },
});
