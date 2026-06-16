/**
 * Static Component Helpers
 *
 * Pure functions for rendering `<Static>` nodes to scrollback. These convert a
 * TUINode subtree into styled ANSI strings and print newly-appended items to
 * stdout (inline mode only). No terminal lifecycle or mutable renderer state.
 */

import { executeDescriptor, isDescriptor } from '@rapid/runtime';
import type { TUINode, TUIStyle } from '../types.js';

/**
 * Find all Static nodes in the tree.
 * @internal Exported for testing
 */
export function findStaticNodes(node: TUINode): TUINode[] {
  const result: TUINode[] = [];

  if (node.tagName === 'static') {
    result.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      if (typeof child === 'object' && child !== null && 'type' in child) {
        result.push(...findStaticNodes(child as TUINode));
      }
    }
  }

  return result;
}

/**
 * Get ANSI color code
 */
function getColorCode(color: string): string {
  const colorMap: Record<string, string> = {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    grey: '\x1b[90m',
  };
  return colorMap[color.toLowerCase()] || '\x1b[37m';
}

/**
 * Apply text styling for static output
 */
function applyStaticTextStyle(text: string, style: TUIStyle = {}): string {
  if (!text) return '';

  let codes = '';
  let resetCodes = '';

  if (style.color) {
    const color = typeof style.color === 'function' ? style.color() : style.color;
    codes += getColorCode(color);
    resetCodes = `\x1b[39m${resetCodes}`;
  }
  if (style.bold) {
    const bold = typeof style.bold === 'function' ? style.bold() : style.bold;
    if (bold) {
      codes += '\x1b[1m';
      resetCodes = `\x1b[22m${resetCodes}`;
    }
  }
  if (style.dim) {
    codes += '\x1b[2m';
    resetCodes = `\x1b[22m${resetCodes}`;
  }

  return codes + text + resetCodes;
}

/**
 * Get border characters for a style
 */
function getBorderChars(borderStyle: string): {
  h: string;
  v: string;
  tl: string;
  tr: string;
  bl: string;
  br: string;
} {
  const borders: Record<
    string,
    { h: string; v: string; tl: string; tr: string; bl: string; br: string }
  > = {
    single: { h: '─', v: '│', tl: '┌', tr: '┐', bl: '└', br: '┘' },
    double: { h: '═', v: '║', tl: '╔', tr: '╗', bl: '╚', br: '╝' },
    round: { h: '─', v: '│', tl: '╭', tr: '╮', bl: '╰', br: '╯' },
    bold: { h: '━', v: '┃', tl: '┏', tr: '┓', bl: '┗', br: '┛' },
    classic: { h: '-', v: '|', tl: '+', tr: '+', bl: '+', br: '+' },
  };
  return borders[borderStyle] || borders.single;
}

/**
 * Render a TUINode to a string for static output.
 * @internal Exported for testing
 */
export function renderNodeToString(node: TUINode | string, parentStyle: TUIStyle = {}): string {
  if (typeof node === 'string') {
    return applyStaticTextStyle(node, parentStyle);
  }

  if (!node || typeof node !== 'object') {
    return '';
  }

  const style =
    typeof node.style === 'function' ? (node.style as () => TUIStyle)() : node.style || {};
  const mergedStyle = { ...parentStyle, ...style };

  // Text node - render children as styled text
  if (node.type === 'text') {
    return node.children
      .map((child) => {
        if (typeof child === 'string') {
          return applyStaticTextStyle(child, mergedStyle);
        }
        return renderNodeToString(child as TUINode, mergedStyle);
      })
      .join('');
  }

  // Box or other container - render children
  if (node.children) {
    // Check flex direction
    const flexDirection =
      typeof style.flexDirection === 'function' ? style.flexDirection() : style.flexDirection;
    const isColumn = flexDirection === 'column';
    const separator = isColumn ? '\n' : '';

    let content = node.children
      .map((child) => {
        if (typeof child === 'string') {
          return applyStaticTextStyle(child, mergedStyle);
        }
        return renderNodeToString(child as TUINode, mergedStyle);
      })
      .join(separator);

    // Handle border
    const borderStyle =
      typeof style.borderStyle === 'function' ? style.borderStyle() : style.borderStyle;

    if (borderStyle) {
      const borderColor =
        typeof style.borderColor === 'function' ? style.borderColor() : style.borderColor;
      const chars = getBorderChars(borderStyle as string);
      const colorCode = borderColor ? getColorCode(borderColor as string) : '';
      const resetCode = borderColor ? '\x1b[39m' : '';

      // Split content into lines
      const lines = content.split('\n');
      // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape codes require control characters
      const maxLen = Math.max(...lines.map((l) => l.replace(/\x1b\[[0-9;]*m/g, '').length), 0);

      // Build bordered output
      const topBorder = `${colorCode}${chars.tl}${chars.h.repeat(maxLen + 2)}${chars.tr}${resetCode}`;
      const bottomBorder = `${colorCode}${chars.bl}${chars.h.repeat(maxLen + 2)}${chars.br}${resetCode}`;
      const borderedLines = lines.map((line) => {
        // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape codes require control characters
        const visibleLen = line.replace(/\x1b\[[0-9;]*m/g, '').length;
        const padding = ' '.repeat(maxLen - visibleLen);
        return `${colorCode}${chars.v}${resetCode} ${line}${padding} ${colorCode}${chars.v}${resetCode}`;
      });

      content = [topBorder, ...borderedLines, bottomBorder].join('\n');
    }

    return content;
  }

  return '';
}

/**
 * Process static nodes and print new items to stdout.
 * Returns the number of lines printed.
 * @internal Exported for testing
 */
export function processStaticNodes(rootNode: TUINode, isInlineMode: boolean): number {
  if (!isInlineMode) {
    // Static output only works in inline mode (scrollback)
    return 0;
  }

  const staticNodes = findStaticNodes(rootNode);
  let linesPrinted = 0;

  for (const staticNode of staticNodes) {
    const itemsGetter = staticNode.props?.__itemsGetter as (() => unknown[]) | undefined;
    const renderChild = staticNode.props?.__renderChild as
      | ((item: unknown, index: number) => TUINode | string)
      | undefined;
    const lastCount = (staticNode.props?.__lastRenderedCount as number) || 0;

    if (!itemsGetter || !renderChild) continue;

    const items = itemsGetter();
    const newCount = items?.length || 0;

    // Check for new items
    if (newCount > lastCount) {
      const newItems = items.slice(lastCount);

      // Move cursor to start of current UI area (we'll print above it)
      // Actually, for scrollback, we just print directly - the dynamic UI
      // will be re-rendered below
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        const index = lastCount + i;
        let rendered = renderChild(item, index);
        // Execute descriptor if needed (JSX returns descriptors)
        if (isDescriptor(rendered)) {
          rendered = executeDescriptor(rendered) as TUINode | string;
        }
        const content = renderNodeToString(rendered as TUINode);
        // Print to stdout directly (goes to scrollback)
        process.stdout.write(`${content}\n`);
        // Count actual lines (content may have newlines from borders/column layout)
        linesPrinted += content.split('\n').length;
      }

      // Update the rendered count
      if (staticNode.props) {
        staticNode.props.__lastRenderedCount = newCount;
      }
    }
  }

  return linesPrinted;
}
