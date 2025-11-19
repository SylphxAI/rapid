# Architecture

## System Overview

Zen implements a **prototype-based reactive graph** with automatic dependency tracking and micro-batching. The system achieves O(1) signal creation, O(n) dependency tracking, and zero-allocation hot paths.

Core primitive: `signal<T>()` creates reactive state. Derived values via `computed()`. Side effects via `effect()`. All dependencies tracked automatically—no manual arrays needed.

**Key innovation:** Automatic micro-batching batches downstream notifications during write operations, eliminating redundant recomputations without explicit `batch()` calls.

## Key Components

<!-- VERIFY: packages/zen-signal/src/zen.ts -->
- **Signal** (`packages/zen-signal/src/zen.ts`): Core reactive primitive with prototype-based creation
- **Computed** (`packages/zen-signal/src/zen.ts`): Lazy computed values with auto-tracked dependencies
- **Effect** (`packages/zen-signal/src/zen.ts`): Side effects with auto-tracking and cleanup support
- **Batching System** (`packages/zen-signal/src/zen.ts`): Micro-batch + explicit batch with deduplication
- **Auto-tracking** (`packages/zen-signal/src/zen.ts`): Global `currentListener` tracks dependencies during execution

<!-- VERIFY: packages/zen/src/ -->
- **Zen Framework** (`packages/zen/`): Fine-grained reactive framework with custom JSX runtime

<!-- VERIFY: packages/unplugin-zen-signal/ -->
- **Universal Plugin** (`packages/unplugin-zen-signal/`): Runtime-first architecture with optional compiler optimizations

## Cross-Platform Architecture

Zen uses a **Runtime-First Core + Optional Compiler DX Layer** architecture to enable cross-platform support.

### Layer 1: Core Reactivity (Platform-Agnostic)
- `@zen/signal-core`: Pure signals, computed, effect
- `@zen/signal`: + Lifecycle (onMount, onCleanup, Owner system)
- No platform dependencies

### Layer 2: Runtime Core (Platform-Agnostic)
- `@zen/runtime`: Components (Show, For, Switch), utilities, server utils
- **NO DOM dependencies** - works on web, native, terminal
- Contains all reactive logic and control flow

### Layer 3: Platform Renderers
- `@zen/web`: DOM operations, SSR, hydration
- `@zen/native`: Native elements (iOS/Android)
- `@zen/tui`: Terminal rendering
- Each implements platform-specific `jsx()` runtime

### Layer 4: Optional Compiler (DX Enhancement)
- `@zen/compiler`: JSX syntax transformer
- Auto-lazy children: `<Show><Child /></Show>` → auto-wrapped
- Signal auto-unwrap: `{signal}` → `{() => signal.value}`
- Platform-agnostic: transforms JSX syntax only, not code generation
- Vite/Webpack/Metro plugins

### Why This Architecture?

**Runtime-First Benefits**:
- ✅ Works without build tools (CDN usage possible)
- ✅ Easier debugging (no compiled code)
- ✅ Gradual adoption (add compiler later)
- ✅ Cross-platform flexibility

**Compiler Benefits** (when added):
- ✅ Best-in-class DX (auto-lazy, auto-unwrap)
- ✅ Same syntax as Solid.js
- ✅ Works across all platforms (web/native/tui)

**Key Insight**: Compiler is a **syntax transformer**, not a code generator. It outputs platform-agnostic JSX calls, then each renderer handles the platform-specific implementation.

## Design Patterns

### Pattern: Prototype-Based Signal Creation
**Why:** Minimize allocation overhead vs class constructors
**Where:** `signal()` in `packages/zen-signal/src/zen.ts`
**Trade-off:** Slightly less intuitive vs classes, but 30%+ faster creation. Worth it: signals created frequently.

### Pattern: Automatic Micro-Batching (v3.48.0+)
**Why:** Batch downstream notifications during writes without explicit `batch()` calls
**Where:** `zenProto.value` setter in `packages/zen-signal/src/zen.ts`
**Trade-off:** Extra logic in write path vs smoother effects and better perf. Worth it: 37% faster concurrent updates, eliminates glitches.

### Pattern: O(n) Inline Deduplication
**Why:** Avoid O(n²) `includes()` or Set overhead for dependency tracking
**Where:** `zenProto.value` getter, `computedProto.value` getter in `packages/zen-signal/src/zen.ts`
**Trade-off:** Manual loop vs Set abstraction. Worth it: Dependency arrays typically small (1-5 items), inline loop faster.

### Pattern: Dirty Flag Propagation
**Why:** Lazily invalidate computed values without eager recomputation
**Where:** `zenProto.value` setter in `packages/zen-signal/src/zen.ts`
**Trade-off:** Pull-based recomputation vs push-based. Worth it: Many computeds never re-read after invalidation.

### Pattern: Auto-Tracking with Global Listener
**Why:** Eliminate manual dependency arrays
**Where:** `currentListener` global in `packages/zen-signal/src/zen.ts`
**Trade-off:** Global state vs explicit deps. Worth it: Cleaner API, handles conditional/dynamic deps automatically.

