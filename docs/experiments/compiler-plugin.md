# Zen Compiler Plugin - Auto-Tracking

## Overview

A Babel/SWC plugin to automatically extract dependencies from `autoComputed()` calls.

---

## What It Does

### Input (Your Code)

```typescript
import { zen, autoComputed } from '@sylphx/zen';

const a = zen(0);
const b = zen(1);
const c = zen(2);

const sum = autoComputed(() => a.value + b.value);
const conditional = autoComputed(() => {
  return c.value > 0 ? a.value : b.value;
});
```

### Output (Compiled Code)

```typescript
import { zen, computed } from '@sylphx/zen';

const a = zen(0);
const b = zen(1);
const c = zen(2);

const sum = computed([a, b], (_a, _b) => _a + _b);
const conditional = computed([c, a, b], (_c, _a, _b) => {
  return _c > 0 ? _a : _b;
});
```

---

## Implementation

### Babel Plugin (JavaScript/TypeScript)

```javascript
// babel-plugin-zen-auto-tracking.js
module.exports = function ({ types: t }) {
  return {
    name: "zen-auto-tracking",
    visitor: {
      CallExpression(path) {
        // Match: autoComputed(() => ...)
        if (!isAutoComputedCall(path)) return;

        const [fn] = path.node.arguments;
        if (!t.isArrowFunctionExpression(fn) && !t.isFunctionExpression(fn)) {
          throw path.buildCodeFrameError(
            'autoComputed requires a function expression'
          );
        }

        // Extract dependencies
        const deps = extractDependencies(fn, path);

        if (deps.length === 0) {
          console.warn('No dependencies found in autoComputed');
          return;
        }

        // Transform function body to use parameters
        const params = deps.map((_, i) => t.identifier(`_dep${i}`));
        const newBody = transformBody(fn.body, deps, params);

        // Create new function with parameters
        const newFn = t.arrowFunctionExpression(params, newBody);

        // Replace autoComputed with computed
        path.node.callee.name = 'computed';
        path.node.arguments = [
          t.arrayExpression(deps.map(d => t.identifier(d))),
          newFn
        ];
      }
    }
  };

  function isAutoComputedCall(path) {
    return (
      t.isCallExpression(path.node) &&
      t.isIdentifier(path.node.callee, { name: 'autoComputed' })
    );
  }

  function extractDependencies(fn, path) {
    const deps = new Set();

    // Traverse function body to find .value accesses
    path.traverse({
      MemberExpression(memberPath) {
        // Match: something.value
        if (
          t.isIdentifier(memberPath.node.property, { name: 'value' }) &&
          t.isIdentifier(memberPath.node.object)
        ) {
          deps.add(memberPath.node.object.name);
        }
      }
    });

    return Array.from(deps);
  }

  function transformBody(body, deps, params) {
    // Replace each dep.value with corresponding parameter
    const depMap = Object.fromEntries(
      deps.map((dep, i) => [dep, params[i].name])
    );

    return t.cloneDeepWithoutLoc(body, (node) => {
      if (
        t.isMemberExpression(node) &&
        t.isIdentifier(node.property, { name: 'value' }) &&
        t.isIdentifier(node.object) &&
        depMap[node.object.name]
      ) {
        return t.identifier(depMap[node.object.name]);
      }
      return node;
    });
  }
};
```

---

## Usage

### 1. Install Plugin

```bash
npm install --save-dev babel-plugin-zen-auto-tracking
```

### 2. Configure Babel

```javascript
// babel.config.js
module.exports = {
  plugins: [
    'babel-plugin-zen-auto-tracking'
  ]
};
```

### 3. Write Code

```typescript
import { zen, autoComputed } from '@sylphx/zen';

const count = zen(0);
const doubled = autoComputed(() => count.value * 2);
```

### 4. Compiled Output

```typescript
import { zen, computed } from '@sylphx/zen';

const count = zen(0);
const doubled = computed([count], (_dep0) => _dep0 * 2);
```

---

## SWC Plugin (Rust - Faster)

For better performance, implement in Rust using SWC:

```rust
use swc_core::ecma::{
    ast::*,
    visit::{VisitMut, VisitMutWith},
};

pub struct ZenAutoTracking;

impl VisitMut for ZenAutoTracking {
    fn visit_mut_call_expr(&mut self, call: &mut CallExpr) {
        call.visit_mut_children_with(self);

        // Check if this is autoComputed()
        if !is_auto_computed(call) {
            return;
        }

        // Extract dependencies
        let deps = extract_dependencies(call);

        // Transform to computed([deps], fn)
        transform_to_computed(call, deps);
    }
}

fn is_auto_computed(call: &CallExpr) -> bool {
    matches!(
        &call.callee,
        Callee::Expr(box Expr::Ident(ident)) if ident.sym == "autoComputed"
    )
}

fn extract_dependencies(call: &CallExpr) -> Vec<String> {
    let mut deps = Vec::new();

    // Traverse AST to find .value accesses
    // ... implementation ...

    deps
}

fn transform_to_computed(call: &mut CallExpr, deps: Vec<String>) {
    // Replace autoComputed with computed
    // Add deps array as first argument
    // Transform function body
    // ... implementation ...
}
```

