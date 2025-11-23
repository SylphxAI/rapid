/**
 * TUI Element - Persistent Virtual Node
 *
 * Like DOM elements but for terminal UI.
 * Supports fine-grained reactivity without reconciliation.
 */

import type { Effect, Owner } from '@zen/signal';
import { createRoot, effect, getOwner } from '@zen/signal';
import type { Yoga } from 'yoga-wasm-web';
import type { TUIStyle } from './types.js';

/**
 * Persistent TUI element instance
 *
 * Similar to DOM elements - created once, updated in place.
 * No reconciliation needed - effects update directly.
 */
export class TUIElement {
  type: string;
  props: Record<string, any>;
  style: TUIStyle;
  children: (TUIElement | TUITextNode)[];

  // Yoga layout node (persistent)
  yogaNode: any | null = null;

  // Reactivity tracking
  effects: Set<Effect> = new Set();
  owner: Owner | null = null;

  // Dirty flags for incremental updates
  dirtyProps = new Set<string>();
  dirtyStyle = false;
  dirtyContent = false;
  dirtyLayout = false;

  // Parent reference
  parent: TUIElement | null = null;

  constructor(type: string, props: Record<string, any> = {}, style: TUIStyle = {}) {
    this.type = type;
    this.props = { ...props };
    this.style = { ...style };
    this.children = [];
    this.owner = getOwner();
  }

  /**
   * Set a property value (with dirty tracking)
   */
  setProp(key: string, value: any): void {
    if (this.props[key] !== value) {
      this.props[key] = value;
      this.dirtyProps.add(key);
      this.markDirty();
    }
  }

  /**
   * Update style (with dirty tracking)
   */
  setStyle(newStyle: TUIStyle): void {
    const changed = Object.entries(newStyle).some(
      ([key, value]) => this.style[key as keyof TUIStyle] !== value,
    );

    if (changed) {
      this.style = { ...this.style, ...newStyle };
      this.dirtyStyle = true;
      this.dirtyLayout = true;
      this.markDirty();
    }
  }

  /**
   * Set content (for text nodes)
   */
  setContent(content: string): void {
    if (this.props.children !== content) {
      this.props.children = content;
      this.dirtyContent = true;
      this.markDirty();
    }
  }

  /**
   * Add child element
   */
  appendChild(child: TUIElement | TUITextNode): void {
    this.children.push(child);
    if (child instanceof TUIElement) {
      child.parent = this;
    }
    this.dirtyContent = true;
    this.markDirty();
  }

  /**
   * Remove child element
   */
  removeChild(child: TUIElement | TUITextNode): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      if (child instanceof TUIElement) {
        child.parent = null;
      }
      this.dirtyContent = true;
      this.markDirty();
    }
  }

  /**
   * Mark this element as dirty (needs re-render)
   */
  markDirty(): void {
    // Register with global dirty set (will be implemented in render.ts)
    if (typeof globalThis.__tuiDirtyElements !== 'undefined') {
      (globalThis.__tuiDirtyElements as Set<TUIElement>).add(this);
    }
  }

  /**
   * Clear dirty flags after render
   */
  clearDirty(): void {
    this.dirtyProps.clear();
    this.dirtyStyle = false;
    this.dirtyContent = false;
    this.dirtyLayout = false;
  }

  /**
   * Check if element is dirty
   */
  isDirty(): boolean {
    return (
      this.dirtyProps.size > 0 || this.dirtyStyle || this.dirtyContent || this.dirtyLayout
    );
  }

  /**
   * Create Yoga layout node
   */
  createYogaNode(Yoga: Yoga): void {
    if (!this.yogaNode) {
      this.yogaNode = Yoga.Node.create();
    }
  }

  /**
   * Update Yoga node with current styles
   */
  updateYogaNode(Yoga: Yoga): void {
    if (!this.yogaNode) {
      this.createYogaNode(Yoga);
    }

    const node = this.yogaNode;

    // FlexDirection
    if (this.style.flexDirection === 'row') {
      node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
    } else if (this.style.flexDirection === 'column') {
      node.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN);
    }

    // Width
    if (typeof this.style.width === 'number') {
      node.setWidth(this.style.width);
    } else if (this.style.width === 'auto') {
      node.setWidthAuto();
    }

    // Height
    if (typeof this.style.height === 'number') {
      node.setHeight(this.style.height);
    } else if (this.style.height === 'auto') {
      node.setHeightAuto();
    }

    // Padding
    const padding = this.style.padding ?? 0;
    const paddingX = this.style.paddingX ?? padding;
    const paddingY = this.style.paddingY ?? padding;
    node.setPadding(Yoga.EDGE_TOP, paddingY);
    node.setPadding(Yoga.EDGE_BOTTOM, paddingY);
    node.setPadding(Yoga.EDGE_LEFT, paddingX);
    node.setPadding(Yoga.EDGE_RIGHT, paddingX);

    // Add more style properties as needed
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Dispose effects
    for (const eff of this.effects) {
      // Effects will be disposed by their owners
    }
    this.effects.clear();

    // Free Yoga node
    if (this.yogaNode) {
      this.yogaNode.free();
      this.yogaNode = null;
    }

    // Dispose children
    for (const child of this.children) {
      if (child instanceof TUIElement) {
        child.dispose();
      }
    }
  }
}

/**
 * Text node - leaf node containing text content
 */
export class TUITextNode {
  content: string;
  parent: TUIElement | null = null;

  constructor(content: string) {
    this.content = content;
  }

  setContent(content: string): void {
    if (this.content !== content) {
      this.content = content;
      if (this.parent) {
        this.parent.markDirty();
      }
    }
  }
}

/**
 * Create element with reactive prop tracking
 */
export function createElement(
  type: string,
  props: Record<string, any> = {},
  style: TUIStyle = {},
): TUIElement {
  const element = new TUIElement(type, props, style);

  // Set up reactive tracking for function props
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'function' && key !== 'children') {
      // Reactive prop - create effect
      const eff = effect(() => {
        const newValue = value();
        element.setProp(key, newValue);
      });
      element.effects.add(eff);
    }
  }

  // Set up reactive tracking for style
  for (const [key, value] of Object.entries(style)) {
    if (typeof value === 'function') {
      const eff = effect(() => {
        const newValue = value();
        element.setStyle({ [key]: newValue });
      });
      element.effects.add(eff);
    }
  }

  return element;
}

/**
 * Create text node with reactive content
 */
export function createTextNode(content: string | (() => string)): TUITextNode {
  if (typeof content === 'function') {
    // Reactive text
    const textNode = new TUITextNode('');
    effect(() => {
      const newContent = content();
      textNode.setContent(newContent);
    });
    return textNode;
  }

  return new TUITextNode(content);
}

/**
 * Global dirty element set
 * Used by TUIElement.markDirty() to track what needs re-rendering
 */
declare global {
  var __tuiDirtyElements: Set<TUIElement> | undefined;
}
