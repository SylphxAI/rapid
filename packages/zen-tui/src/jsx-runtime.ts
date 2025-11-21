/**
 * TUI JSX Runtime
 *
 * Creates virtual TUI nodes instead of DOM nodes.
 * Similar pattern to zen-web but for terminal rendering.
 */

import { executeComponent, isSignal } from '@zen/runtime';
import { attachNodeToOwner, effect, getOwner } from '@zen/signal';
import { scheduleNodeUpdate } from './render-context.js';
import type { TUINode } from './types.js';

type Props = Record<string, unknown>;
type ComponentFunction = (props: Props | null) => TUINode | TUINode[];

interface ReactElement {
  $$typeof: symbol;
  type: ComponentFunction;
  props: Props;
}

interface TUIMarker {
  _type: 'marker';
  _kind: string;
  children: (TUINode | string)[];
  parentNode?: TUINode;
}

interface SignalLike {
  _kind: string;
  value: unknown;
}

/**
 * JSX factory for TUI
 */
export function jsx(type: string | ComponentFunction, props: Props | null): TUINode | TUINode[] {
  // Component
  if (typeof type === 'function') {
    const result = executeComponent(
      () => type(props),
      // biome-ignore lint/suspicious/noExplicitAny: Generic node type from framework
      (node: any, owner: any) => {
        // Only attach if it's a single node, not an array/fragment
        if (!Array.isArray(node)) {
          attachNodeToOwner(node, owner);
        }
      },
    );
    return result;
  }

  // TUI Element (box, text, etc.)
  const node: TUINode = {
    type: 'box',
    tagName: type,
    props: props || {},
    children: [],
    style: props?.style || {},
  };

  // Handle children
  const children = props?.children;
  if (children !== undefined) {
    appendChild(node, children);
  }

  return node;
}

export const jsxs = jsx;
export const jsxDEV = jsx;

function isReactElement(child: unknown): child is ReactElement {
  return typeof child === 'object' && child !== null && 'type' in child && '$$typeof' in child;
}

function isTUINode(child: unknown): child is TUINode {
  return typeof child === 'object' && child !== null && 'type' in child && !('$$typeof' in child);
}

function isTUIMarker(child: unknown): child is TUIMarker {
  return (
    typeof child === 'object' &&
    child !== null &&
    '_type' in child &&
    (child as TUIMarker)._type === 'marker'
  );
}

function handleReactElement(parent: TUINode, reactEl: ReactElement): void {
  if (typeof reactEl.type === 'function') {
    const result = executeComponent(
      () => reactEl.type(reactEl.props),
      // biome-ignore lint/suspicious/noExplicitAny: Generic node type from framework
      (node: any, owner: any) => {
        if (!Array.isArray(node)) {
          attachNodeToOwner(node, owner);
        }
      },
    );
    appendChild(parent, result);
  }
}

function handleTUINode(parent: TUINode, node: TUINode): void {
  parent.children.push(node);
  try {
    node.parentNode = parent;
  } catch {
    // Object is frozen/sealed, skip parentNode assignment
  }
}

function handleTUIMarker(parent: TUINode, marker: TUIMarker): void {
  parent.children.push(marker);
  try {
    marker.parentNode = parent;
  } catch {
    // Object is frozen/sealed, skip parentNode assignment
  }
}

function handleSignal(parent: TUINode, signal: SignalLike): void {
  const textNode: TUINode = {
    type: 'text',
    props: {},
    children: [''],
  };

  parent.children.push(textNode);

  effect(() => {
    const newValue = String(signal.value ?? '');
    textNode.children[0] = newValue;
    // Schedule fine-grained update
    scheduleNodeUpdate(textNode, newValue);
    return undefined;
  });
}

function handleReactiveFunction(parent: TUINode, fn: () => unknown): void {
  const marker: TUIMarker = {
    _type: 'marker',
    _kind: 'reactive',
    children: [],
  };

  parent.children.push(marker);

  effect(() => {
    const value = fn();
    marker.children = [];

    if (value && typeof value === 'object' && 'type' in value) {
      marker.children.push(value as TUINode);
      // Schedule fine-grained update for the marker
      scheduleNodeUpdate(marker, ''); // Will render the TUINode
      return undefined;
    }

    if (Array.isArray(value)) {
      marker.children.push(...value);
      // Schedule fine-grained update for the marker
      scheduleNodeUpdate(marker, ''); // Will render the array
      return undefined;
    }

    if (value != null && value !== false) {
      const stringValue = String(value);
      marker.children.push(stringValue);
      // Schedule fine-grained update for the marker
      scheduleNodeUpdate(marker, stringValue);
    }

    return undefined;
  });
}

/**
 * Append child to TUI node
 */
export function appendChild(parent: TUINode, child: unknown): void {
  if (child == null || child === false) {
    return;
  }

  if (Array.isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      appendChild(parent, child[i]);
    }
    return;
  }

  if (isReactElement(child)) {
    handleReactElement(parent, child);
    return;
  }

  if (isTUIMarker(child)) {
    handleTUIMarker(parent, child);
    return;
  }

  if (isTUINode(child)) {
    handleTUINode(parent, child);
    return;
  }

  if (isSignal(child)) {
    handleSignal(parent, child as SignalLike);
    return;
  }

  if (typeof child === 'function') {
    handleReactiveFunction(parent, child);
    return;
  }

  parent.children.push(String(child));
}

/**
 * Fragment component
 */
export function Fragment(props: { children?: unknown }): TUINode {
  const node: TUINode = {
    type: 'box',
    tagName: 'fragment',
    props: {},
    children: [],
  };

  if (props?.children !== undefined) {
    appendChild(node, props.children);
  }

  return node;
}
