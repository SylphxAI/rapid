/**
 * Core rendering infrastructure
 */

export { Fragment, jsx, jsxs, jsxDEV } from './jsx-runtime.js';
export { computeLayout, type LayoutMap, type LayoutResult } from './yoga-layout.js';
export { TerminalBuffer } from './terminal-buffer.js';
export { tuiPlatformOps } from './platform-ops.js';
export { getCurrentParent, withParent } from './parent-context.js';
export type { TUINode, TUIStyle, TUINodeType, RenderOutput, MouseClickEvent } from './types.js';
