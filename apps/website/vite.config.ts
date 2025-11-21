import zenCompiler from '@zen/compiler';
// import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    zenCompiler({ importSource: '@zen/web' }),
    // Icons plugin disabled - requires @svgr/core dependency
    // Icons({
    //   compiler: 'jsx',
    //   jsx: 'react',
    //   defaultClass: 'icon',
    // }),
  ],
  esbuild: {
    // Disable esbuild's JSX transformation - let zenCompiler (Babel) handle it
    jsx: 'preserve',
  },
});
