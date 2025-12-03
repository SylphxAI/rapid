# Architecture Decision Records

## Index

- [ADR-001: Runtime-First Architecture](#001-runtime-first-architecture) ✅
- [ADR-009: Cross-Platform Architecture](#009-cross-platform-architecture) ✅
- [ADR-010: Remove @rapid/zen Package](#010-remove-zen-package) ✅
- [ADR-011: Descriptor Pattern for JSX](#011-descriptor-pattern-jsx) ✅
- [ADR-012: Context Provider Lazy Children](#012-context-provider-lazy-children) ✅
- [ADR-013: Show/Switch Lazy Children Fix](#013-show-switch-lazy-children) ✅
- [ADR-002: Reject Duplicate Subscription Checking](#002-reject-duplicate-subscription-checking)
- [ADR-003: Keep Auto-Batching](#003-keep-auto-batching)
- [ADR-004: Bitflag Pending State](#004-bitflag-pending-state) ❌ Superseded
- [ADR-005: Zero-Allocation Flush](#005-zero-allocation-flush) ❌ Superseded
- [ADR-006: Inline Critical Functions](#006-inline-critical-functions) ❌ Superseded
- [ADR-007: Reject Lazy Array Allocation](#007-reject-lazy-allocation) ❌ Rejected
- [ADR-008: Reject Micro-Optimizations](#008-reject-micro-optimizations) ❌ Rejected

---

## Quick Links

### Active
- [001-runtime-first-architecture.md](001-runtime-first-architecture.md) - Runtime-first with optional compiler for framework integrations
- [009-cross-platform-architecture.md](009-cross-platform-architecture.md) - Cross-platform support (web, native, TUI) with layered architecture
- [010-deprecate-zen-package.md](010-deprecate-zen-package.md) - Remove @rapid/zen in favor of platform-specific packages (@rapid/web, @rapid/tui, @rapid/native)
- [011-descriptor-pattern-jsx.md](011-descriptor-pattern-jsx.md) - Two-phase JSX execution with descriptors to fix Context propagation
- [012-context-provider-lazy-children.md](012-context-provider-lazy-children.md) - Manual getter pattern for nested Providers with ContextProvider helper
- [013-show-switch-lazy-children.md](013-show-switch-lazy-children.md) - Fix Show/Switch to use children() helper for true lazy execution

### Historical (v3.26.0 - superseded by v3.49.0 rewrite)
- [002-reject-duplicate-checking.md](002-reject-duplicate-checking.md) - Why duplicate check hurts performance
- [003-keep-auto-batching.md](003-keep-auto-batching.md) - Why auto-batching essential for smooth effects
- [004-bitflag-pending-state.md](004-bitflag-pending-state.md) - O(1) schedule check (superseded by v3.49.0 architecture)
- [005-zero-allocation-flush.md](005-zero-allocation-flush.md) - Eliminate slice() in hot path (superseded)
- [006-inline-critical-functions.md](006-inline-critical-functions.md) - Remove function call overhead (superseded)

### Rejected
- [007-reject-lazy-allocation.md](007-reject-lazy-allocation.md) - Why lazy allocation failed (-9.3% read regression)
- [008-reject-micro-optimizations.md](008-reject-micro-optimizations.md) - Why micro-optimizations failed (net negative impact)

---

## Architecture Evolution

**v3.1.1:** Simple prototype-based, dirty flags, no timestamps
- Established core patterns still used today

**v3.25.0-v3.26.0:** Optimization experiments
- ADR-002: Reject duplicate checking
- ADR-003: Keep auto-batching
- ADR-004-006: Bitflag state, zero-allocation, inline functions
- ADR-007-008: Rejected optimizations

**v3.48.0:** Automatic micro-batching
- Added micro-batch during signal writes
- Smoother effects, better concurrent update performance

**v3.49.0:** Ultimate architecture (current)
- Combined v3.1.1 simplicity + v3.48.0 batching
- Removed all timestamp overhead
- O(n) inline deduplication
- Superseded ADR-004, ADR-005, ADR-006 (no longer needed)

**v4.0.0 (planned):** Cross-platform architecture (ADR-009)
- Layered architecture: Signal → Runtime → Renderers
- Platform-agnostic core (@rapid/runtime)
- Platform-specific renderers (@rapid/web, @rapid/native, @rapid/tui)
- Optional compiler for DX (@rapid/compiler)

**v5.0.0 (current):** Descriptor Pattern for JSX (ADR-011)
- Two-phase execution: descriptors → orchestrated execution
- Fixes Context propagation in runtime-first architecture
- Preserves fine-grained reactivity (no VDOM, no diffing)
- <1% overhead, zero-config for users

**Current focus:** Descriptor Pattern implementation (ADR-011), cross-platform architecture (ADR-009), and runtime-first framework integrations (ADR-001)
