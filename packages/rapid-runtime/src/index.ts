/**
 * @rapid/runtime - Platform-agnostic runtime
 *
 * Components and utilities that work across all platforms (web, native, TUI).
 * No DOM dependencies - pure reactive primitives and control flow.
 */

// Re-export from @rapid/signal for convenience
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
} from '@rapid/signal';
export type { Signal, Computed, Owner } from '@rapid/signal';

// Components
export { For } from './components/For.js';
export { Show } from './components/Show.js';
export { Switch, Match } from './components/Switch.js';
export { ErrorBoundary } from './components/ErrorBoundary.js';
export { Suspense } from './components/Suspense.js';
export { Dynamic } from './components/Dynamic.js';

// Context API
export { createContext, useContext } from './components/Context.js';
export type { Context } from './components/Context.js';
export { ContextProvider } from './components/ContextProvider.js';
export type { ContextProviderProps } from './components/ContextProvider.js';

// Utilities
export { lazy } from './lazy.js';
export { resolve, isSignal, executeComponent, makeLazyProps } from './reactive-utils.js';
export type { Reactive, MaybeReactive } from './reactive-utils.js';
export { mergeProps, splitProps } from './utils/props.js';
export { selector } from './utils/selector.js';
export { runWithOwner } from './utils/runWithOwner.js';
export { children } from './utils/children.js';
export { resolveChildren, needsResolution } from './utils/resolve-children.js';

// Descriptor Pattern (ADR-011)
export { isDescriptor, executeDescriptor } from './descriptor.js';
export type { ComponentDescriptor } from './descriptor.js';

// Server utilities
export { isServer, createUniqueId, setServerIdPrefix, resetIdCounter } from './server-utils.js';

// Platform operations
export { setPlatformOps, getPlatformOps, hasPlatformOps } from './platform-ops.js';
export type { PlatformOps } from './platform-ops.js';
