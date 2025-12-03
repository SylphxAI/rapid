/**
 * TUI Virtual Node Types
 */

/**
 * Children type for TUI components
 *
 * Supports:
 * - TUINode: Single node
 * - string: Text content
 * - (TUINode | string)[]: Array of mixed content
 * - () => ...: Reactive function returning any of the above
 */
export type TUIChildren =
  | TUINode
  | string
  | (TUINode | string)[]
  | (() => TUINode | string | (TUINode | string)[]);

/**
 * Node types:
 * - 'box': Container with layout (flexbox)
 * - 'text': Text content
 * - 'component': Component wrapper
 * - 'fragment': Transparent container for reactive children (like React Fragment)
 */
export type TUINodeType = 'box' | 'text' | 'component' | 'fragment';

export interface TUIStyle {
  // Layout
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  // Positioning
  position?: 'relative' | 'absolute';
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
  zIndex?: number;

  // Flexbox
  flex?: number; // Shorthand for flexGrow/flexShrink
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | string;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';

  // Spacing
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;

  margin?: number;
  marginX?: number;
  marginY?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;

  gap?: number; // Gap between children in row/column layout

  // Border
  borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'none';
  borderColor?: string;

  // Colors
  color?: string;
  backgroundColor?: string;

  // Text
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  dim?: boolean;
  inverse?: boolean; // Swap foreground/background colors

  // Overflow
  overflow?: 'visible' | 'hidden' | 'scroll';
}

export interface TUINode {
  type: TUINodeType;
  tagName?: string;
  props: Record<string, any>;
  /**
   * Children can be:
   * - TUINode (including fragment nodes for reactive content)
   * - string (text content)
   */
  children: Array<TUINode | string>;
  parentNode?: TUINode;
  style?: TUIStyle;

  // ============================================================================
  // Fine-Grained Reactivity Fields (ADR-014)
  // ============================================================================
  // These fields enable incremental updates without full tree re-rendering.
  // When a signal changes, only the affected node is marked dirty, and only
  // dirty nodes are re-rendered to the terminal buffer.

  /**
   * Content dirty flag - set when node's content/children change.
   * When true, this node needs to be re-rendered to the buffer.
   * Cleared after rendering.
   *
   * @example
   * ```tsx
   * // In jsx-runtime effect:
   * textNode.children[0] = newValue;
   * textNode._dirty = true;  // Mark for re-render
   * scheduleNodeUpdate(textNode);
   * ```
   */
  _dirty?: boolean;

  /**
   * Layout dirty flag - set when node's size/position might change.
   * When true, Yoga layout needs to be recomputed for this subtree.
   * This is more expensive than content-only updates.
   *
   * Layout is dirty when:
   * - Node is added/removed
   * - width/height/flex properties change
   * - Text content changes length significantly
   *
   * Layout is NOT dirty when:
   * - Only color/style changes
   * - Text content changes but fits in same space
   */
  _layoutDirty?: boolean;
}

export interface RenderOutput {
  text: string;
  width: number;
  height: number;
}

/**
 * Mouse click event passed to onClick handlers
 */
export interface MouseClickEvent {
  /** Screen column (1-indexed) */
  x: number;
  /** Screen row (1-indexed) */
  y: number;
  /** X position relative to element (0-indexed) */
  localX: number;
  /** Y position relative to element (0-indexed) */
  localY: number;
  /** Mouse button that was clicked */
  button: 'left' | 'middle' | 'right';
  /** Ctrl key was held */
  ctrl?: boolean;
  /** Shift key was held */
  shift?: boolean;
  /** Meta key was held */
  meta?: boolean;
}
