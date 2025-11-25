/**
 * useInput hook - React Ink compatible keyboard input handling
 *
 * Allows components to handle keyboard input in a declarative way.
 * Supports reactive isActive for focus management (Ink-compatible).
 *
 * Architecture (matches React Ink):
 * - When isActive is false, handler is completely removed from registry
 * - When isActive is true, handler is added to registry
 * - isActive can be reactive (signal, computed, or getter function)
 */

import { type Owner, effect, getOwner, onCleanup } from '@zen/runtime';

/**
 * Input handler function.
 * Return `true` to stop propagation (event consumed).
 * Return `false` or `undefined` to allow other handlers to process.
 */
export type InputHandler = (input: string, key: Key) => boolean | undefined;

export interface Key {
  upArrow: boolean;
  downArrow: boolean;
  leftArrow: boolean;
  rightArrow: boolean;
  return: boolean;
  escape: boolean;
  ctrl: boolean;
  shift: boolean;
  tab: boolean;
  backspace: boolean;
  delete: boolean;
  pageDown: boolean;
  pageUp: boolean;
  meta: boolean;
  home: boolean;
  end: boolean;
  // F-keys
  f1: boolean;
  f2: boolean;
  f3: boolean;
  f4: boolean;
  f5: boolean;
  f6: boolean;
  f7: boolean;
  f8: boolean;
  f9: boolean;
  f10: boolean;
  f11: boolean;
  f12: boolean;
}

/**
 * Reactive value type - can be a value, signal, computed, or getter
 */
type MaybeReactive<T> = T | { value: T } | (() => T);

export interface UseInputOptions {
  /**
   * Whether this handler is active (default: true)
   *
   * Ink-compatible: Can be a reactive value (signal, computed, getter).
   * When false, handler is completely removed from registry.
   * When true, handler is added to registry.
   *
   * @example
   * // Static
   * useInput(handler, { isActive: true });
   *
   * // With useFocus (Ink pattern)
   * const { isFocused } = useFocus();
   * useInput(handler, { isActive: isFocused });
   *
   * // With getter
   * useInput(handler, { isActive: () => someCondition });
   */
  isActive?: MaybeReactive<boolean>;
}

interface RegisteredHandler {
  handler: InputHandler;
  owner: Owner | null;
}

// Global registry of active input handlers
const inputHandlers: Set<RegisteredHandler> = new Set();

// Track registered handlers by owner to prevent duplicates
const ownerToHandler: WeakMap<Owner, RegisteredHandler> = new WeakMap();

/**
 * Resolve a potentially reactive value
 */
function resolveReactive<T>(value: MaybeReactive<T>): T {
  if (typeof value === 'function') {
    return (value as () => T)();
  }
  if (value !== null && typeof value === 'object' && 'value' in value) {
    return (value as { value: T }).value;
  }
  return value as T;
}

/**
 * Register a keyboard input handler
 * React Ink compatible API
 *
 * @param handler - The input handler function. Return `true` to stop propagation.
 * @param options - Options including reactive isActive
 *
 * @example
 * // Basic usage - always active
 * useInput((input, key) => {
 *   if (key.escape) quit();
 * });
 *
 * @example
 * // With focus (Ink pattern)
 * const { isFocused } = useFocus();
 * useInput((input, key) => {
 *   if (key.return) submit();
 * }, { isActive: isFocused });
 */
export function useInput(handler: InputHandler, options?: UseInputOptions): void {
  const isActiveOption = options?.isActive ?? true;
  const owner = getOwner();

  // Create handler object (reused across active/inactive transitions)
  let registered: RegisteredHandler | null = null;

  const addHandler = () => {
    if (registered) return; // Already added

    registered = { handler, owner };
    inputHandlers.add(registered);

    if (owner) {
      ownerToHandler.set(owner, registered);
    }
  };

  const removeHandler = () => {
    if (!registered) return; // Already removed

    inputHandlers.delete(registered);
    if (owner) {
      ownerToHandler.delete(owner);
    }
    registered = null;
  };

  // Use effect to track reactive isActive changes
  // This is the key difference from our previous implementation:
  // - React Ink uses useEffect with isActive as dependency
  // - We use effect() which automatically tracks signal/computed dependencies
  effect(() => {
    const isActive = resolveReactive(isActiveOption);

    if (isActive) {
      addHandler();
    } else {
      removeHandler();
    }
  });

  // Cleanup when component unmounts
  onCleanup(() => {
    removeHandler();
  });
}

/**
 * Parse key press into Key object
 */
export function parseKey(str: string): Key {
  return {
    upArrow: str === '\x1B[A',
    downArrow: str === '\x1B[B',
    rightArrow: str === '\x1B[C',
    leftArrow: str === '\x1B[D',
    return: str === '\r' || str === '\n',
    escape: str === '\x1B' || str === '\x1B\x1B',
    ctrl: str.charCodeAt(0) < 32 && str !== '\r' && str !== '\n' && str !== '\t',
    shift: str === '\x1B[Z', // Shift+Tab sends ESC[Z
    tab: str === '\t' || str === '\x1B[Z', // Tab or Shift+Tab
    backspace: str === '\x7F' || str === '\b',
    delete: str === '\x1B[3~',
    pageDown: str === '\x1B[6~',
    pageUp: str === '\x1B[5~',
    meta: str.startsWith('\x1B'),
    home: str === '\x1B[H' || str === '\x1B[1~',
    end: str === '\x1B[F' || str === '\x1B[4~',
    // F-keys (various terminal escape sequences)
    f1: str === '\x1BOP' || str === '\x1B[11~' || str === '\x1B[[A',
    f2: str === '\x1BOQ' || str === '\x1B[12~' || str === '\x1B[[B',
    f3: str === '\x1BOR' || str === '\x1B[13~' || str === '\x1B[[C',
    f4: str === '\x1BOS' || str === '\x1B[14~' || str === '\x1B[[D',
    f5: str === '\x1B[15~' || str === '\x1B[[E',
    f6: str === '\x1B[17~',
    f7: str === '\x1B[18~',
    f8: str === '\x1B[19~',
    f9: str === '\x1B[20~',
    f10: str === '\x1B[21~',
    f11: str === '\x1B[23~',
    f12: str === '\x1B[24~',
  };
}

/**
 * Dispatch keyboard input to all registered handlers
 * Called by renderToTerminalReactive's onKeyPress
 *
 * All active handlers are called. If a handler returns `true`, propagation stops.
 */
export function dispatchInput(input: string): void {
  const key = parseKey(input);

  // CRITICAL: Copy handlers to array before iterating
  // Handlers may modify the Set (via signal updates triggering re-renders)
  // which would cause infinite iteration if we iterate the Set directly
  const handlers = [...inputHandlers];

  for (const { handler } of handlers) {
    const consumed = handler(input, key);
    if (consumed === true) {
      // Event was consumed, stop propagation
      return;
    }
  }
}

/**
 * Clear all input handlers
 * Useful for cleanup
 */
export function clearInputHandlers(): void {
  inputHandlers.clear();
}
