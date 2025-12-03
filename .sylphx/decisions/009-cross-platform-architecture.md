# ADR-009: Cross-Platform Architecture (Web, Native, TUI)

**Status:** ✅ Accepted
**Date:** 2024-11-19
**Supersedes:** Extends ADR-001 (Runtime-First Architecture)

---

## Context

Zen framework needs to expand beyond web to support **native mobile apps** and **terminal UI** applications while maintaining a clean architecture and great developer experience.

### Goals
- Support web (DOM), native (iOS/Android), and TUI (terminal) from same codebase
- Maintain runtime-first architecture with optional compiler
- Enable code sharing across platforms (components, logic, utilities)
- Avoid platform-specific lock-in at the framework core level

### Key Question
How do we architect packages to support multiple platforms without creating maintenance burden or compromising on each platform's capabilities?

---

## Decision

Adopt a **layered architecture** with platform-agnostic core and platform-specific renderers:

### Layer 1: Core Reactivity (Platform-Agnostic)
- `@rapid/signal-core`: Pure signals, computed, effect
- `@rapid/signal`: + Lifecycle (onMount, onCleanup, Owner system)
- **Constraint**: Zero platform dependencies

### Layer 2: Runtime Core (Platform-Agnostic)
- `@rapid/runtime`: Components (Show, For, Switch, Context, ErrorBoundary, Suspense, Dynamic)
- Utilities: lazy, mergeProps, splitProps, selector, runWithOwner
- Server utilities: isServer, createUniqueId
- **Constraint**: No `document`, `window`, or platform-specific APIs

### Layer 3: Platform Renderers
- `@rapid/web`: DOM operations, JSX runtime, SSR, hydration, Portal
- `@rapid/native`: Native elements (View, Text, Image, Pressable)
- `@rapid/tui`: Terminal rendering (Box, Text, Input)
- **Pattern**: Each implements platform-specific `jsx()` runtime

### Layer 4: Optional Compiler (DX Enhancement)
- `@rapid/compiler`: JSX syntax transformer
- Auto-lazy children: `<Show><Child /></Show>` → `<Show>{() => <Child />}</Show>`
- Signal auto-unwrap: `{signal}` → `{() => signal.value}`
- **Key**: Platform-agnostic syntax transformation only (not code generation)
- Plugins: Vite, Webpack, Metro (for React Native)

### Layer 5: Meta Packages
- `@rapid/zen`: Convenience package (re-exports @rapid/runtime + @rapid/web)
- `@rapid/start`: Full-stack meta-framework (file-based routing, server functions)

---

## Rationale

### Why This Layered Approach?

**Compared to React's Model** (which works):
- ✅ Similar: React (core) + react-dom + react-native
- ✅ Proven: React Native demonstrates this architecture works
- ✅ Code sharing: Components use same API across platforms

**Compared to Solid's Model** (which struggles):
- ❌ Solid's compiler generates DOM-specific code
- ❌ Solid Native is experimental, not production-ready
- ❌ Hard to share compiled code across platforms
- ✅ Zen's compiler = syntax transformer only, renderer handles platform

**Why Platform-Agnostic Compiler?**
- Transforms JSX syntax: `<Show><Child />` → `jsx(Show, {children: () => jsx(Child)})`
- Each renderer implements `jsx()` for their platform
- Same component code works everywhere
- Compiler doesn't know about DOM, View, or Box - just JSX transformation

---

## Key Insights

### 1. Runtime-First Enables Cross-Platform

**Without runtime-first**:
- Solid's compiler outputs: `const div = document.createElement("div")` ← DOM-specific!
- Cannot share this code with native or TUI

**With runtime-first** (Zen):
- Compiler outputs: `jsx("div", props)` ← Platform-agnostic!
- `@rapid/web` implements `jsx("div")` as DOM creation
- `@rapid/native` implements `jsx("div")` as View creation
- `@rapid/tui` implements `jsx("div")` as Box creation

### 2. React's Success Pattern

React achieved cross-platform because:
1. React core = platform-agnostic (no DOM)
2. react-dom, react-native = platform renderers
3. Same components work everywhere (mostly)

