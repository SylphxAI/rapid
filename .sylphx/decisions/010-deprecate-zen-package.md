# 010. Remove @rapid/zen in Favor of Platform-Specific Packages

**Status:** ✅ Accepted
**Date:** 2024-11-21

## Context

The `@rapid/zen` package was initially created as a convenience wrapper that re-exported `@rapid/web`. However, this created confusion about Zen's multi-platform architecture:

1. **Naming confusion**: The name `@rapid/zen` suggested it represented the entire Zen framework, but it only provided the web renderer
2. **Multiple import paths**: Users could get the web renderer from either `@rapid/zen` or `@rapid/web`, creating inconsistency
3. **Unclear platform story**: With TUI and Native renderers now available/planned, the existence of `@rapid/zen` obscured the platform-specific nature of renderers
4. **Poor discoverability**: New users weren't immediately aware that Zen supports multiple platforms

## Decision

Remove `@rapid/zen` package entirely and require explicit platform package imports:
- `@rapid/web` for web applications
- `@rapid/tui` for terminal/CLI applications
- `@rapid/native` for mobile applications (coming soon)

## Rationale

**Clarity and Explicitness:**
- Package name directly indicates target platform
- No ambiguity about which renderer you're using
- Clear mental model: one package per platform

**Better Tree-Shaking:**
- Users only install dependencies for their target platform
- No unnecessary dependencies bundled
- Smaller production bundles

**Industry Standard:**
- Follows React (`react-dom`, `react-native`)
- Follows Vue (`@vue/runtime-dom`, `@vue/runtime-core`)
- Follows Solid (`solid-js/web`, `solid-js/store`)
- Familiar pattern for developers

**Architectural Alignment:**
- Reflects the layered architecture (Signal → Runtime → Platform Renderer)
- Makes cross-platform capabilities discoverable
- Encourages platform-specific optimizations

## Alternatives Considered

### Option A: Make @rapid/zen a True Meta Package
Export all platforms from `@rapid/zen`:
```ts
export * from '@rapid/web';
export * from '@rapid/tui';
export * from '@rapid/native';
```

**Rejected because:**
- Large bundle size (includes all platforms)
- Poor tree-shaking (hard to eliminate unused platforms)
- Naming still confusing (why `@rapid/zen` instead of just platform packages?)
- Users must understand which exports come from which platform

### Option B: Keep Current Structure
Maintain `@rapid/zen` as alias to `@rapid/web`.

**Rejected because:**
- Doesn't solve naming confusion
- Doesn't make multi-platform story clear
- Two ways to import same functionality
- Inconsistent with platform packages (`@rapid/tui`, `@rapid/native`)

## Implementation

Since the package was never published, we removed it entirely rather than deprecating:

1. **Delete package**: Remove `packages/zen/` directory
2. **Update documentation**: Show platform-specific imports in all examples
3. **Update internal code**: Migrate website to use `@rapid/web`
4. **Update architecture docs**: Remove references to `@rapid/zen`

## Consequences

**Positive:**
- ✅ Clear, explicit platform selection
- ✅ Better tree-shaking and bundle sizes
- ✅ Discoverable multi-platform support
- ✅ Industry-standard pattern
- ✅ Encourages platform-specific optimizations

**Negative:**
- ❌ Slightly longer import paths (`@rapid/web` vs `@rapid/zen`)
- ❌ Need to update all documentation and examples

**Note:**
- No breaking change since package was never published
- Direct removal cleaner than deprecation

## References

- Implementation: `packages/zen-web/`, `packages/zen-tui/`
- Related: ADR-009 (Cross-Platform Architecture)
