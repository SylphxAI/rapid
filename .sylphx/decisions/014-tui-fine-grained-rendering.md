# 014. TUI Fine-Grained Rendering Architecture

**Status:** ✅ Accepted
**Date:** 2025-11-23

## Context

TUI rendering currently uses full tree re-render on every signal change, requiring workarounds like `children: () => [...]` instead of natural `children: [...]`. This differs from web rendering and forces users to write platform-specific code.

**Current Problems:**
1. Full re-render on every signal change (inefficient)
2. Static arrays with reactive functions create stale closures
3. Different patterns required vs web (user must adapt to platform)
4. No persistent node instances (recreate everything each render)

**Goal:** Make TUI rendering work like SolidJS - fine-grained, no reconciler, same API as web.

## Decision

Implement **persistent virtual DOM with fine-grained reactivity** (SolidJS-style for TUI):

### Architecture

```
Signal change → Effect on specific node → Update node directly → Mark dirty
                                                                      ↓
                                                           Render dirty subtree only
                                                                      ↓
                                                           Yoga layout (dirty regions)
                                                                      ↓
                                                           Terminal buffer diff → Update
```

**No reconciler needed** - nodes are persistent, effects update directly.

### Components

**1. Persistent Virtual Nodes:**
```typescript
class TUIElement {
  type: string;
  props: Record<string, any>;
  children: TUIElement[];
  yogaNode: YogaNode;  // Persistent Yoga node

  // Fine-grained tracking
  effects: Set<Effect>;
  dirtyProps: Set<string>;
  dirtyLayout: boolean;
  dirtyContent: boolean;

  // Direct updates (no reconciliation)
  setProp(key: string, value: any) {
    if (this.props[key] !== value) {
      this.props[key] = value;
      this.dirtyProps.add(key);
      markDirty(this);
    }
  }

  updateStyle(newStyle: TUIStyle) {
    // Update Yoga node directly
    if (newStyle.width !== this.style.width) {
      this.yogaNode.setWidth(newStyle.width);
      this.dirtyLayout = true;
    }
  }
}
```

**2. Fine-Grained Update Tracking:**
```typescript
// When creating element with reactive props
function createElement(type, props) {
  const element = new TUIElement(type);

  // Set up reactive tracking for each prop
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'function') {
      // Reactive prop - create effect
      effect(() => {
        const newValue = value();  // Track signal deps
        element.setProp(key, newValue);  // Update directly
      });
    } else {
      element.setProp(key, value);
    }
  }

  return element;
}
```

**3. Incremental Rendering:**
```typescript
function flushUpdates() {
  const dirtyNodes = collectDirtyNodes();  // Already marked by effects

  // 1. Re-layout only dirty subtrees
  const layoutDirty = dirtyNodes.filter(n => n.dirtyLayout);
  for (const node of layoutDirty) {
    recalculateLayout(node);  // Only this subtree
  }

  // 2. Render only dirty nodes to strings
  const rendered = dirtyNodes.map(renderNode);

  // 3. Update terminal buffer (existing diff logic)
  terminalBuffer.update(rendered);

  // 4. Clear dirty flags
  dirtyNodes.forEach(n => n.clearDirty());
}
```

### Migration Path

**Phase 1:** Persistent nodes
- Create `TUIElement` class
- Build persistent tree on mount
- Keep Yoga nodes alive

**Phase 2:** Fine-grained effects
- Track signal dependencies per element
- Direct updates on signal changes
- Mark dirty flags

**Phase 3:** Incremental rendering
- Render only dirty nodes
- Incremental layout
- Buffer diff (existing)

**Phase 4:** API cleanup
- Remove `children: () => []` workaround
- Support natural `children: []` syntax
- Identical API to web

## Rationale

**Why persistent nodes?**
- Terminal has no "DOM" - need virtual persistent layer
- Same reason SolidJS works (persistent real DOM)

**Why no reconciler?**
- Fine-grained reactivity knows exactly what changed
- Effects already track dependencies
- No diffing needed - direct updates

**Why better than React Ink?**
- React: Top-down re-render → VDOM diff → reconcile
- Zen: Bottom-up effect → direct node update
- No reconciliation overhead, better performance

**Comparison:**

| Approach | Persistent Nodes | Reconciler | Update Strategy |
|----------|-----------------|------------|-----------------|
| React Ink | ✅ VDOM | ✅ Yes | Top-down diff |
| **Zen TUI** | ✅ Virtual | ❌ No | Fine-grained |
| Web SolidJS | ✅ Real DOM | ❌ No | Fine-grained |

## Consequences

**Positive:**
- ✅ Same API as web (no platform-specific patterns)
- ✅ Better performance (no full re-render)
- ✅ Natural syntax (`children: [...]` works)
- ✅ No stale closure bugs
- ✅ Incremental updates (like SolidJS)

**Negative:**
- Memory overhead for persistent nodes (acceptable - same as React Ink)
- More complex implementation (one-time cost)
- Need to manage node lifecycle

**Migration Impact:**
- Existing components work (backward compatible)
- `children: () => []` pattern still works
- Can gradually remove workarounds

## References

- Implementation: `packages/zen-tui/src/element.ts` (new)
- Related: ADR-011 (Descriptor Pattern)
- Inspiration: SolidJS (fine-grained), React Ink (TUI rendering)
