/**
 * Parent context for TUI
 *
 * Provides parent node to runtime components during construction.
 * This is needed because effects now run immediately sync, so runtime
 * components need access to parent before marker is added to tree.
 */

import type { TUINode } from './types.js';

let currentParent: TUINode | null = null;

export function setCurrentParent(parent: TUINode | null): void {
  currentParent = parent;
}

export function getCurrentParent(): TUINode | null {
  return currentParent;
}

export function withParent<T>(parent: TUINode, fn: () => T): T {
  const prevParent = currentParent;
  currentParent = parent;
  try {
    return fn();
  } finally {
    currentParent = prevParent;
  }
}
