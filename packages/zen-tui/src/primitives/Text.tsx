/**
 * Text component for TUI
 *
 * Renders text with styling support.
 */

import { appendChild } from '../core/jsx-runtime.js';
import type { TUIChildren, TUINode, TUIStyle } from '../core/types.js';

export interface TextProps {
  children?: TUIChildren;
  style?: TUIStyle;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  dim?: boolean;
  inverse?: boolean;
}

export function Text(props: TextProps): TUINode {
  const style: TUIStyle = {
    flexDirection: 'row', // Text children should be inline by default
    ...props?.style,
    color: props?.color || props?.style?.color,
    backgroundColor: props?.backgroundColor || props?.style?.backgroundColor,
    bold: props?.bold !== undefined ? props.bold : props?.style?.bold,
    italic: props?.italic !== undefined ? props.italic : props?.style?.italic,
    underline: props?.underline !== undefined ? props.underline : props?.style?.underline,
    strikethrough:
      props?.strikethrough !== undefined ? props.strikethrough : props?.style?.strikethrough,
    dim: props?.dim !== undefined ? props.dim : props?.style?.dim,
    inverse: props?.inverse !== undefined ? props.inverse : props?.style?.inverse,
  };

  const node: TUINode = {
    type: 'text',
    tagName: 'text',
    props: props || {},
    children: [],
    style,
  };

  // Handle children using appendChild for reactivity support
  if (props?.children !== undefined) {
    appendChild(node, props.children);
  }

  return node;
}
