/**
 * Bun preload script to apply Babel transform for lazy JSX children
 *
 * Usage: bun --preload ./scripts/babel-preload.js your-app.tsx
 */

import { plugin } from 'bun';
import { transformSync } from '@babel/core';
import zenJsxPlugin from '../packages/babel-plugin-zen-jsx/dist/index.js';

plugin({
  name: 'zen-jsx-transform',
  setup(build) {
    build.onLoad({ filter: /\.tsx$/ }, async (args) => {
      const text = await Bun.file(args.path).text();

      // Apply Babel transform
      const result = transformSync(text, {
        filename: args.path,
        plugins: [zenJsxPlugin],
        // Preserve JSX for Bun's built-in transform
        presets: [
          ['@babel/preset-typescript', {
            isTSX: true,
            allExtensions: true,
            jsxPragma: 'jsx'
          }]
        ],
      });

      if (!result || !result.code) {
        return { contents: text, loader: 'tsx' };
      }

      return {
        contents: result.code,
        loader: 'tsx',
      };
    });
  },
});
