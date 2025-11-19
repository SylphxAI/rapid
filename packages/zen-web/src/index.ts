/**
 * @zen/web - Web renderer for Zen
 *
 * DOM-specific operations, JSX runtime, SSR, and hydration.
 * Depends on @zen/runtime for platform-agnostic components.
 */

// Import JSX types (global augmentation)
// import './jsx-types.js';

// Re-export runtime for convenience
export {
  signal,
  computed,
  effect,
  batch,
  untrack,
  onMount,
  onCleanup,
} from '@zen/runtime';

// TODO: Move from @zen/zen
// export { render, Fragment } from './jsx-runtime.js';
// export { hydrate } from './hydrate.js';
// export { renderToString } from './server.js';

// TODO: Web-specific components
// export { Portal } from './components/Portal.js';