---

## Advantages

### ✅ Zero Runtime Overhead
- No tracking checks on every `.value` access
- Compiled to explicit dependencies
- Same performance as manual approach

### ✅ Better DX
- Write: `autoComputed(() => a.value + b.value)`
- Get: `computed([a, b], (_a, _b) => _a + _b)`

### ✅ Static Analysis
- TypeScript can infer types better
- Easier to tree-shake
- Build-time errors for missing deps

---

## Challenges

### 1. Dynamic Property Access

```typescript
const key = 'count';
const obj = zen({ count: 0, other: 1 });

// Can't detect dependency at compile time
const x = autoComputed(() => obj.value[key]);
```

**Solution:** Fall back to runtime tracking or show warning.

### 2. Conditional Dependencies

```typescript
const mode = zen('a');
const a = zen(1);
const b = zen(2);

const result = autoComputed(() => {
  return mode.value === 'a' ? a.value : b.value;
});
```

**Compiled to:**
```typescript
// Subscribes to all possible dependencies
const result = computed([mode, a, b], (_mode, _a, _b) => {
  return _mode === 'a' ? _a : _b;
});
```

This is actually **better** than runtime tracking!

### 3. Nested Function Calls

```typescript
function helper() {
  return count.value * 2;
}

const x = autoComputed(() => helper());
```

**Challenge:** Can't see inside `helper()` without inlining.

**Solution:**
- Inline helper during compilation
- Or require manual dependencies for helpers

### 4. Build Tool Integration

Need to integrate with:
- Webpack
- Vite
- Rollup
- esbuild
- SWC

Each has different plugin APIs.

---

## Implementation Difficulty

### Easy Parts (2-3 days)
- ✅ Basic Babel plugin for simple cases
- ✅ AST traversal to find `.value` accesses
- ✅ Simple transformations

### Medium Parts (1-2 weeks)
- 🔶 Handle all edge cases
- 🔶 Good error messages
- 🔶 TypeScript support
- 🔶 Source maps

### Hard Parts (1-2 months)
- 🔴 Cross-file dependency analysis
- 🔴 SWC/Rust implementation for performance
- 🔴 IDE integration (auto-complete, jump-to-def)
- 🔴 Debug support
- 🔴 Integration with all build tools

---

## Comparison with Solid.js

Solid.js has a much more complex compiler because:

1. **JSX Transformation**
   - Component to DOM
   - Event handlers
   - Control flow (For, Show, Switch)

2. **Fine-grained Reactivity**
   - Each text node is separate effect
   - Optimizes DOM updates

3. **Template Compilation**
   - Pre-compile HTML structure
   - Only reactive parts use effects

Zen's compiler would be **simpler** because:
- ✅ Only transform function calls
- ✅ No JSX
- ✅ No DOM optimization
- ✅ Just extract dependencies

---

## Is It Worth It?

### For Zen? Probably Not

**Reasons:**
1. **Small Target:** Only `autoComputed()` calls
2. **Breaking Change:** Need build step
3. **Complexity:** Maintenance burden
4. **Zen's Philosophy:** Explicit > Implicit

### When It Makes Sense

Compiler makes sense when:
- ✅ Lots of boilerplate eliminated (like Solid JSX)
- ✅ Significant performance gains
- ✅ Framework-level (not library-level)

---

## Alternative: IDE Plugin

Instead of compiler, create **VS Code extension**:

```typescript
// Type this
const sum = autoComputed(() => a.value + b.value);

// Extension shows hint:
// 💡 Convert to: computed([a, b], (a, b) => a + b)
//    [Quick Fix Available]
```

**Benefits:**
- ✅ No build step
- ✅ Better DX
- ✅ Educational (shows what it compiles to)
- ✅ Easier to implement

---

## Conclusion

### Compiler for Zen:
- **Difficulty:** Medium (2-4 weeks for MVP)
- **Maintenance:** High (ongoing)
- **Value:** Low (small DX improvement)

### Recommendation:
**Don't build compiler** for Zen because:
1. Explicit deps aren't that verbose
2. Adds complexity
3. Breaks Zen's "zero magic" philosophy

**Better alternatives:**
1. Keep explicit (current)
2. Add helper functions (e.g., `derive()`)
3. Create VS Code snippet
4. Build IDE extension for suggestions

---

## References

- [Babel Plugin Handbook](https://github.com/jamiebuilds/babel-handbook)
- [SWC Plugin Guide](https://swc.rs/docs/plugin/overview)
- [Solid Compiler](https://github.com/solidjs/solid/tree/main/packages/babel-preset-solid)
- [Svelte Compiler](https://github.com/sveltejs/svelte/tree/master/src/compiler)
