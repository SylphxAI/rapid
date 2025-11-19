# Architecture Decision Records

## Index

- [ADR-001: Runtime-First Architecture](#001-runtime-first-architecture) ✅
- [ADR-009: Cross-Platform Architecture](#009-cross-platform-architecture) ✅
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
- Platform-agnostic core (@zen/runtime)
- Platform-specific renderers (@zen/web, @zen/native, @zen/tui)
- Optional compiler for DX (@zen/compiler)

**Current focus:** Cross-platform architecture (ADR-009) and runtime-first framework integrations (ADR-001)
