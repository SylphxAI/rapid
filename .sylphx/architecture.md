# Architecture

## System Overview

Zen is a **runtime-first reactive framework** supporting multiple platforms (web, native, TUI). The core philosophy: everything must work at runtime without build tools. Compiler is optional DX optimization only.

## Key Components

- **@zen/signal** (`packages/zen-signal/`): Core reactivity system (signals, computed, effects)
- **@zen/runtime** (`packages/zen-runtime/`): Platform-agnostic runtime (Context, children() helper, lifecycle)
- **@zen/compiler** (`packages/zen-compiler/`): **OPTIONAL** JSX transformer for DX (auto-lazy children, signal unwrap)
- **@zen/web** (`packages/zen-web/`): Web DOM renderer
- **@zen/tui** (`packages/zen-tui/`): Terminal UI renderer
- **@zen/native** (`packages/zen-native/`): React Native renderer

## Design Patterns

### Pattern: Runtime-First with Optional Compiler

**Why:** Zero-build requirement. Users can `bun run app.tsx` directly.

**Implementation:**
- Runtime provides `children()` helper for manual lazy evaluation
- Compiler auto-transforms `props.children` to lazy getter
- Both paths work, compiler is just faster

**Example:**
```tsx
// Runtime approach (always works):
function Provider(props) {
  const c = children(() => props.children);
  setupContext();
  return c();
}

// With compiler (auto-optimized):
// Compiler transforms: children: <Child /> 
// Into: get children() { return <Child /> }
```

**Trade-off:** Manual `children()` calls vs automatic. Chose flexibility over convenience.

### Pattern: Universal Lazy Children

**Why:** Context providers need children to evaluate AFTER setup, not before.

**Where:** `@zen/runtime/src/components/Context.ts`

**Implementation:** 
- `Provider` uses `children(() => props.children)` internally
- Works at runtime without compiler
- Compiler optimization still compatible

**Trade-off:** Small runtime overhead vs zero-config support.

### Pattern: Platform Adapters

**Why:** Single codebase, multiple targets (web/native/TUI).

**Where:** Each platform package exports `jsx()` + `getPlatformOps()`

**Implementation:**
- Components use `getPlatformOps()` for platform-specific operations
- JSX runtime calls appropriate renderer
- Same reactive core, different output

**Trade-off:** Abstraction layer vs code duplication. Enables true cross-platform.

## Architecture Principles

1. **Runtime-first:** Must work without build tools
2. **Compiler-optional:** DX optimization only, never required
3. **Platform-agnostic:** Core in @zen/runtime, renderers separate
4. **Explicit over magic:** `children()` helper over hidden compiler dependency

## Boundaries

**In scope:**
- Reactive primitives (signals, effects)
- Cross-platform component runtime
- Optional compiler for DX
- Web, Native, TUI renderers

**Out of scope:**
- Server-side rendering (may add later)
- Static site generation
- Build-time optimizations beyond JSX transform
