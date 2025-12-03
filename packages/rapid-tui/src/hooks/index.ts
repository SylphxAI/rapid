/**
 * Hooks - React-like hooks for TUI (Ink-compatible)
 */

export { useInput, dispatchInput, parseKey, type InputHandler, type Key } from './useInput.js';
export { useApp, type AppContext } from './useApp.js';
export { useStdin, type StdinContext } from './useStdin.js';
export { useStdout, type StdoutContext } from './useStdout.js';
export { useStderr, type StderrContext } from './useStderr.js';
export {
  useMouse,
  useMouseClick,
  useMouseScroll,
  dispatchMouseEvent,
} from './useMouse.js';
export {
  useTerminalSize,
  useTerminalResize,
  getTerminalSize,
  type TerminalSize,
} from './useTerminalSize.js';
