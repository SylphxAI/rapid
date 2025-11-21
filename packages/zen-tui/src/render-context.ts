/**
 * Render Context for Fine-Grained Updates
 *
 * Global context that allows effects to directly update terminal regions.
 */

import type { LayoutMap, LayoutResult } from './yoga-layout.js';

export interface RenderContext {
  layoutMap: LayoutMap;
  scheduleUpdate: (node: any, content: string) => void;
}

let globalRenderContext: RenderContext | null = null;

/**
 * Set the global render context
 */
export function setRenderContext(context: RenderContext | null): void {
  globalRenderContext = context;
}

/**
 * Get the global render context
 */
export function getRenderContext(): RenderContext | null {
  return globalRenderContext;
}

/**
 * Schedule an update for a specific node
 * This will be called by effects when reactive values change
 */
export function scheduleNodeUpdate(node: any, content: string): void {
  if (globalRenderContext) {
    globalRenderContext.scheduleUpdate(node, content);
  }
}
