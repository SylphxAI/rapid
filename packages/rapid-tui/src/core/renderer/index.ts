/**
 * Renderer Module
 *
 * Optimal terminal renderer with:
 * - Double buffer + smart diffing
 * - Adaptive strategy (incremental vs full)
 * - Synchronized output
 * - Fine-grained dirty tracking
 *
 * @see docs/adr/003-final-renderer-architecture.md
 */

// Region utilities
export {
  type Region,
  createRegion,
  regionArea,
  regionsOverlap,
  regionContains,
  regionContainsPoint,
  intersectRegions,
  unionRegions,
  expandRegion,
  clampRegion,
  mergeRegions,
  totalRegionArea,
  isEmptyRegion,
  fullRegion,
} from './region.js';

// Dirty tracker
export {
  DirtyTracker,
  DirtyType,
  getDirtyTracker,
  setDirtyTracker,
} from './dirty-tracker.js';

// Output buffer
export {
  OutputBuffer,
  ESC,
  createOutputBuffer,
} from './output-buffer.js';

// Renderer
export {
  Renderer,
  RenderStrategy,
  type RenderMode,
  type RendererConfig,
  type RenderNodeFn,
  type LineChange,
  STRATEGY_THRESHOLDS,
  createRenderer,
} from './renderer.js';
