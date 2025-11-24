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
  // Dynamic - REMOVED: Use reactive function children instead
  // Example: {() => <MyComponent />} instead of <Dynamic component={MyComponent} />
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
export { renderToTerminalPersistent } from './persistent-renderer.js';
export { Fragment } from './jsx-runtime.js';

// TUI-specific: Components
export { Box } from './components/Box.js';
export { Text } from './components/Text.js';
export { Static } from './components/Static.js';
export { Newline } from './components/Newline.js';
export { Spacer } from './components/Spacer.js';
export { ScrollBox } from './components/ScrollBox.js';
export { Scrollbar } from './components/Scrollbar.js';

// TUI-specific: Routing Components
export { Router, type TUIRoute, type RouterProps } from './components/Router.js';
export { RouterLink, type RouterLinkProps } from './components/RouterLink.js';

// TUI-specific: Input Components
export {
  TextInput,
  handleTextInput,
  type TextInputProps,
  type SuggestionProvider,
} from './components/TextInput.js';
export { SelectInput, handleSelectInput, type SelectOption } from './components/SelectInput.js';
export {
  MultiSelect,
  handleMultiSelectInput,
  type MultiSelectOption,
} from './components/MultiSelect.js';
export { Checkbox, handleCheckbox } from './components/Checkbox.js';
export { Radio, handleRadioInput, type RadioOption } from './components/Radio.js';
export { Button, handleButton } from './components/Button.js';
export { Confirmation } from './components/Confirmation.js';

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
export { Table, type TableColumn } from './components/Table.js';
export { Divider } from './components/Divider.js';
export { Badge } from './components/Badge.js';
export { StatusMessage } from './components/StatusMessage.js';
export { Tabs, Tab, handleTabsInput, type TabProps, type TabsProps } from './components/Tabs.js';
export { Link } from './components/Link.js';
export {
  TreeView,
  type TreeNode,
  type TreeViewProps,
} from './components/TreeView.js';
export { Markdown, type MarkdownProps } from './components/Markdown.js';
export {
  Modal,
  ConfirmDialog,
  AlertDialog,
  type ModalProps,
  type ModalButton,
  type ConfirmDialogProps,
  type AlertDialogProps,
} from './components/Modal.js';
export {
  CommandPalette,
  type Command,
  type CommandPaletteProps,
} from './components/CommandPalette.js';
export {
  Toast,
  ToastContainer,
  toast,
  type ToastType,
  type ToastMessage,
  type ToastProps,
  type SingleToastProps,
} from './components/Toast.js';
export {
  StatusBar,
  StatusBarItem,
  StatusBarMode,
  StatusBarShortcut,
  StatusBarSeparator,
  type StatusBarProps,
  type StatusBarItemProps,
  type StatusBarModeProps,
  type StatusBarShortcutProps,
} from './components/StatusBar.js';

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

// TUI-specific: Mouse Input
export {
  useMouse,
  useMouseClick,
  useMouseScroll,
  dispatchMouseEvent,
} from './useMouse.js';
export type { MouseEvent } from './mouse-parser.js';

// TUI-specific: Hit Testing
export {
  hitTest,
  hitTestAll,
  findClickableAncestor,
  type HitTestResult,
} from './hit-test.js';

// TUI-specific: Application Control (Ink-compatible API)
export { useApp, type AppContext } from './useApp.js';

// TUI-specific: Terminal Size
export {
  useTerminalSize,
  useTerminalResize,
  getTerminalSize,
  type TerminalSize,
} from './useTerminalSize.js';

// TUI-specific: Routing Primitives (re-export from @zen/router-core for convenience)
export {
  $router,
  defineRoutes,
  startHistoryListener,
  stopHistoryListener,
  open,
  back,
  forward,
  replace,
  type RouteConfig,
  type RouterState,
  type RouteParams,
} from '@zen/router-core';

// TUI-specific: Utilities
export { terminalWidth } from './terminal-width.js';

// TUI-specific: Types
export type { TUINode, TUIStyle, RenderOutput, MouseClickEvent } from './types.js';