Zen follows this proven pattern with added benefits:
- Fine-grained reactivity (no vdom)
- Optional compiler for DX (React doesn't have this)

### 3. Compiler as DX Layer

**User Experience**:

Without compiler (manual):
```tsx
<Show when={() => condition.value}>
  {() => <ExpensiveComponent />}
</Show>
```

With compiler (auto):
```tsx
<Show when={condition}>
  <ExpensiveComponent />
</Show>
```

**Same runtime code** after compilation, works on all platforms!

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│  Application Code (Platform-Agnostic)          │
│  <Show when={signal}><Child /></Show>          │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  @rapid/compiler (Optional DX Layer)              │
│  Syntax Transformer                             │
│  jsx(Show, {                                    │
│    when: () => signal.value,                    │
│    children: () => jsx(Child, {})               │
│  })                                             │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  @rapid/runtime (Platform-Agnostic Core)          │
│  Show, For, Switch, Context, etc.               │
│  Components work same on all platforms          │
└─────────────────────────────────────────────────┘
                     ↓
    ┌────────────────┼────────────────┐
    ↓                ↓                ↓
┌────────┐      ┌─────────┐     ┌────────┐
│@rapid/web│      │@rapid/    │     │@rapid/tui│
│        │      │native   │     │        │
│DOM     │      │iOS/     │     │Terminal│
│SSR     │      │Android  │     │Render  │
└────────┘      └─────────┘     └────────┘
```

---

## Package Structure

### Before (Web-Only)
```
@rapid/signal              - Reactivity
@rapid/zen                 - Framework (DOM-coupled)
```

### After (Cross-Platform)
```
# Layer 1: Reactivity
@rapid/signal-core         - Pure signals
@rapid/signal              - + Lifecycle

# Layer 2: Platform-Agnostic Runtime
@rapid/runtime             - Components, utilities (NO DOM!)

# Layer 3: Platform Renderers
@rapid/web                 - Web renderer
@rapid/native              - Native renderer
@rapid/tui                 - Terminal renderer

# Layer 4: Optional Compiler
@rapid/compiler            - JSX transformer
  ├── vite plugin
  ├── webpack plugin
  └── metro plugin       - For React Native

# Layer 5: Meta Packages
@rapid/zen                 - Convenience (runtime + web)
@rapid/start               - Full-stack framework
```

---

## Implementation Strategy

### Phase 1: Refactor Core (Week 1)
1. Create `@rapid/runtime` (from `@rapid/zen` components)
2. Create `@rapid/web` (from `@rapid/zen` jsx-runtime)
3. Refactor `@rapid/zen` to re-export runtime + web
4. **Goal**: Zero breaking changes for existing users

### Phase 2: Compiler (Week 2)
1. Create `@rapid/compiler` package
2. Implement auto-lazy children transformation
3. Implement signal auto-unwrap
4. Vite plugin
5. **Goal**: Improve DX, validate platform-agnostic design

### Phase 3: TUI (Week 3-4)
1. Create `@rapid/tui` package
2. Implement terminal renderer
3. Build sample CLI app
4. **Goal**: Validate platform-agnostic architecture works

### Phase 4: Native (Month 2)
1. Create `@rapid/native` package
2. Implement native renderer
3. Metro bundler integration
4. **Goal**: Production-ready native support

### Phase 5: Full-Stack (Month 3+)
1. Create `@rapid/start` package
2. File-based routing
3. Server functions
4. **Goal**: Complete meta-framework

---

## Trade-offs

### Benefits
- ✅ Cross-platform code sharing (components, logic, utilities)
- ✅ Maintain runtime-first flexibility
- ✅ Optional compiler for DX (best of both worlds)
- ✅ Proven architecture pattern (React's model)
- ✅ Each platform can optimize independently

### Costs
- ❌ More packages to maintain (6 core packages vs 1)
- ❌ Must ensure runtime truly platform-agnostic (discipline required)
- ❌ Compiler must work across all build tools (Vite, Webpack, Metro)
- ❌ Documentation complexity (which package to use when?)

### Accepted Trade-offs
- **More packages**: Worth it for cross-platform capability
- **Maintenance**: Offset by code sharing and clear boundaries
- **Compiler complexity**: Only syntax transformation, not code generation
- **Docs complexity**: Mitigated by `@rapid/zen` meta-package for simple cases

---

## Success Metrics

### Phase 1-2 (Core + Compiler)
- ✅ Existing web apps work with zero changes
- ✅ `@rapid/runtime` has zero DOM/platform dependencies
- ✅ Compiler improves DX without breaking runtime-first

### Phase 3 (TUI Validation)
- ✅ Sample CLI app using `@rapid/runtime` components
- ✅ 80%+ component code shared between web and TUI
- ✅ Platform-specific code isolated to renderers

### Phase 4 (Native Production)
- ✅ Production mobile app built with Zen Native
- ✅ 70%+ code shared with web version
- ✅ Performance competitive with React Native

---

## Risks & Mitigations

### Risk 1: Runtime Not Truly Platform-Agnostic
**Impact**: High - Would break cross-platform goal
**Mitigation**:
- Strict code review: No `document`, `window`, platform APIs in runtime
- Automated checks in CI
- Test runtime on Node.js (no DOM) to catch violations

### Risk 2: Compiler Lock-In
**Impact**: Medium - Defeats runtime-first principle
**Mitigation**:
- All features work without compiler
- Compiler is optional DX layer only
- Document runtime API clearly

### Risk 3: Native Bundler Complexity
**Impact**: Medium - Metro different from Vite/Webpack
**Mitigation**:
- Keep compiler transformation simple (syntax only)
- Test Metro plugin early
- React Native uses Metro successfully (proven)

---

## References

- Supersedes: ADR-001 (Runtime-First Architecture)
- Implementation: `packages/zen-runtime/`, `packages/zen-web/`, `packages/zen-compiler/`
- Inspiration: React's cross-platform architecture, Solid's reactivity model

---

## Decision Makers

- Kyle Tse

---

## Changelog

- 2024-11-19: Initial decision
- 2024-11-19: Created package scaffolding (runtime, web, compiler, native, tui, start)
