# Project Context

## What
Zen - Ultra-fast reactive state management ecosystem with auto-tracking signals.

**Core Package:** `@zen/signal` - Reactive primitives (signal, computed, effect)
**Framework:** `@zen/zen` - Fine-grained reactive framework with no virtual DOM

## Why
Provide production-ready reactive primitives with:
- Minimal bundle size (1.68 KB gzipped for @zen/signal)
- Best-in-class performance (competitive with Solid.js)
- Auto-tracking dependencies (no manual dependency arrays)
- 100% type safety

## Who
**Users:** Frontend developers needing lightweight, fast reactive state
**Use cases:**
- Cross-framework state management (React, Vue, Preact, or framework-agnostic)
- Fine-grained UI frameworks (Zen framework)
- Performance-critical applications

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
- Auto-tracking dependency system
- Framework integrations (React, Vue, Preact, Zen)
- Signal extensions (patterns, persistence, craft)
- Routing (core + framework adapters)
- Universal bundler plugin (unplugin-zen-signal)

**Out of scope:**
- Virtual DOM frameworks
- Server-side rendering (handled separately in @zen/zen)
- Complex state machines (use patterns package)
- Time-travel debugging (future devtools package)

## Source of Truth
- Version: `packages/*/package.json` (managed by changesets)
- Core implementation: `packages/zen-signal/src/zen.ts`
- Tests: `packages/zen-signal/src/zen.test.ts`
- Architecture decisions: `.sylphx/decisions/`
- Package structure: Bun monorepo with Turbo task runner
