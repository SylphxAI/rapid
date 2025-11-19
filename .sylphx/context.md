# Project Context

## What
Zen - Cross-platform reactive framework with fine-grained reactivity.

**Core Packages:**
- `@zen/signal` - Reactive primitives (signal, computed, effect)
- `@zen/runtime` - Platform-agnostic components and utilities
- `@zen/web` - Web renderer (DOM, SSR, hydration)
- `@zen/native` - Native renderer (iOS, Android)
- `@zen/tui` - Terminal UI renderer
- `@zen/compiler` - Optional JSX transformer (auto-lazy, auto-unwrap)
- `@zen/start` - Full-stack meta-framework

**Convenience Package:** `@zen/zen` - Re-exports runtime + web for easy migration

## Why
Provide production-ready reactive framework with:
- Minimal bundle size (1.68 KB for signals, ~5KB total framework)
- Best-in-class performance (competitive with Solid.js)
- Auto-tracking dependencies (no manual dependency arrays)
- **Cross-platform support** (web, native, terminal)
- **Runtime-first architecture** with optional compiler for DX
- 100% type safety

## Who
**Users:** Developers building reactive applications across platforms
**Use cases:**
- Web applications (fine-grained reactivity, no vdom)
- Native mobile apps (React Native-style with Zen)
- CLI/TUI applications (Terminal UI with Zen)
- Full-stack applications (@zen/start meta-framework)
- Cross-framework state management (React, Vue, Preact integrations)

## Status
**Version:** 0.0.0 (managed by changesets)
**Phase:** Active development
**Latest Architecture:** v3.49.x - Prototype-based with automatic micro-batching

## Key Constraints
- Bundle size ≤ 1.75 kB (gzipped, full API) for core signal package
- 100% test coverage on critical paths
- Zero breaking changes to public API within major versions
- Performance competitive with Solid.js signals

## Boundaries
**In scope:**
- Core reactive primitives (signal, computed, effect)
- Platform-agnostic runtime (components, utilities, lifecycle)
- Multi-platform renderers (web, native, terminal)
- Optional compiler for DX (auto-lazy, auto-unwrap)
- Framework integrations (React, Vue, Preact)
- Signal extensions (patterns, persistence, craft)
- Routing (core + framework adapters)
- Full-stack meta-framework (@zen/start)

**Out of scope:**
- Virtual DOM frameworks
- Built-in CSS-in-JS (user choice)
- Complex state machines (use patterns package)
- Time-travel debugging (future devtools package)
- Cloud deployment (use standard tools)

## Source of Truth
- Version: `packages/*/package.json` (managed by changesets)
- Core implementation: `packages/zen-signal/src/zen.ts`
- Tests: `packages/zen-signal/src/zen.test.ts`
- Architecture decisions: `.sylphx/decisions/`
- Package structure: Bun monorepo with Turbo task runner
