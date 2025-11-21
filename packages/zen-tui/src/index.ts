/**
 * @zen/tui - Terminal UI renderer for Zen
 *
 * Build beautiful CLI applications with Zen.
 * Uses @zen/runtime components with terminal rendering.
 */

// Force chalk to always output colors BEFORE any imports
// This must be FIRST to ensure chalk initializes with colors enabled
process.env.FORCE_COLOR = '3';

// Initialize platform operations for TUI
import { setPlatformOps } from '@zen/runtime';
import { tuiPlatformOps } from './platform-ops.js';
setPlatformOps(tuiPlatformOps);

// Force chalk color level (Bun workaround)
import chalk from 'chalk';
(chalk as any).level = 3;

// Re-export runtime for convenience
export {
  signal,
  computed,
  effect,
  batch,
  untrack,
  peek,
  subscribe,
  onMount,
  onCleanup,
  createRoot,
  disposeNode,
  getOwner,
  // Components from runtime
  For,
  Show,
  Switch,
  Match,
  ErrorBoundary,
  Suspense,
  Dynamic,
  // Context
  createContext,
  useContext,
  // Utilities
  lazy,
  resolve,
  isSignal,
  mergeProps,
  splitProps,
  selector,
  runWithOwner,
  // Server utils
  isServer,
  createUniqueId,
} from '@zen/runtime';

// Types: Users can import types directly from @zen/signal and @zen/runtime
// export type { Signal, Computed, Owner } from '@zen/signal';
// export type { Context, Reactive, MaybeReactive } from '@zen/runtime';

// TUI-specific: Renderer
export { render, renderToTerminal, renderToTerminalReactive } from './render.js';
export { Fragment } from './jsx-runtime.js';

// TUI-specific: Components
export { Box } from './components/Box.js';
export { Text } from './components/Text.js';
export { Static } from './components/Static.js';
export { Newline } from './components/Newline.js';
export { Spacer } from './components/Spacer.js';

// TUI-specific: Input Components
export { TextInput, handleTextInput } from './components/TextInput.js';
export { SelectInput, handleSelectInput, type SelectOption } from './components/SelectInput.js';
export { Checkbox, handleCheckbox } from './components/Checkbox.js';
export { Button, handleButton } from './components/Button.js';

// TUI-specific: Display Components
export {
  Spinner,
  updateSpinner,
  createAnimatedSpinner,
} from './components/Spinner.js';
export {
  ProgressBar,
  incrementProgress,
  setProgress,
  resetProgress,
} from './components/ProgressBar.js';

// TUI-specific: Focus Management (Ink-compatible API)
export {
  FocusProvider,
  useFocusManager,
  useFocus,
  type FocusManagerValue,
  type FocusableItem,
} from './focus.js';

// TUI-specific: Keyboard Input
export { useInput, dispatchInput, type InputHandler, type Key } from './useInput';

// TUI-specific: Types
export type { TUINode, TUIStyle, RenderOutput } from './types.js';