### Pattern: Runtime-First Architecture (ADR-001)
**Why:** Framework integrations work without compiler, compiler optional for optimization
**Where:** `packages/unplugin-zen-signal/`
**Trade-off:** Runtime overhead (~5-10%) vs zero-config experience. Worth it: Developer experience, easier debugging, compiler can optimize later.

### Pattern: Framework-Specific Adapter Packages
**Why:** Avoid npm warnings from optional peerDependencies, follow industry standard (TanStack, Nanostores)
**Where:** `packages/zen-signal-{react,vue,preact}/`, `packages/zen-router-{react,vue,preact}/`
**Trade-off:** More packages to maintain vs clean npm install experience. Worth it: Users only install what they need, no warnings, clearer separation.

### Pattern: unplugin for Universal Bundler Support
**Why:** Write once, support all bundlers (Vite, Webpack, Rollup, esbuild) automatically
**Where:** `packages/unplugin-zen-signal/` (internal dependency, re-exported by framework packages)
**Trade-off:** Extra abstraction layer vs writing separate plugins for each bundler. Worth it: DRY principle, consistent behavior across bundlers.

### Pattern: Native Framework Integration
**Why:** Zen framework doesn't need separate adapter, lifecycle integration built-in
**Where:** `packages/zen/src/index.ts` - lifecycle-aware `effect()` wraps raw effect with owner tracking
**Trade-off:** Zen-specific code in core framework vs separate adapter. Worth it: Eliminates circular dependency, simpler architecture for native framework.

## Boundaries

**In scope:**
- Signal primitives (signal, computed, effect, subscribe)
- Batch updates (batch, untrack, peek)
- Auto-tracking system
- Memory optimization for hot paths
- TypeScript type safety
- Framework integrations (runtime + compiler modes)

**Out of scope:**
- Framework-specific state patterns (Redux, Zustand-style stores) - see `@zen/signal-extensions/patterns`
- Persistence - see `@zen/signal-extensions/persistent`
- Immutability helpers - see `@zen/signal-extensions/craft`
- Routing - see `@zen/router`
- DevTools - future package

## Package Structure

```
packages/
  # Core Reactivity
  zen-signal-core/         @zen/signal-core - Pure signals (1.75KB)
  zen-signal/              @zen/signal - + Lifecycle + Owner system
  zen-signal-extensions/   @zen/signal-extensions - Patterns, persistent, craft

  # Framework Core (NEW - Cross-Platform)
  zen-runtime/             @zen/runtime - Platform-agnostic runtime
                           Components (Show, For, Switch, Context, etc.)
                           Utilities (lazy, mergeProps, selector)
                           Server utils (SSR support)
                           NO DOM DEPENDENCIES

  # Platform Renderers (NEW)
  zen-web/                 @zen/web - Web renderer (DOM, SSR, hydration)
  zen-native/              @zen/native - Native renderer (iOS, Android)
  zen-tui/                 @zen/tui - Terminal UI renderer

  # Developer Experience (NEW)
  zen-compiler/            @zen/compiler - Optional JSX transformer
                           Auto-lazy children transformation
                           Signal auto-unwrap
                           Platform-agnostic syntax transformation
                           Vite/Webpack/Metro plugins

  # Meta Packages
  zen/                     @zen/zen - Convenience (re-exports runtime + web)
  zen-start/               @zen/start - Full-stack meta-framework

  # Router
  zen-router-core/         @zen/router-core - Core routing
  zen-router/              @zen/router - Router for Zen

  # Cross-Framework Integration
  zen-signal-react/        @zen/signal-react - React integration
  zen-signal-vue/          @zen/signal-vue - Vue integration
  zen-signal-preact/       @zen/signal-preact - Preact integration
  zen-router-react/        @zen/router-react - React router
  zen-router-vue/          @zen/router-vue - Vue router
  zen-router-preact/       @zen/router-preact - Preact router
  unplugin-zen-signal/     unplugin-zen-signal - For other frameworks
```

## Performance Characteristics

**From v3.49.0 benchmarks:**
- Very Deep Chain (100 layers): 5.6M ops/sec (42x faster than v3.48.0)
- Deep Chain (10 layers): 7.7M ops/sec (5.8x faster)
- Deep Diamond (5 layers): 1.8M ops/sec (4.7x faster)
- Moderate Read (100x): 1.9M ops/sec (2.4x faster)

**Bundle sizes:**
- @zen/signal: 1.68 KB gzipped (3.7 KB minified)
- Target: ≤1.75 KB gzipped

## Architecture Evolution

**v3.1.1:** Simple prototype-based, dirty flags, no timestamps
**v3.48.0:** Added automatic micro-batching for smooth effects
**v3.49.0:** Combined v3.1.1 simplicity + v3.48.0 batching, removed all timestamp overhead
**Current:** Prototype-based with micro-batching, O(n) deduplication, zero allocations in hot paths
