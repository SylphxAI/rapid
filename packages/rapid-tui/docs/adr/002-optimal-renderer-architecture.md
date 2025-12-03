# ADR-002: Optimal Terminal Renderer Architecture

## Status
Proposed

## Context

Current renderer has issues:
1. Inline mode uses "clear all + rewrite all" strategy (inefficient)
2. No synchronized output support (can cause tearing)
3. Cursor tracking is fragile when content shrinks
4. No adaptive strategy for full refresh vs incremental diff

We need a robust, high-performance renderer that:
- Components don't need to worry about rendering details
- Smart update strategies based on change magnitude
- Proper buffer management
- Works perfectly for both inline and fullscreen modes

## Research Summary

Based on [Textual](https://textual.textualize.io/blog/2024/12/12/algorithms-for-high-performance-terminal-apps/),
[Ratatui](https://ratatui.rs/concepts/rendering/under-the-hood/),
[Ink](https://github.com/vadimdemedes/ink), and other TUI frameworks:

### Industry Best Practices

1. **Double Buffer + Diff** - All major frameworks use this pattern
2. **Synchronized Output Protocol** - `CSI ? 2026 h/l` prevents tearing
3. **Single Write** - Batch all updates, write once
4. **Immediate Mode Rendering** - App redraws all, system outputs diff only
5. **Overwrite, Don't Clear** - Never clear then write (causes flicker)

## Decision

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Component Tree                         │   │
│  │    (JSX components, signals, reactive updates)           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Layout Engine (Yoga)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Computes absolute positions for all nodes               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Render Pipeline                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Compositor  │→ │ Double Buffer │→ │  Output Strategy     │  │
│  │  (segments)  │  │  (diff)       │  │  (adaptive)          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Terminal Backend                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Synchronized Output + Single Write + Escape Sequences   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. TerminalBuffer (Enhanced)

```typescript
interface Cell {
  char: string;           // Character (may be multi-byte for emoji)
  fg: Color | null;       // Foreground color
  bg: Color | null;       // Background color
  attrs: CellAttributes;  // Bold, italic, underline, etc.
  width: number;          // Display width (1 or 2 for wide chars)
}

class TerminalBuffer {
  private cells: Cell[][];
  private width: number;
  private height: number;

  // Write styled content at position
  writeAt(x: number, y: number, content: string, style: Style): void;

  // Get cell at position
  getCell(x: number, y: number): Cell;

  // Compare two buffers, return changes
  static diff(current: TerminalBuffer, previous: TerminalBuffer): BufferDiff;

  // Clear buffer (fill with empty cells)
  clear(): void;

  // Resize buffer (preserving content where possible)
  resize(width: number, height: number): void;
}
```

#### 2. BufferDiff

```typescript
interface CellChange {
  x: number;
  y: number;
  cell: Cell;
}

interface LineChange {
  y: number;
  cells: Cell[];
  startX: number;
  endX: number;
}

interface BufferDiff {
  // Individual cell changes (for sparse updates)
  cellChanges: CellChange[];

  // Line-based changes (for contiguous updates)
  lineChanges: LineChange[];

  // Statistics for strategy selection
  totalChangedCells: number;
  totalCells: number;
  changedLines: number;
  totalLines: number;

  // Computed metrics
  get changeRatio(): number;  // 0.0 - 1.0
  get isFullRefreshBetter(): boolean;
}
```

#### 3. OutputStrategy

```typescript
enum OutputMode {
  Incremental,  // Update only changed cells/lines
  FullRefresh,  // Clear and redraw everything
  Hybrid,       // Mix of both based on region
}

interface OutputStrategy {
  /**
   * Determine best output mode based on diff statistics.
   *
   * Heuristics:
   * - If changeRatio > 0.5 (>50% changed): FullRefresh
   * - If changedLines < 5 and changes are localized: Incremental
   * - If changes span many non-contiguous regions: FullRefresh
   */
  selectMode(diff: BufferDiff): OutputMode;

  /**
   * Generate escape sequence output based on mode.
   */
  generateOutput(
    diff: BufferDiff,
    buffer: TerminalBuffer,
    mode: OutputMode
  ): string;
}
```

#### 4. SynchronizedOutput

```typescript
class SynchronizedOutput {
  private buffer: string[] = [];
  private syncSupported: boolean | null = null;

  /**
   * Begin synchronized update (prevent tearing)
   * Uses CSI ? 2026 h
   */
  beginSync(): void {
    if (this.syncSupported !== false) {
      this.buffer.push('\x1b[?2026h');
    }
  }

  /**
   * End synchronized update
   * Uses CSI ? 2026 l
   */
  endSync(): void {
    if (this.syncSupported !== false) {
      this.buffer.push('\x1b[?2026l');
    }
  }

  /**
   * Add content to output buffer
   */
  write(content: string): void {
    this.buffer.push(content);
  }

  /**
   * Flush all buffered content in single write
   */
  flush(): void {
    const output = this.buffer.join('');
    this.buffer = [];
    process.stdout.write(output);
  }
}
```

#### 5. Renderer (Unified)

```typescript
class Renderer {
  private currentBuffer: TerminalBuffer;
  private previousBuffer: TerminalBuffer;
  private output: SynchronizedOutput;
  private strategy: OutputStrategy;
  private mode: 'inline' | 'fullscreen';

  // Cursor position tracking (for inline mode)
  private cursorY: number = 0;
  private contentHeight: number = 0;

  /**
   * Render a frame
   *
   * 1. Clear current buffer
   * 2. Render all widgets to current buffer
   * 3. Compute diff with previous buffer
   * 4. Select output strategy
   * 5. Generate and flush output
   * 6. Swap buffers
   */
  render(node: TUINode, layoutMap: LayoutMap): void {
    // Phase 1: Render to buffer
    this.currentBuffer.clear();
    this.renderNode(node, layoutMap);

    // Phase 2: Compute diff
    const diff = TerminalBuffer.diff(this.currentBuffer, this.previousBuffer);

    // Phase 3: Select strategy
    const mode = this.strategy.selectMode(diff);

    // Phase 4: Generate output
    this.output.beginSync();

    if (this.mode === 'fullscreen') {
      this.renderFullscreen(diff, mode);
    } else {
      this.renderInline(diff, mode);
    }

    this.output.endSync();
    this.output.flush();

    // Phase 5: Swap buffers
    [this.currentBuffer, this.previousBuffer] =
      [this.previousBuffer, this.currentBuffer];
  }

  private renderFullscreen(diff: BufferDiff, mode: OutputMode): void {
    if (mode === OutputMode.FullRefresh) {
      // Clear screen and redraw all
      this.output.write('\x1b[2J\x1b[H');
      this.output.write(this.currentBuffer.renderFull());
    } else {
      // Update only changed lines using absolute positioning
      for (const change of diff.lineChanges) {
        const row = change.y + 1;
        this.output.write(`\x1b[${row};1H\x1b[2K`);
        this.output.write(this.renderLine(change.cells));
      }
    }
  }

  private renderInline(diff: BufferDiff, mode: OutputMode): void {
    const newHeight = this.currentBuffer.getContentHeight();
    const prevHeight = this.contentHeight;

    if (mode === OutputMode.FullRefresh || newHeight !== prevHeight) {
      // Clear previous content and redraw all
      this.clearInlineContent(prevHeight);
      this.output.write(this.currentBuffer.renderFull());
      this.moveToTop(newHeight);
    } else {
      // Update only changed lines using relative positioning
      for (const change of diff.lineChanges) {
        this.moveTo(change.y);
        this.output.write(`\r\x1b[2K`);
        this.output.write(this.renderLine(change.cells));
      }
      this.moveTo(0);
    }

    this.contentHeight = newHeight;
  }

  private clearInlineContent(height: number): void {
    if (height === 0) return;

    // Move to start, clear each line
    this.output.write('\r');
    for (let i = 0; i < height; i++) {
      this.output.write('\x1b[2K');
      if (i < height - 1) {
        this.output.write('\x1b[1B\r');
      }
    }
    // Move back to top
    if (height > 1) {
      this.output.write(`\x1b[${height - 1}A`);
    }
    this.output.write('\r');
  }

  cleanup(): void {
    if (this.mode === 'inline' && this.contentHeight > 0) {
      // Move cursor to bottom of content
      if (this.contentHeight > 1) {
        process.stdout.write(`\x1b[${this.contentHeight - 1}B`);
      }
      process.stdout.write('\n');
    }
  }
}
```

### Output Strategy Heuristics

```typescript
const FULL_REFRESH_THRESHOLDS = {
  // If more than 50% of cells changed, full refresh is likely faster
  changeRatio: 0.5,

  // If more than 60% of lines have changes, full refresh
  lineChangeRatio: 0.6,

  // If changes span more than 80% of height, full refresh
  heightSpanRatio: 0.8,

  // Minimum changes to consider incremental (below this, always incremental)
  minChangesForFullRefresh: 50,
};

function selectOutputMode(diff: BufferDiff): OutputMode {
  const { totalChangedCells, totalCells, changedLines, totalLines } = diff;

  // Always incremental for small changes
  if (totalChangedCells < FULL_REFRESH_THRESHOLDS.minChangesForFullRefresh) {
    return OutputMode.Incremental;
  }

  // Check change ratios
  const cellRatio = totalChangedCells / totalCells;
  const lineRatio = changedLines / totalLines;

  if (cellRatio > FULL_REFRESH_THRESHOLDS.changeRatio ||
      lineRatio > FULL_REFRESH_THRESHOLDS.lineChangeRatio) {
    return OutputMode.FullRefresh;
  }

  // Check if changes are scattered (non-contiguous)
  const contiguousScore = calculateContiguityScore(diff);
  if (contiguousScore < 0.3) {
    // Highly scattered changes - full refresh might be cleaner
    return OutputMode.FullRefresh;
  }

  return OutputMode.Incremental;
}
```

### Inline Mode: Height Change Handling

```typescript
/**
 * When content height changes in inline mode:
 *
 * GROW (10 -> 20 lines):
 *   1. Clear existing 10 lines
 *   2. Write new 20 lines
 *   3. Move cursor back to line 0
 *
 * SHRINK (20 -> 10 lines):
 *   1. Clear existing 20 lines (IMPORTANT: clear ALL old lines)
 *   2. Write new 10 lines
 *   3. Move cursor back to line 0
 *
 * NO CHANGE (20 -> 20 lines):
 *   1. Use diff-based incremental update
 *   2. Only update changed lines
 */
```

### Key Principles

1. **Never Clear Then Write Separately**
   - Always overwrite content in place
   - Clear and write in same operation to prevent flicker

2. **Single Write Per Frame**
   - Buffer all escape sequences
   - Flush once at end of frame

3. **Synchronized Output**
   - Use `CSI ? 2026 h/l` to prevent tearing
   - Graceful degradation for unsupported terminals

4. **Adaptive Strategy**
   - Small changes: incremental diff update
   - Large changes: full refresh
   - Height changes: always full refresh

5. **Consistent Cursor Management**
   - Cursor always at line 0 after render
   - Cleanup positions cursor at content bottom

## Consequences

### Positive
- No flickering or tearing
- Optimal performance for both small and large changes
- Components don't need to know about rendering
- Consistent behavior across inline and fullscreen modes
- Robust cursor management

### Negative
- More complex implementation
- Need to tune thresholds for different use cases
- Synchronized output not supported by all terminals

## Fine-Grained Reactivity Optimizations

Our signal-based system provides advantages over traditional Virtual DOM diffing:

### What We Know That React Doesn't

| Information | Virtual DOM | Fine-Grained |
|-------------|-------------|--------------|
| Which nodes changed | ❌ Must diff entire tree | ✅ `dirtyNodes` Set |
| What triggered change | ❌ Unknown | ✅ Specific signal |
| Affected regions | ❌ Must compute | ✅ Can pre-calculate |

### Three Levels of Optimization

#### Level 1: Node-Level Dirty Tracking (Current)
```typescript
// When signal changes
dirtyNodes.add(node);
scheduleRender();

// On render
for (const node of allNodes) {
  renderNode(node, buffer);  // Render all, but nodes can check dirty flag
}
// Then diff entire buffer
```
**Complexity:** O(nodes) render + O(width × height) diff

#### Level 2: Region-Based Rendering (Recommended)
```typescript
// When signal changes
dirtyNodes.add(node);
const region = getNodeRegion(node, layoutMap);
dirtyRegions.add(region);
scheduleRender();

// On render - only process dirty regions
for (const region of dirtyRegions) {
  const affectedNodes = getNodesInRegion(region);
  for (const node of affectedNodes) {
    renderNode(node, buffer);
  }
  // Diff only this region
  diffRegion(region, currentBuffer, previousBuffer);
}
```
**Complexity:** O(dirty_nodes) render + O(dirty_region_area) diff

#### Level 3: Cell Ownership Tracking (Advanced)
```typescript
// Each node owns specific buffer cells
interface NodeRenderInfo {
  node: TUINode;
  cells: Array<{x: number, y: number}>;
  lastRender: string;  // Cached render output
}

// When signal changes
const node = dirtyNodes.get(nodeId);
const cells = node.ownedCells;

// On render - direct cell update, skip diff entirely
const newContent = renderNode(node);
if (newContent !== node.lastRender) {
  updateCells(node.cells, newContent);
  node.lastRender = newContent;
}
```
**Complexity:** O(dirty_cells) - no diffing needed!

### Recommended Architecture

```typescript
class FineGrainedRenderer {
  private dirtyNodes: Set<TUINode> = new Set();
  private dirtyRegions: Set<Region> = new Set();
  private nodeRegions: Map<TUINode, Region> = new Map();

  /**
   * Called by signal system when a node's dependency changes
   */
  markDirty(node: TUINode): void {
    this.dirtyNodes.add(node);

    // Calculate affected region
    const region = this.calculateRegion(node);
    if (region) {
      this.dirtyRegions.add(region);
    }

    this.scheduleRender();
  }

  /**
   * Render only what's necessary
   */
  render(): void {
    if (this.dirtyRegions.size === 0) return;

    // Check if we should do full refresh
    const totalDirtyArea = this.calculateTotalDirtyArea();
    const totalArea = this.width * this.height;

    if (totalDirtyArea / totalArea > 0.5) {
      // More than 50% dirty - full refresh is faster
      this.fullRender();
    } else {
      // Incremental update
      this.incrementalRender();
    }

    this.dirtyNodes.clear();
    this.dirtyRegions.clear();
  }

  private incrementalRender(): void {
    this.output.beginSync();

    for (const region of this.dirtyRegions) {
      // Re-render only nodes in this region
      const nodes = this.getNodesInRegion(region);
      for (const node of nodes) {
        this.renderNodeToBuffer(node, region);
      }

      // Diff only this region
      const changes = this.diffRegion(region);

      // Output changes
      this.outputChanges(changes);
    }

    this.output.endSync();
    this.output.flush();
  }
}
```

### Layout Change Handling

When layout changes (not just content), we need to be more careful:

```typescript
enum DirtyType {
  Content,   // Only text/style changed, position same
  Layout,    // Position/size changed
  Structure, // Node added/removed
}

// Content change: update only affected cells
// Layout change: re-render node + potentially siblings
// Structure change: re-render entire subtree
```

### Performance Comparison

| Scenario | Virtual DOM | Fine-Grained L1 | Fine-Grained L2 |
|----------|-------------|-----------------|-----------------|
| Single text change | Diff all | Diff all | Diff region |
| Timer update (1 cell) | O(n²) | O(n²) | O(1) |
| Large list scroll | O(n²) | O(n²) | O(visible) |
| Full redraw | O(n²) | O(n²) | O(n²) |

### Integration with Current System

Current `render-context.ts` already has:
```typescript
interface RenderContext {
  dirtyNodes: Set<TUINode>;
  scheduleUpdate: () => void;
  invalidateLayout: () => void;
}
```

We need to add:
```typescript
interface RenderContext {
  dirtyNodes: Set<TUINode>;
  dirtyRegions: Set<Region>;  // NEW
  nodeRegions: Map<TUINode, Region>;  // NEW
  scheduleUpdate: () => void;
  invalidateLayout: () => void;
}
```

## References

- [Textual: Algorithms for High Performance Terminal Apps](https://textual.textualize.io/blog/2024/12/12/algorithms-for-high-performance-terminal-apps/)
- [Ratatui: Rendering Under the Hood](https://ratatui.rs/concepts/rendering/under-the-hood/)
- [Terminal Synchronized Output Protocol](https://gist.github.com/christianparpart/d8a62cc1ab659194337d73e399004036)
- [Ink: React for CLI](https://github.com/vadimdemedes/ink)
- [7 Things I've Learned Building a Modern TUI Framework](https://www.textualize.io/blog/7-things-ive-learned-building-a-modern-tui-framework/)
