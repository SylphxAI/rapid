/**
 * ZenJS - Ultra-fast, ultra-lightweight reactive framework
 *
 * Beyond SolidJS in performance and simplicity.
 * Powered by @zen/signal reactive core.
 */

// Import JSX types (global augmentation)
import './jsx-types.js';

// Re-export lifecycle-aware primitives from @zen/signal-zen
export {
  signal,
  computed,
  effect,
  batch,
  untrack,
  peek,
  subscribe,
} from '@zen/signal-zen';

// Re-export raw effect for advanced users who need manual control
export { rawEffect } from '@zen/signal-zen';

// Components
export { For } from './components/For.js';
export { Show } from './components/Show.js';
export { Switch, Match } from './components/Switch.js';
export { Portal } from './components/Portal.js';
export { ErrorBoundary } from './components/ErrorBoundary.js';
export { Suspense } from './components/Suspense.js';
export { Dynamic } from './components/Dynamic.js';

// Context API
export { createContext, useContext } from './components/Context.js';
export type { Context } from './components/Context.js';

// JSX
export { render, Fragment } from './jsx-runtime.js';

// Lifecycle
export {
  onMount,
  onCleanup,
  createRoot,
  disposeNode,
  getOwner,
} from './lifecycle.js';
export type { Owner } from './lifecycle.js';

// createEffect removed - use effect() instead which auto-registers cleanup

// Utilities
export { lazy } from './lazy.js';

// Reactive utilities
export { resolve, isSignal } from './reactive-utils.js';
export type { Reactive, MaybeReactive } from './reactive-utils.js';
export { mergeProps, splitProps } from './utils/props.js';
export { selector } from './utils/selector.js';
export { runWithOwner } from './utils/runWithOwner.js';

// Server utilities
export { isServer, createUniqueId, setServerIdPrefix, resetIdCounter } from './server-utils.js';

// Types
export type { Signal, Computed } from '@zen/signal';
