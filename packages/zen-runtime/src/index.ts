/**
 * @zen/runtime - Platform-agnostic runtime
 *
 * Components and utilities that work across all platforms (web, native, TUI).
 * No DOM dependencies - pure reactive primitives and control flow.
 */

// Re-export from @zen/signal for convenience
export {
  signal,
  computed,
  effect,
  rawEffect,
  batch,
  untrack,
  peek,
  subscribe,
  onMount,
  onCleanup,
  createRoot,
  disposeNode,
  getOwner,
} from '@zen/signal';
export type { Signal, Computed, Owner } from '@zen/signal';

// TODO: Move components from @zen/zen
// export { For } from './components/For.js';
// export { Show } from './components/Show.js';
// export { Switch, Match } from './components/Switch.js';
// export { ErrorBoundary } from './components/ErrorBoundary.js';
// export { Suspense } from './components/Suspense.js';
// export { Dynamic } from './components/Dynamic.js';

// TODO: Move context from @zen/zen
// export { createContext, useContext } from './components/Context.js';
// export type { Context } from './components/Context.js';

// TODO: Move utilities from @zen/zen
// export { lazy } from './lazy.js';
// export { resolve, isSignal } from './reactive-utils.js';
// export type { Reactive, MaybeReactive } from './reactive-utils.js';
// export { mergeProps, splitProps } from './utils/props.js';
// export { selector } from './utils/selector.js';
// export { runWithOwner } from './utils/runWithOwner.js';

// TODO: Move server utilities from @zen/zen
// export { isServer, createUniqueId, setServerIdPrefix, resetIdCounter } from './server-utils.js';
